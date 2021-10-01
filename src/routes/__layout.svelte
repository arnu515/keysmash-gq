<script>
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/700.css";
import "@fontsource/ubuntu/400.css";
import "@fontsource/fira-code/400.css";
import "../app.postcss";
import supabase from "$lib/supabase";
import { onMount } from "svelte";
import session from "$lib/stores/session";
import user from "$lib/stores/user";
import Notifications from "$lib/components/Notifications.svelte";

let loading = true;

onMount(() => {
  $session = supabase.auth.session();
  $user = $session?.user;

  supabase.auth.onAuthStateChange((_, ssn) => {
    $session = ssn;
    $user = ssn?.user;
  });

  loading = false;
});
</script>

{#if !loading}
  <Notifications />
  <slot />
{/if}
