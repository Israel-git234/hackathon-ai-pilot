export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Hackathon {
  id: string;
  name: string;
  location: string | null;
  url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  idea: string | null;
  logo_path: string | null;
  hackathon_id: string | null;
  hackathon_name: string | null;
  deadline: string | null;
  invite_code: string;
  created_by: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  member_role: "leader" | "member";
  joined_at: string;
  profile?: Profile;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  position: number;
  done: boolean;
  created_at: string;
}

export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  project_id: string;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  labels: string[];
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface DailyUpdate {
  id: string;
  project_id: string;
  user_id: string;
  update_date: string;
  finished: string;
  planned: string;
  blockers: string;
  created_at: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  project_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  reactions: Record<string, string[]>;
  created_at: string;
  profile?: Profile;
}

export interface SharedNote {
  project_id: string;
  content: string;
  updated_by: string | null;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  uploader_id: string;
  file_name: string;
  file_path: string;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
  profile?: Profile;
  signed_url?: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  project_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface AiConversation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export type DocType = "readme" | "devpost" | "overview" | "tech_stack" | "demo_script" | "pitch";

export interface GeneratedDocument {
  id: string;
  project_id: string;
  doc_type: DocType;
  content: string;
  updated_by: string | null;
  updated_at: string;
}

export interface ProjectPlan {
  summary: string;
  tech_stack: string[];
  phases: { name: string; description: string; duration: string }[];
  milestones: { title: string; description: string; due_offset_days: number }[];
  tasks: { title: string; description: string; priority: TaskPriority; labels: string[]; phase: string }[];
}

export interface ReadinessResult {
  score: number;
  breakdown: { criterion: string; score: number; max: number; note: string }[];
  recommendations: string[];
}
