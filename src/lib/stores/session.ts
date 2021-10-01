import type { AuthSession } from "@supabase/supabase-js";
import { writable } from "svelte/store";

const session = writable<AuthSession | null>(null);

export default session;
