import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyUsers, profilesById, requireMembership, requireLeadership } from "./db.server";
import type { Message, ProjectFile } from "./types";

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("project_id", data.projectId)
      .order("created_at")
      .limit(300);
    if (error) throw new Error(error.message);
    const profiles = await profilesById(supabase, (messages ?? []).map((m) => m.user_id));
    return (messages ?? []).map((m) => ({
      ...m,
      reactions: (m.reactions ?? {}) as Record<string, string[]>,
      profile: profiles.get(m.user_id),
    })) as Message[];
  });

export const postMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        content: z.string().min(1).max(4000),
        parent_id: z.string().uuid().nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        project_id: data.projectId,
        user_id: userId,
        parent_id: data.parent_id ?? null,
        content: data.content,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { data: me } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single();
    const myName = me?.display_name ?? "A teammate";

    // Mention notifications: match @display_name against member profiles
    const { data: members } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", data.projectId);
    const memberIds = (members ?? []).map((m) => m.user_id);
    const profiles = await profilesById(supabase, memberIds);
    const mentioned = memberIds.filter((id) => {
      if (id === userId) return false;
      const name = profiles.get(id)?.display_name;
      return name ? data.content.toLowerCase().includes(`@${name.toLowerCase()}`) : false;
    });

    const notifications = mentioned.map((id) => ({
      user_id: id,
      project_id: data.projectId,
      type: "mention",
      title: `${myName} mentioned you`,
      body: data.content.slice(0, 140),
      link: `/projects/${data.projectId}/team`,
    }));

    // Reply notifications
    if (data.parent_id) {
      const { data: parent } = await supabase
        .from("messages")
        .select("user_id")
        .eq("id", data.parent_id)
        .single();
      if (parent && parent.user_id !== userId && !mentioned.includes(parent.user_id)) {
        notifications.push({
          user_id: parent.user_id,
          project_id: data.projectId,
          type: "reply",
          title: `${myName} replied to your message`,
          body: data.content.slice(0, 140),
          link: `/projects/${data.projectId}/team`,
        });
      }
    }
    await notifyUsers(supabase, notifications);
    return message;
  });

export const deleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("messages").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleReaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ messageId: z.string().uuid(), emoji: z.string().min(1).max(8) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: message } = await supabase
      .from("messages")
      .select("project_id, reactions")
      .eq("id", data.messageId)
      .single();
    if (!message) throw new Error("Message not found.");
    await requireMembership(supabase, message.project_id, userId);

    const reactions = { ...((message.reactions ?? {}) as Record<string, string[]>) };
    const users = reactions[data.emoji] ?? [];
    if (users.includes(userId)) {
      const next = users.filter((u) => u !== userId);
      if (next.length === 0) delete reactions[data.emoji];
      else reactions[data.emoji] = next;
    } else {
      reactions[data.emoji] = [...users, userId];
    }
    const { error } = await supabase.from("messages").update({ reactions }).eq("id", data.messageId);
    if (error) throw new Error(error.message);
    return { reactions };
  });

export const getSharedNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data } = await supabase
      .from("shared_notes")
      .select("*")
      .eq("project_id", data.projectId)
      .maybeSingle();
    return data ?? null;
  });

export const saveSharedNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ projectId: z.string().uuid(), content: z.string().max(20000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: existing } = await supabase
      .from("shared_notes")
      .select("project_id")
      .eq("project_id", data.projectId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("shared_notes")
        .update({ content: data.content, updated_by: userId })
        .eq("project_id", data.projectId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("shared_notes")
        .insert({ project_id: data.projectId, content: data.content, updated_by: userId });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listFiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ projectId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: files, error } = await supabase
      .from("files")
      .select("*")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const profiles = await profilesById(supabase, (files ?? []).map((f) => f.uploader_id));
    const withUrls = await Promise.all(
      (files ?? []).map(async (f) => {
        const { data: url } = await supabase.storage
          .from("project-files")
          .createSignedUrl(f.file_path, 600);
        return {
          ...f,
          profile: profiles.get(f.uploader_id),
          signed_url: url?.signedUrl,
        } as ProjectFile;
      }),
    );
    return withUrls;
  });

export const registerFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        file_name: z.string().min(1).max(200),
        file_path: z.string().min(1).max(500),
        content_type: z.string().max(120).nullish(),
        size_bytes: z.number().int().nonnegative().nullish(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: file, error } = await supabase
      .from("files")
      .insert({
        project_id: data.projectId,
        uploader_id: userId,
        file_name: data.file_name,
        file_path: data.file_path,
        content_type: data.content_type ?? null,
        size_bytes: data.size_bytes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return file;
  });

export const deleteFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: file } = await supabase.from("files").select("*").eq("id", data.id).single();
    if (!file) throw new Error("File not found.");
    if (file.uploader_id !== userId) {
      await requireLeadership(supabase, file.project_id, userId);
    }
    await supabase.storage.from("project-files").remove([file.file_path]);
    const { error } = await supabase.from("files").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
