import { createLovableAiGatewayProvider, AI_MODEL } from "./ai-gateway.server";
import { profilesById, type Db } from "./db.server";

export { AI_MODEL };

export function getGateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this workspace.");
  return createLovableAiGatewayProvider(key);
}

export function friendlyAiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) {
    return new Error("AI rate limit reached. Wait a moment and try again.");
  }
  if (message.includes("402")) {
    return new Error("AI credits are exhausted. Add credits in your workspace billing settings.");
  }
  return new Error(message);
}

export async function buildProjectContext(supabase: Db, projectId: string): Promise<string> {
  const [projectRes, membersRes, milestonesRes, tasksRes, standupsRes, docsRes] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("project_members").select("user_id, member_role").eq("project_id", projectId),
      supabase
        .from("milestones")
        .select("title, description, due_date, done, position")
        .eq("project_id", projectId)
        .order("position"),
      supabase
        .from("tasks")
        .select("title, status, priority, assignee_id, due_date, labels")
        .eq("project_id", projectId),
      supabase
        .from("daily_updates")
        .select("user_id, update_date, finished, planned, blockers")
        .eq("project_id", projectId)
        .order("update_date", { ascending: false })
        .limit(20),
      supabase.from("generated_documents").select("doc_type").eq("project_id", projectId),
    ]);

  const project = projectRes.data;
  const members = membersRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const milestones = milestonesRes.data ?? [];
  const standups = standupsRes.data ?? [];
  const docs = docsRes.data ?? [];

  const profiles = await profilesById(supabase, [
    ...members.map((m) => m.user_id),
    ...tasks.map((t) => t.assignee_id),
    ...standups.map((s) => s.user_id),
  ]);

  const name = (id: string | null | undefined) =>
    (id && profiles.get(id)?.display_name) || "Unassigned";

  const lines: string[] = [];
  lines.push(`PROJECT: ${project?.name ?? "Unknown"}`);
  if (project?.description) lines.push(`Description: ${project.description}`);
  if (project?.idea) lines.push(`Idea: ${project.idea}`);
  if (project?.hackathon_name) lines.push(`Hackathon: ${project.hackathon_name}`);
  if (project?.deadline) lines.push(`Deadline: ${project.deadline}`);
  lines.push(
    `Team: ${members.map((m) => `${name(m.user_id)} (${m.member_role})`).join(", ") || "none"}`,
  );
  lines.push(
    `Milestones: ${
      milestones
        .map((m) => `${m.title}${m.done ? " [done]" : ""}${m.due_date ? ` (due ${m.due_date})` : ""}`)
        .join("; ") || "none"
    }`,
  );
  lines.push(
    `Tasks (${tasks.length}): ${
      tasks
        .map(
          (t) =>
            `[${t.status}] ${t.title} (${t.priority}${t.assignee_id ? `, ${name(t.assignee_id)}` : ""}${t.due_date ? `, due ${t.due_date}` : ""})`,
        )
        .join(" | ") || "none"
    }`,
  );
  if (standups.length > 0) {
    lines.push(
      `Recent standups: ${standups
        .map(
          (s) =>
            `${s.update_date} ${name(s.user_id)}: finished "${s.finished}"; planned "${s.planned}"; blockers "${s.blockers}"`,
        )
        .join(" || ")}`,
    );
  }
  lines.push(`Generated documents: ${docs.map((d) => d.doc_type).join(", ") || "none"}`);
  return lines.join("\n");
}
