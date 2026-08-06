import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { profilesById, requireMembership } from "./db.server";
import type { DailyUpdate } from "./types";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const listStandups = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ projectId: z.string().uuid(), date: dateString }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: updates, error } = await supabase
      .from("daily_updates")
      .select("*")
      .eq("project_id", data.projectId)
      .eq("update_date", data.date)
      .order("created_at");
    if (error) throw new Error(error.message);
    const profiles = await profilesById(supabase, (updates ?? []).map((u) => u.user_id));
    return (updates ?? []).map((u) => ({
      ...u,
      profile: profiles.get(u.user_id),
    })) as DailyUpdate[];
  });

export const getMyStandup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ projectId: z.string().uuid(), date: dateString }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data } = await supabase
      .from("daily_updates")
      .select("*")
      .eq("project_id", data.projectId)
      .eq("user_id", userId)
      .eq("update_date", data.date)
      .maybeSingle();
    return data ?? null;
  });

export const saveStandup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        date: dateString,
        finished: z.string().max(2000).default(""),
        planned: z.string().max(2000).default(""),
        blockers: z.string().max(2000).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await requireMembership(supabase, data.projectId, userId);
    const { data: existing } = await supabase
      .from("daily_updates")
      .select("id")
      .eq("project_id", data.projectId)
      .eq("user_id", userId)
      .eq("update_date", data.date)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("daily_updates")
        .update({
          finished: data.finished,
          planned: data.planned,
          blockers: data.blockers,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id };
    }
    const { data: created, error } = await supabase
      .from("daily_updates")
      .insert({
        project_id: data.projectId,
        user_id: userId,
        update_date: data.date,
        finished: data.finished,
        planned: data.planned,
        blockers: data.blockers,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  });
