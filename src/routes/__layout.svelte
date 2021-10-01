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
import profile, { getProfile } from "$lib/stores/profile";
import { goto } from "$app/navigation";

let loading = true;

onMount(async () => {
  $session = supabase.auth.session();
  $user = $session?.user;

  supabase.auth.onAuthStateChange(async (_, ssn) => {
    $session = ssn;
    $user = ssn?.user;
    if ($user) {
      $profile = await getProfile();
    }
  });

  if ($user) {
    $profile = await getProfile();
  }

  loading = false;
});

$: console.log($profile, $user);
$: if (!loading && $user && !$profile && typeof window !== "undefined")
  window.location.pathname.startsWith("/auth") || goto("/auth");
</script>

{#if !loading}
  <Notifications />
  <slot />
{/if}
