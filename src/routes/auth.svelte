<script>
import Auth from "$lib/components/Auth.svelte";
import CreateProfile from "$lib/components/CreateProfile.svelte";
import profile from "$lib/stores/profile";
import user from "$lib/stores/user";
</script>

<main class="grid place-items-center fixed top-0 left-0 w-full h-full">
  {#if !$user}
    <Auth />
  {:else if $user && !$profile}
    <CreateProfile />
  {:else}
    <section class="mx-auto px-6 py-4 bg-primary rounded-lg">
      <h1 class="text-center text-4xl m-4">You're all set</h1>
      <p class="m-4 text-center">
        <a href="/" class="button !bg-secondary">Homepage</a>
      </p>
    </section>
  {/if}
</main>
