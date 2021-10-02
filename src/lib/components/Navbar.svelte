<script lang="ts">
import user from "$lib/stores/user";
</script>

<nav class="flex justify-between items-center bg-primary border-b border-black">
  <section class="flex items-center">
    <a href="/" class="logo">Keysmash <small class="gq">.gq</small></a>
  </section>
  <ul class="nav">
    <li><a href="/courses" class="link">Explore</a></li>
    {#if $user}
      <li><a href="/dashboard" class="button !bg-secondary">Dashboard</a></li>
    {:else}
      <li><a href="/auth" class="button !bg-secondary">Get started</a></li>
    {/if}
  </ul>
</nav>

<style lang="postcss">
.logo {
  @apply text-lg font-bold px-4 py-2 block;
  .gq {
    @apply text-sm font-normal text-gray-500;
  }
}

.nav {
  @apply flex items-center gap-4 list-none m-0 p-0 mr-4;
  li {
    @apply m-0 p-0;
  }
  a.link {
    @apply text-white;
    transition: color 500ms ease;
  }
  a.link:hover {
    color: #ccc;
  }
}
</style>
