# Hackathon Navigator AI

Product Requirements Document (PRD)



HackPilot



AI Workspace for Hackathon Teams



Version: 1.0



Owner: Israel Mathivha



---



1. Executive Summary



HackPilot is an AI-powered collaboration platform built specifically for hackathons. It helps individuals and teams manage their entire hackathon journey—from brainstorming ideas to submitting their final project—all within one workspace.



Unlike general productivity tools, HackPilot understands the unique pace, pressure, and workflow of hackathons. It combines AI planning, collaboration, task management, progress tracking, and submission assistance into a single platform.



---



2. Vision



Become the default platform every hackathon team uses to plan, build, collaborate, and submit projects.



---



3. Problem Statement



Hackathon teams currently rely on many disconnected tools:



- Discord

- WhatsApp

- GitHub

- Notion

- Trello

- Google Docs

- ChatGPT

- Devpost



Switching between tools causes:



- Lost information

- Poor communication

- Missed deadlines

- Unclear priorities

- Rushed submissions

- Reduced productivity



Teams spend too much time organizing work instead of building great projects.



---



4. Solution



HackPilot provides one AI-powered workspace where teams can:



- Plan projects

- Collaborate

- Track progress

- Manage tasks

- Receive AI guidance

- Prepare submissions

- Stay accountable



---



5. Target Users



Primary Users



- University students

- Hackathon participants

- First-time hackers

- Startup weekend participants



Secondary Users



- Hackathon organizers

- Mentors

- Judges



---



6. Success Metrics



- Users create projects successfully.

- Teams complete daily updates.

- Tasks are actively managed.

- AI features are used regularly.

- Users generate submission documents.

- Positive feedback from hackathon participants.



---



7. MVP Scope



The MVP must include:



Authentication



- Email authentication

- Google authentication

- User profiles



---



Dashboard



Displays:



- Current hackathons

- Days remaining

- Progress

- Tasks

- Team activity

- Recent updates



---



Project Creation



Users can:



- Create project

- Upload logo

- Add description

- Choose hackathon

- Set deadline

- Invite teammates



---



AI Project Planner



Input:



Project idea



Output:



- Milestones

- Timeline

- Development phases

- Prioritized tasks

- Suggested technologies



---



Task Board



Kanban Board



Columns:



- Backlog

- To Do

- In Progress

- Review

- Done



Task Features



- Assign members

- Due dates

- Priority

- Labels

- Comments



---



Team Workspace



Features:



- Team discussion

- Shared notes

- File uploads

- AI summaries



---



Daily Stand-up



Every member answers



- What did you finish?

- What will you do today?

- Any blockers?



AI automatically:



- Summarizes progress

- Detects risks

- Suggests priorities



---



AI Mentor



Capabilities



- Brainstorm features

- Improve originality

- Recommend priorities

- Explain judging criteria

- Suggest improvements



---



Progress Dashboard



Shows



- Progress %

- Team contribution

- Task completion

- Remaining work

- Timeline



---



Submission Center



Generate automatically



- README

- Devpost submission

- Project overview

- Technology stack

- Demo script

- Elevator pitch



---



Readiness Score



AI evaluates



- Working prototype

- Documentation

- UI

- Innovation

- Demo quality

- Code completeness



Returns score



Example



82/100



Recommendations:



- Improve screenshots

- Finish testing

- Record demo



---



8. User Roles



Participant



Can



- Create projects

- Join teams

- Update progress

- Complete tasks

- Use AI



Team Leader



Can additionally



- Invite members

- Assign tasks

- Manage project settings



---



9. Functional Requirements



Authentication



- Sign up

- Login

- Logout



Projects



- Create

- Edit

- Archive

- Delete



Tasks



- CRUD operations

- Drag-and-drop board

- Filters

- Search



Discussion



- Threaded messages

- Mentions

- Reactions



Notifications



- Task assignments

- Deadlines

- Daily reminders



AI



