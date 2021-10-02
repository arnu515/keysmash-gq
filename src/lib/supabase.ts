import { createClient } from "@supabase/supabase-js";
import type { number } from "yup";

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
  about?: string;
  created_at: string;
}

export interface Course {
  id: number;
  name: string;
  teacher_id: Teacher["id"];
  cover_url?: string;
  tags?: string;
  description: string;
  learning_goals: string;
  is_public: boolean;
}

export async function getProfile(userId?: string): Promise<Profile | null> {
  if (!userId && !supabase.auth.user()) return;
  userId = userId || supabase.auth.user().id;
  const { data = [] } = await supabase.from("profiles").select().eq("id", userId);
  const profile = data[0];
  return profile ?? null;
}

export async function getTeacher(userId?: string): Promise<Teacher | null> {
  if (!userId && !supabase.auth.user()) return;
  userId = userId || supabase.auth.user().id;
  const { data = [] } = await supabase.from("teachers").select().eq("id", userId);
  const teacher = data[0];
  return teacher ?? null;
}

export async function getCourses(opts: {
  byUser?: boolean;
  id?: string;
}): Promise<Course[] | null> {
  const { byUser = false, id } = opts;
  if (byUser && !supabase.auth.user()) return null;
  let courses: Course[];
  if (byUser) {
    const { data = [] } = await supabase
      .from("courses")
      .select()
      .eq("teacher_id", supabase.auth.user().id);
    courses = data;
  } else if (id) {
    const { data = [] } = await supabase.from("courses").select().eq("id", id);
    courses = data;
  } else {
    const { data = [] } = await supabase.from("courses").select();
    courses = data;
  }
  return courses;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_KEY as string
);

export default supabase;
