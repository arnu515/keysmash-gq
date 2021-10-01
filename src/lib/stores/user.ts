import type { AuthUser } from "@supabase/supabase-js";
import { writable } from "svelte/store";

const user = writable<AuthUser | null>(null);

export default user;
