import { createClient } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  is_bannable: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  website?: string;
  bio?: string;
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

export async function getTeacher(): Promise<Teacher | null> {
  if (!supabase.auth.user()) return;
  const { data = [] } = await supabase
    .from("teachers")
    .select()
    .eq("id", supabase.auth.user().id);
  const teacher = data[0];
  return teacher ?? null;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_KEY as string
);

export default supabase;
