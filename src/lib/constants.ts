import type { DocType, TaskPriority, TaskStatus } from "./types";

export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

export const PRIORITIES: { id: TaskPriority; label: string; className: string }[] = [
  { id: "low", label: "Low", className: "text-muted-foreground" },
  { id: "medium", label: "Medium", className: "text-blue" },
  { id: "high", label: "High", className: "text-warning" },
  { id: "urgent", label: "Urgent", className: "text-destructive" },
];

export const DOC_TYPES: { id: DocType; label: string; description: string }[] = [
  { id: "readme", label: "README", description: "A polished GitHub-style README for the project" },
  { id: "devpost", label: "Devpost submission", description: "Inspiration, what it does, how we built it, challenges, accomplishments, what's next" },
  { id: "overview", label: "Project overview", description: "A one-page overview of the problem, solution, and impact" },
  { id: "tech_stack", label: "Technology stack", description: "Architecture and technology choices, explained" },
  { id: "demo_script", label: "Demo script", description: "A minute-by-minute script for the live demo" },
  { id: "pitch", label: "Elevator pitch", description: "A 60-second spoken pitch for the judges" },
];

export const MENTOR_SUGGESTIONS = [
  "Brainstorm features that would impress judges",
  "How can we make our idea more original?",
  "What should we prioritize with 24 hours left?",
  "Explain typical hackathon judging criteria",
  "Review our project idea and suggest improvements",
];