- Chat assistant

- Project planning

- Submission writing

- Progress summaries



Files



- Upload

- Preview

- Download



Analytics



- Charts

- Team productivity

- Completion trends



---



10. Non-functional Requirements



Performance



- Page load <2 seconds



Security



- Authentication required

- Row-level security

- HTTPS



Responsive



- Desktop

- Tablet

- Mobile



Accessibility



- WCAG compliant



---



11. Suggested Technology Stack



Frontend



- Next.js

- React

- TypeScript

- Tailwind CSS

- shadcn/ui



Backend



- Supabase



Database



- PostgreSQL



Authentication



- Supabase Auth



Storage



- Supabase Storage



AI



- OpenAI API



Charts



- Recharts



Deployment



- Vercel



---



12. Database Design



Users



Projects



ProjectMembers



Tasks



Comments



DailyUpdates



Messages



Files



Milestones



Notifications



AIConversations



GeneratedDocuments



---



13. UI Pages



Landing Page



Authentication



Dashboard



Project Overview



Roadmap



Kanban Board



Team Hub



Daily Updates



AI Mentor



Files



Analytics



Submission Center



Settings



---



14. Future Features



GitHub integration



Discord integration



Slack integration



Calendar sync



AI code review



Voice meetings



Sprint planning



Mentor marketplace



Hackathon discovery



Judge mode



Organizer dashboard



Live leaderboard



AI presentation generator



Pitch practice mode



---



15. Design Guidelines



ThemeProduct Requirements Document (PRD)



HackPilot



AI Workspace for Hackathon Teams



Version: 1.0



Owner: Israel Mathivha



---



1. Executive Summary



HackPilot is an AI-powered collaboration platform built specifically for hackathons. It helps individuals and teams manage their entire hackathon journey—from brainstorming ideas to submitting their final project—all within one workspace.



Unlike general productivity tools, HackPilot understands the unique pace, pressure, and workflow of hackathons. It combines AI planning, collaboration, task management, progress tracking, and submission assistance into a single platform.



---



2. Vision



Become the default platform every hackathon team uses to plan, build, collaborate, and submit projects.



---



3. Problem Statement



Hackathon teams currently rely on many disconnected tools:



- Discord

- WhatsApp

- GitHub

- Notion

- Trello

- Google Docs

- ChatGPT

- Devpost



Switching between tools causes:



- Lost information

- Poor communication

- Missed deadlines

- Unclear priorities

- Rushed submissions

- Reduced productivity



Teams spend too much time organizing work instead of building great projects.



---



4. Solution



HackPilot provides one AI-powered workspace where teams can:



- Plan projects

- Collaborate

- Track progress

- Manage tasks

- Receive AI guidance

- Prepare submissions

- Stay accountable



---



5. Target Users



Primary Users



- University students

- Hackathon participants

- First-time hackers

- Startup weekend participants



Secondary Users



- Hackathon organizers

- Mentors

- Judges



---



6. Success Metrics



- Users create projects successfully.

- Teams complete daily updates.

- Tasks are actively managed.

- AI features are used regularly.

- Users generate submission documents.

- Positive feedback from hackathon participants.



---



7. MVP Scope



The MVP must include:



Authentication



- Email authentication

- Google authentication

- User profiles



---



Dashboard



Displays:



- Current hackathons

- Days remaining

- Progress

- Tasks

- Team activity

- Recent updates



---



Project Creation



Users can:



- Create project

- Upload logo

- Add description

- Choose hackathon

- Set deadline

- Invite teammates



---



AI Project Planner



Input:



Project idea



Output:



- Milestones

- Timeline

- Development phases

- Prioritized tasks

- Suggested technologies



---



Task Board



Kanban Board



Columns:



- Backlog

- To Do

- In Progress

- Review

- Done



Task Features



- Assign members

- Due dates

- Priority

- Labels

- Comments



---



Team Workspace



Features:



- Team discussion

