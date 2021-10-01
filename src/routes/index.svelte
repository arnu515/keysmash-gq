<script lang="ts">
import AuthModal from "$lib/components/AuthModal.svelte";
import user from "$lib/stores/user";

let showAuthModal = false;
</script>

<header class="mx-12 my-8 px-8 py-6">
  <h1 class="text-6xl text-center m-4 font-bold">
    Keymash <small class="text-gray-500 text-2xl font-normal">.gq</small>
  </h1>
  <p class="text-3xl text-center m-4">Free courses for everyone!</p>
  <div class="text-xl m-4 flex justify-center items-center gap-4">
    {#if !$user}
      <button
        on:click={() => (showAuthModal = true)}
        class="button !bg-secondary hover:bg-secondary-hover">Sign up</button
      >
    {:else}
      <a href="/dashboard" class="button !bg-secondary hover:bg-secondary-hover"
        >Dashboard</a
      >
    {/if}
    <a href="/courses" class="button">Explore courses</a>
  </div>
</header>

<AuthModal show={showAuthModal} on:close={() => (showAuthModal = false)} />
