import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Profile } from "./types";

export type Db = SupabaseClient<Database>;

export async function requireMembership(supabase: Db, projectId: string, userId: string) {
  const { data, error } = await supabase.rpc("is_project_member", {
    _project_id: projectId,
    _user_id: userId,
  });
  if (error || !data) throw new Error("You are not a member of this project.");
}

export async function requireLeadership(supabase: Db, projectId: string, userId: string) {
  const { data, error } = await supabase.rpc("is_project_leader", {
    _project_id: projectId,
    _user_id: userId,
  });
  if (error || !data) throw new Error("Only project leaders can do that.");
}

export async function notifyUsers(
  supabase: Db,
  rows: {
    user_id: string;
    project_id?: string | null;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
  }[],
) {
  const insertable = rows.filter((r) => r.user_id);
  if (insertable.length === 0) return;
  await supabase.from("notifications").insert(insertable);
}

export async function signedLogoUrl(supabase: Db, path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from("project-logos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function profilesById(supabase: Db, ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (unique.length === 0) return new Map<string, Profile>();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, created_at")
    .in("id", unique);
  return new Map<string, Profile>((data ?? []).map((p) => [p.id, p as Profile]));
}