- Shared notes

- File uploads

- AI summaries



---



Daily Stand-up



Every member answers



- What did you finish?

- What will you do today?

- Any blockers?



AI automatically:



- Summarizes progress

- Detects risks

- Suggests priorities



---



AI Mentor



Capabilities



- Brainstorm features

- Improve originality

- Recommend priorities

- Explain judging criteria

- Suggest improvements



---



Progress Dashboard



Shows



- Progress %

- Team contribution

- Task completion

- Remaining work

- Timeline



---



Submission Center



Generate automatically



- README

- Devpost submission

- Project overview

- Technology stack

- Demo script

- Elevator pitch



---



Readiness Score



AI evaluates



- Working prototype

- Documentation

- UI

- Innovation

- Demo quality

- Code completeness



Returns score



Example



82/100



Recommendations:



- Improve screenshots

- Finish testing

- Record demo



---



8. User Roles



Participant



Can



- Create projects

- Join teams

- Update progress

- Complete tasks

- Use AI



Team Leader



Can additionally



- Invite members

- Assign tasks

- Manage project settings



---



9. Functional Requirements



Authentication



- Sign up

- Login

- Logout



Projects



- Create

- Edit

- Archive

- Delete



Tasks



- CRUD operations

- Drag-and-drop board

- Filters

- Search



Discussion



- Threaded messages

- Mentions

- Reactions



Notifications



- Task assignments

- Deadlines

- Daily reminders



AI



- Chat assistant

- Project planning

- Submission writing

- Progress summaries



Files



- Upload

- Preview

- Download



Analytics



- Charts

- Team productivity

- Completion trends



---



10. Non-functional Requirements



Performance



- Page load <2 seconds



Security



- Authentication required

- Row-level security

- HTTPS



Responsive



- Desktop

- Tablet

- Mobile



Accessibility



- WCAG compliant



---



11. Suggested Technology Stack



Frontend



- Next.js

- React

- TypeScript

- Tailwind CSS

- shadcn/ui



Backend



- Supabase



Database



- PostgreSQL



Authentication



- Supabase Auth



Storage



- Supabase Storage



AI



- OpenAI API



Charts



- Recharts



Deployment



- Vercel



---



12. Database Design



Users



Projects



ProjectMembers



Tasks



Comments



DailyUpdates



Messages



Files



Milestones



Notifications



AIConversations



GeneratedDocuments



---



13. UI Pages



Landing Page



Authentication



Dashboard



Project Overview



Roadmap



Kanban Board



Team Hub



Daily Updates



AI Mentor



Files



Analytics



Submission Center



Settings



---



14. Future Features



GitHub integration



Discord integration



Slack integration



Calendar sync



AI code review



Voice meetings



Sprint planning



Mentor marketplace



Hackathon discovery



Judge mode



Organizer dashboard



Live leaderboard



AI presentation generator



Pitch practice mode



---



15. Design Guidelines



Theme



Dark modern interface



Primary Color



Purple



Accent



Blue



Style



Minimal



Rounded cards



Soft shadows



Professional typography



Responsive layouts



Inspired by Linear, Notion, GitHub, and Vercel.



---



16. Elevator Pitch



HackPilot is an AI-powered workspace built specifically for hackathons. It combines planning, collaboration, AI guidance, progress tracking, and submission tools into one platform, helping teams spend less time managing tools and more time building winning projects.



Dark modern interface



Primary Color



Purple



Accent



Blue



Style



Minimal



Rounded cards



Soft shadows



Professional typography



Responsive layouts



Inspired by Linear, Notion, GitHub, and Vercel.



---



16. Elevator Pitch



HackPilot is an AI-powered workspace built specifically for hackathons. It combines planning, collaboration, AI guidance, progress tracking, and submission tools into one platform, helping teams spend less time managing tools and more time building winning projects.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hackathon-ai-pilot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9031f093-34f0-4797-9111-5c884bc74aee).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
