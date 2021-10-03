<script lang="ts">
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/700.css";
import "@fontsource/ubuntu/400.css";
import "@fontsource/fira-code/400.css";
import "../app.postcss";
import supabase, { getProfile } from "$lib/supabase";
import { onMount } from "svelte";
import session from "$lib/stores/session";
import user from "$lib/stores/user";
import Notifications from "$lib/components/Notifications.svelte";
import profile from "$lib/stores/profile";
import { goto } from "$app/navigation";
import Navbar from "$lib/components/Navbar.svelte";
import qs from "qs";
import notifications from "$lib/stores/notifications";

let loading = true;
let reg: ServiceWorkerRegistration;

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

  if ("serviceWorker" in navigator) {
    reg = await navigator.serviceWorker.register("/service-worker.js");
  }

  // Check for supabase errors
  const hash = window.location.hash.substr(1);
  if (hash) {
    const { error_description } = qs.parse(hash);
    if (typeof error_description === "string") {
      // There is an error
      notifications.notify(error_description);
      window.location.hash = "";
    }
  }

  loading = false;
});

$: console.log($profile, $user);
$: if (!loading && $user && !$profile && typeof window !== "undefined")
  window.location.pathname.startsWith("/auth") || goto("/auth");
</script>

{#if !loading}
  <Notifications />
  <Navbar />
  <slot />
{/if}
