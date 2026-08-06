import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyUsers, profilesById, requireMembership } from "./db.server";
import type { Task, TaskComment } from "./types";

const taskStatus = z.enum(["backlog", "todo", "in_progress", "review", "done"]);
const taskPriority = z.enum(["low", "medium", "high", "urgent"]);

export const listTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", data.projectId)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    const profiles = await profilesById(supabase, (tasks ?? []).map((t) => t.assignee_id));
    return (tasks ?? []).map((t) => ({
      ...t,
      assignee: t.assignee_id ? (profiles.get(t.assignee_id) ?? null) : null,
    })) as Task[];
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        title: z.string().min(1).max(200),
        description: z.string().max(4000).nullish(),
        status: taskStatus.default("todo"),
        priority: taskPriority.default("medium"),
        labels: z.array(z.string().max(30)).max(6).default([]),
        assignee_id: z.string().uuid().nullish(),
        due_date: z.string().nullish(),
        milestone_id: z.string().uuid().nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: last } = await supabase
      .from("tasks")
      .select("position")
      .eq("project_id", data.projectId)
      .eq("status", data.status)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        project_id: data.projectId,
        title: data.title,
        description: data.description ?? null,
        status: data.status,
        priority: data.priority,
        labels: data.labels,
        assignee_id: data.assignee_id ?? null,
        due_date: data.due_date ?? null,
        milestone_id: data.milestone_id ?? null,
        position: (last?.position ?? -1) + 1,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (data.assignee_id && data.assignee_id !== userId) {
      const { data: me } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      await notifyUsers(supabase, [
        {
          user_id: data.assignee_id,
          project_id: data.projectId,
          type: "task_assigned",
          title: `You were assigned "${data.title}"`,
          body: `${me?.display_name ?? "A teammate"} assigned a task to you.`,
          link: `/projects/${data.projectId}/board`,
        },
      ]);
    }
    return task;
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(4000).nullish(),
        priority: taskPriority.optional(),
        labels: z.array(z.string().max(30)).max(6).optional(),
        assignee_id: z.string().uuid().nullish(),
        due_date: z.string().nullish(),
        milestone_id: z.string().uuid().nullish(),
        status: taskStatus.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("tasks")
      .select("project_id, assignee_id, status, title")
      .eq("id", data.id)
      .single();
    if (!existing) throw new Error("Task not found.");
    await requireMembership(supabase, existing.project_id, userId);

    const { id, ...patch } = data;
    const update: Record<string, unknown> = { ...patch };
    if (patch.status === "done" && existing.status !== "done") {
      update.completed_at = new Date().toISOString();
    } else if (patch.status && patch.status !== "done") {
      update.completed_at = null;
    }

    const { error } = await supabase.from("tasks").update(update).eq("id", id);
    if (error) throw new Error(error.message);

    if (
      patch.assignee_id !== undefined &&
      patch.assignee_id &&
      patch.assignee_id !== existing.assignee_id &&
      patch.assignee_id !== userId
    ) {
      const { data: me } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      await notifyUsers(supabase, [
        {
          user_id: patch.assignee_id,
          project_id: existing.project_id,
          type: "task_assigned",
          title: `You were assigned "${existing.title}"`,
          body: `${me?.display_name ?? "A teammate"} assigned a task to you.`,
          link: `/projects/${existing.project_id}/board`,
        },
      ]);
    }
    return { ok: true };
  });

export const reorderTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        updates: z
          .array(z.object({ id: z.string().uuid(), status: taskStatus, position: z.number() }))
          .max(300),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    await Promise.all(
      data.updates.map((u) =>
        supabase
          .from("tasks")
          .update({
            status: u.status,
            position: u.position,
            ...(u.status === "done" ? { completed_at: new Date().toISOString() } : {}),
          })
          .eq("id", u.id),
      ),
    );
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("tasks")
      .select("project_id")
      .eq("id", data.id)
      .single();
    if (!existing) throw new Error("Task not found.");
    await requireMembership(supabase, existing.project_id, userId);
    const { error } = await supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTaskComments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ taskId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: task } = await supabase
      .from("tasks")
      .select("project_id")
      .eq("id", data.taskId)
      .single();
    if (!task) throw new Error("Task not found.");
    await requireMembership(supabase, task.project_id, userId);
    const { data: comments, error } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", data.taskId)
      .order("created_at");
    if (error) throw new Error(error.message);
    const profiles = await profilesById(supabase, (comments ?? []).map((c) => c.user_id));
    return (comments ?? []).map((c) => ({ ...c, profile: profiles.get(c.user_id) })) as TaskComment[];
  });

export const addTaskComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ taskId: z.string().uuid(), content: z.string().min(1).max(2000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: task } = await supabase
      .from("tasks")
      .select("project_id, title, assignee_id, created_by")
      .eq("id", data.taskId)
      .single();
    if (!task) throw new Error("Task not found.");
    await requireMembership(supabase, task.project_id, userId);
    const { data: comment, error } = await supabase
      .from("task_comments")
      .insert({ task_id: data.taskId, user_id: userId, content: data.content })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const targets = [...new Set([task.assignee_id, task.created_by].filter(Boolean))].filter(
      (id) => id !== userId,
    ) as string[];
    if (targets.length > 0) {
      const { data: me } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      await notifyUsers(
        supabase,
        targets.map((target) => ({
          user_id: target,
          project_id: task.project_id,
          type: "task_comment",
          title: `New comment on "${task.title}"`,
          body: `${me?.display_name ?? "A teammate"}: ${data.content.slice(0, 120)}`,
          link: `/projects/${task.project_id}/board`,
        })),
      );
    }
    return comment;
  });

export const deleteTaskComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("task_comments")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
