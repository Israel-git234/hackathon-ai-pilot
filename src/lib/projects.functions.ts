import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  profilesById,
  requireLeadership,
  requireMembership,
  signedLogoUrl,
} from "./db.server";
import type { Database } from "@/integrations/supabase/types";
import type { Milestone, ProjectMember } from "./types";

export const listHackathons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("hackathons")
      .select("*")
      .order("starts_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listMyProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: memberships, error: mErr } = await supabase
      .from("project_members")
      .select("project_id, member_role")
      .eq("user_id", userId);
    if (mErr) throw new Error(mErr.message);
    const ids = (memberships ?? []).map((m) => m.project_id);
    if (ids.length === 0) return [];

    const [projectsRes, tasksRes, membersRes] = await Promise.all([
      supabase.from("projects").select("*").in("id", ids).order("created_at", { ascending: false }),
      supabase.from("tasks").select("id, project_id, status").in("project_id", ids),
      supabase.from("project_members").select("project_id").in("project_id", ids),
    ]);
    if (projectsRes.error) throw new Error(projectsRes.error.message);

    const roleByProject = new Map((memberships ?? []).map((m) => [m.project_id, m.member_role]));
    const tasks = tasksRes.data ?? [];
    const memberCounts = new Map<string, number>();
    for (const row of membersRes.data ?? []) {
      memberCounts.set(row.project_id, (memberCounts.get(row.project_id) ?? 0) + 1);
    }

    const projects = await Promise.all(
      (projectsRes.data ?? []).map(async (p) => {
        const projectTasks = tasks.filter((t) => t.project_id === p.id);
        return {
          ...p,
          logo_url: await signedLogoUrl(supabase, p.logo_path),
          my_role: roleByProject.get(p.id) ?? "member",
          member_count: memberCounts.get(p.id) ?? 0,
          total_tasks: projectTasks.length,
          done_tasks: projectTasks.filter((t) => t.status === "done").length,
        };
      }),
    );
    return projects;
  });

export const getProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);

    const [projectRes, membersRes, milestonesRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", data.projectId).single(),
      supabase
        .from("project_members")
        .select("*")
        .eq("project_id", data.projectId)
        .order("joined_at"),
      supabase
        .from("milestones")
        .select("*")
        .eq("project_id", data.projectId)
        .order("position"),
    ]);
    if (projectRes.error || !projectRes.data) throw new Error("Project not found.");

    const profiles = await profilesById(supabase, (membersRes.data ?? []).map((m) => m.user_id));
    const members: ProjectMember[] = (membersRes.data ?? []).map((m) => ({
      ...m,
      member_role: m.member_role as ProjectMember["member_role"],
      profile: profiles.get(m.user_id),
    }));

    return {
      project: projectRes.data,
      logo_url: await signedLogoUrl(supabase, projectRes.data.logo_path),
      members,
      milestones: (milestonesRes.data ?? []) as Milestone[],
      my_role: members.find((m) => m.user_id === userId)?.member_role ?? "member",
    };
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        name: z.string().min(2).max(80),
        description: z.string().max(2000).nullish(),
        idea: z.string().max(4000).nullish(),
        hackathon_id: z.string().uuid().nullish(),
        hackathon_name: z.string().max(120).nullish(),
        deadline: z.string().nullish(),
        logo_path: z.string().max(300).nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const invite_code = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: data.name,
        description: data.description ?? null,
        idea: data.idea ?? null,
        hackathon_id: data.hackathon_id ?? null,
        hackathon_name: data.hackathon_name ?? null,
        deadline: data.deadline ?? null,
        logo_path: data.logo_path ?? null,
        invite_code,
        created_by: userId,
      })
      .select()
      .single();
    if (error || !project) throw new Error(error?.message ?? "Could not create project.");

    const { error: memberError } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: userId,
      member_role: "leader",
    });
    if (memberError) throw new Error(memberError.message);
    return project;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        name: z.string().min(2).max(80).optional(),
        description: z.string().max(2000).nullish(),
        idea: z.string().max(4000).nullish(),
        hackathon_name: z.string().max(120).nullish(),
        deadline: z.string().nullish(),
        archived: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireLeadership(supabase, data.projectId, userId);
    const update: Database["public"]["Tables"]["projects"]["Update"] = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.idea !== undefined) update.idea = data.idea;
    if (data.hackathon_name !== undefined) update.hackathon_name = data.hackathon_name;
    if (data.deadline !== undefined) update.deadline = data.deadline;
    if (data.archived !== undefined) update.archived = data.archived;
    const { error } = await supabase.from("projects").update(update).eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireLeadership(supabase, data.projectId, userId);
    const { error } = await supabase.from("projects").delete().eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const regenerateInviteCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireLeadership(supabase, data.projectId, userId);
    const invite_code = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const { error } = await supabase
      .from("projects")
      .update({ invite_code })
      .eq("id", data.projectId);
    if (error) throw new Error(error.message);
    return { invite_code };
  });

export const getInvitePreview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(4).max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("get_invite_preview", {
      _code: data.code,
    });
    if (error) throw new Error(error.message);
    return rows?.[0] ?? null;
  });

export const joinProjectByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(4).max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: projectId, error } = await context.supabase.rpc("join_project_by_invite", {
      _code: data.code,
    });
    if (error) throw new Error("This invite link is invalid or has expired.");
    return { projectId };
  });

export const createMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        title: z.string().min(1).max(160),
        description: z.string().max(1000).nullish(),
        due_date: z.string().nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { count } = await supabase
      .from("milestones")
      .select("id", { count: "exact", head: true })
      .eq("project_id", data.projectId);
    const { data: milestone, error } = await supabase
      .from("milestones")
      .insert({
        project_id: data.projectId,
        title: data.title,
        description: data.description ?? null,
        due_date: data.due_date ?? null,
        position: count ?? 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return milestone;
  });

export const updateMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(160).optional(),
        description: z.string().max(1000).nullish(),
        due_date: z.string().nullish(),
        done: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("milestones")
      .select("project_id")
      .eq("id", data.id)
      .single();
    if (!existing) throw new Error("Milestone not found.");
    await requireMembership(supabase, existing.project_id, userId);
    const update: Database["public"]["Tables"]["milestones"]["Update"] = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description;
    if (data.due_date !== undefined) update.due_date = data.due_date;
    if (data.done !== undefined) update.done = data.done;
    const { error } = await supabase.from("milestones").update(update).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("milestones")
      .select("project_id")
      .eq("id", data.id)
      .single();
    if (!existing) throw new Error("Milestone not found.");
    await requireMembership(supabase, existing.project_id, userId);
    const { error } = await supabase.from("milestones").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("project_members")
      .select("project_id, user_id, member_role")
      .eq("id", data.memberId)
      .single();
    if (!member) throw new Error("Member not found.");
    const isSelf = member.user_id === userId;
    if (!isSelf) await requireLeadership(supabase, member.project_id, userId);
    if (isSelf && member.member_role === "leader") {
      const { count } = await supabase
        .from("project_members")
        .select("id", { count: "exact", head: true })
        .eq("project_id", member.project_id)
        .eq("member_role", "leader");
      if ((count ?? 0) <= 1) {
        throw new Error("Promote another leader before leaving the project.");
      }
    }
    const { error } = await supabase.from("project_members").delete().eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ memberId: z.string().uuid(), role: z.enum(["leader", "member"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("id", data.memberId)
      .single();
    if (!member) throw new Error("Member not found.");
    await requireLeadership(supabase, member.project_id, userId);
    const { error } = await supabase
      .from("project_members")
      .update({ member_role: data.role })
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
