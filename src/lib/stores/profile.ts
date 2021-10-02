import { writable } from "svelte/store";
import type { Profile } from "$lib/supabase";

const profile = writable<Profile | null>(null);

export default profile;
