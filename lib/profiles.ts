import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string | null;
  is_admin: boolean;
};

export async function getMyProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) return null;
  return data;
}
