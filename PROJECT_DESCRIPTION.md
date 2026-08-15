# HackPilot — Project Description

> AI-powered workspace built specifically for hackathon teams.

---

## Problem Statement

Hackathon teams currently rely on a fragmented stack of disconnected tools to plan, build, and submit their projects:

- **Discord / WhatsApp** for communication
- **GitHub** for code
- **Notion / Google Docs** for notes and documentation
- **Trello / Jira** for task management
- **ChatGPT** for AI help
- **Devpost** for submissions

Constantly switching between these tools causes:

- Lost information and scattered context
- Poor team communication
- Missed deadlines
- Unclear priorities
- Rushed, low-quality submissions
- Reduced overall productivity

Teams end up spending more time managing their workflow than actually building great projects.

---

## Solution Overview

**HackPilot** is an all-in-one AI workspace designed specifically for the fast-paced, high-pressure environment of hackathons. It combines planning, collaboration, task management, AI guidance, progress tracking, and submission assistance into a single platform.

By centralizing everything a hackathon team needs in one place, HackPilot helps teams:

- Move from idea to execution faster with AI-generated project plans
- Stay aligned with a built-in Kanban board, team hub, and daily standups
- Track progress and contribution in real time
- Generate submission-ready documents (README, Devpost, pitch, demo script)
- Evaluate submission readiness with an AI-powered readiness score

HackPilot lets teams spend less time juggling tools and more time building winning projects.

---

## Key Features

### 1. Authentication & Profiles
- Email and Google authentication
- User profiles with avatars and bios

### 2. Dashboard
- Overview of current hackathons
- Days remaining, progress, tasks, and recent team activity

### 3. Project Creation
- Create projects with name, description, logo, and deadline
- Choose from a seeded list of hackathons or add a custom one
- Invite teammates via a shareable invite link

### 4. AI Project Planner
- Input your project idea
- AI generates:
  - Project summary
  - Suggested tech stack
  - Development phases
  - Milestones with timelines
  - Prioritized tasks with labels

### 5. Kanban Task Board
- Drag-ready columns: Backlog, To Do, In Progress, Review, Done
- Assign members, set due dates, priority, and labels
- Comment on tasks

### 6. Team Workspace
- Real-time team discussion with @mentions and reactions
- Shared scratchpad notes
- File uploads and previews

### 7. Daily Stand-up
- Each member answers: What did you finish? What will you do today? Any blockers?
- AI summarizes progress, detects risks, and suggests priorities

### 8. AI Mentor
- Chat with an AI mentor to:
  - Brainstorm features
  - Improve originality
  - Recommend priorities
  - Explain judging criteria
  - Suggest improvements

### 9. Progress Dashboard
- Visual analytics showing:
  - Task completion rate
  - Work distribution across team members
  - Status breakdown
  - Timeline progress

### 10. Submission Center
- AI-generated submission documents:
  - README
  - Devpost submission
  - Project overview
  - Technology stack
  - Demo script
  - Elevator pitch

### 11. Readiness Score
- AI evaluates the project across criteria:
  - Working prototype
  - Documentation
  - UI/UX
  - Innovation
  - Demo quality
  - Code completeness
- Returns a score out of 100 plus actionable recommendations

---

## Technologies Used

### Frontend
- **React 19**
- **TanStack Start** (full-stack React framework with SSR/SSG)
- **TanStack Router**
- **TanStack Query**
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui**

### Backend
- **Lovable Cloud / Supabase**
- **PostgreSQL**
- **Supabase Auth**
- **Supabase Storage**
- **Row-Level Security (RLS)**

### AI
- **Lovable AI Gateway**
- **Gemini 3.6 Flash**

### UI / UX
- **Lucide React** icons
- **Recharts** for analytics
- **React Markdown** for rich AI-generated content

### Deployment
- **Vite 7**
- **Lovable** deployment platform

---

## Target Users

### Primary Users
- University students participating in hackathons
- Hackathon participants and competitors
- First-time hackers who need guidance
- Startup weekend participants

### Secondary Users
- Hackathon organizers
- Mentors supporting teams
- Judges reviewing submissions

---

## Live Demo

- **Live app**: https://hackathon-ai-pilot.lovable.app
- **Built with**: [Lovable](https://lovable.dev)

---

## Elevator Pitch

HackPilot is an AI-powered workspace built specifically for hackathons. It combines planning, collaboration, AI guidance, progress tracking, and submission tools into one platform, helping teams spend less time managing tools and more time building winning projects.
