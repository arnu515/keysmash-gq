<script lang="ts">
import notifications from "$lib/stores/notifications";
import { fly, fade } from "svelte/transition";

function dismiss(id: string) {
  notifications.dismiss(id);
}
</script>

<aside class="fixed right-0 z-10">
  {#each $notifications as n}
    <div
      class="notification {n.type}"
      on:click={() => dismiss(n.id)}
      out:fly={{ x: 200 }}
      in:fade
    >
      {#if n.title}
        <h3 class="title">{n.title}</h3>
      {/if}
      <p class="message">
        {n.message}
      </p>
      <p class="c2d">Click to dismiss</p>
    </div>
  {/each}
</aside>

<style lang="postcss">
.notification {
  @apply m-2 border border-transparent cursor-pointer;
  &.danger {
    @apply bg-red-500 text-white;
  }
  &.success {
    @apply bg-green-500 text-white;
  }
  &.warning {
    @apply bg-yellow-500 text-white;
  }
  .message {
    @apply px-2 py-1;
  }
  .title {
    @apply px-2 py-1 mb-1 font-bold text-xl;
  }
  .c2d {
    @apply italic text-sm mt-1 mr-2 text-right;
  }
}
</style>
