import { writable } from "svelte/store";
import supabase from "$lib/supabase";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  is_bannable: string;
  created_at: string;
}

export async function getProfile(): Promise<Profile | null> {
  if (!supabase.auth.user()) return;
  const { data = [] } = await supabase
    .from("profiles")
    .select()
    .eq("id", supabase.auth.user().id);
  const profile = data[0];
  return profile ?? null;
}

const profile = writable<Profile | null>(null);

export default profile;
