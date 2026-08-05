# HackPilot — AI Workspace for Hackathon Teams

Build the full MVP from the PRD in one pass: an AI-powered hackathon workspace with auth, dashboard, project creation, AI planner, kanban board, team hub, daily standups, AI mentor, progress analytics, submission center, and in-app notifications.

## Decisions locked in

- **Scope:** Full MVP in one pass
- **Hackathons:** Seeded list of known hackathons + custom name/deadline
- **Team invites:** Shareable invite links (leaders generate, members join by opening)
- **Notifications:** In-app notification center only
- **Stack mapping:** The PRD suggests Next.js/OpenAI/Vercel — this project uses the fixed platform stack instead: TanStack Start (React + TypeScript), Lovable Cloud (Postgres, auth, storage — everything Supabase offers, zero setup), Lovable AI Gateway for all AI features, Recharts for charts, Tailwind + shadcn/ui.

## Design

Dark modern interface per the PRD: deep near-black background, purple primary, blue accent, minimal layout, rounded cards, soft shadows, professional typography. Inspired by Linear / Notion / GitHub / Vercel — sidebar app shell, command-center feel. Dark theme is the default and only theme for MVP.

## Build order

### 1. Foundation
- Enable Lovable Cloud (database, auth, storage in one step)
- Design tokens in `src/styles.css` (dark palette: purple primary, blue accent)
- App shell: sidebar navigation + topbar with notification bell and user menu
- Public landing page at `/` (hero, features, CTA) and `/auth` (sign in / sign up)
- Protected app under `_authenticated/` (dashboard, projects, etc.)
- Route-level head metadata (title, description, og tags) on every page

### 2. Database schema (one migration, with GRANTs + RLS)
- `profiles` — auto-created on signup via trigger (display name, avatar)
- `user_roles` + `has_role()` security-definer function (participant, team_leader)
- `hackathons` — seeded with ~10 well-known events (name, dates, location)
- `projects` — name, description, logo, hackathon, deadline, invite code, archived
- `project_members` — project ↔ user with member role (leader/member)
- `milestones`, `tasks` (status, priority, labels, assignee, due date, position), `task_comments`
- `daily_updates` — yesterday / today / blockers per member per day
- `messages` — threaded team discussion with mentions and reactions
- `files` — metadata for storage uploads
- `notifications` — assignments, mentions, deadline reminders
- `ai_conversations` + `ai_messages` — mentor chat history
- `generated_documents` — submission-center outputs
- Storage buckets: `project-logos` (public), `project-files` (private), each with RLS policies
- All tables: GRANTs, RLS enabled, owner/member-scoped policies

### 3. Auth & profiles
- Email/password (sign up, login, logout, password reset with `/reset-password`)
- Google sign-in via the managed OAuth helper
- Profile page + avatar upload; session-aware header (account menu when signed in)

### 4. Dashboard
- Current hackathons with countdown (days remaining)
- Progress ring per project, open tasks, team activity feed, recent updates

### 5. Project creation & invite flow
- Wizard: name, description, logo upload, hackathon picker (seeded list or custom), deadline
- Invite link generation (`/join/$code` — signed-in users join instantly)
- Project overview page: details, milestones/roadmap, members, archive/delete (leader only)

### 6. AI Project Planner (Lovable AI, gemini-3.6-flash, structured output)
- Input: project idea (+ hackathon context)
- Output: milestones, timeline, development phases, prioritized tasks, suggested tech stack
- One-click "apply plan" → creates milestones and tasks in the project

### 7. Kanban board
- Columns: Backlog, To Do, In Progress, Review, Done — drag-and-drop with persisted positions
- Task cards: assignee, due date, priority, labels; task detail drawer with comments
- Filters (assignee, priority, label) and search; assignment triggers notification

### 8. Team Hub
- Threaded discussion with @mentions and emoji reactions
- Shared notes (collapsible note panel per project)
- File uploads with preview/download (Supabase Storage)
- AI summary of recent discussion (streaming)

### 9. Daily Stand-up
- Per-member form: finished / today / blockers (one per day, editable same day)
- Team feed of today's updates
- AI digest: progress summary, risk detection, suggested priorities

### 10. AI Mentor
- Streaming chat (`/api/chat` server route + `useChat`), markdown rendering
- Hackathon-tuned system prompt: brainstorm features, originality, priorities, judging criteria, improvements
- Conversation history per project persisted in `ai_conversations`/`ai_messages`

### 11. Progress & Analytics (Recharts)
- Progress %, task completion over time, per-member contribution, remaining work
- Timeline vs deadline burn view

### 12. Submission Center + Readiness Score
- AI-generates (streaming, saved as editable documents): README, Devpost submission, project overview, tech stack, demo script, elevator pitch
- Readiness Score: AI evaluates prototype, docs, UI, innovation, demo, code completeness → score /100 + recommendations, rendered as gauge + checklist

### 13. Notifications & settings
- Notification center (bell dropdown + page): task assignments, mentions, deadlines, daily standup reminder
- Project settings (rename, deadline, regenerate invite link, danger zone), user settings (profile, password)

## Technical details

- **AI calls:** `createLovableAiGatewayProvider` in `src/lib/ai-gateway.server.ts`; one-shot generations (planner, standup digest, readiness score, submission docs) as `createServerFn`s with `Output.object` schemas and `NoObjectGeneratedError` fallback; mentor chat + summaries stream via `/api/chat` server route. Long generations use `streamText` consumed server-side. All AI reads project context server-side; `LOVABLE_API_KEY` never leaves the server.
- **Server data access:** `requireSupabaseAuth` middleware server functions for all user data; browser client for realtime-feel updates; service-role client never used for ordinary reads.
- **RLS:** members can only read/write rows for projects they belong to; leaders get extra write policies; roles live in `user_roles` (never on profiles).
- **Validation:** zod schemas on every form and server-function input.
- **Routing:** public landing `/`, `/auth`, `/join/$code`; everything else under `_authenticated/` — `/dashboard`, `/projects/$id` with nested board/team/standup/mentor/files/analytics/submission/settings tabs.
- **Performance:** route loaders with `ensureQueryData`, lazy-loaded charts, image lazy loading.
