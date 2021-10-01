<script lang="ts">
import { fade, slide } from "svelte/transition";
import Auth from "./Auth.svelte";
import { createEventDispatcher } from "svelte";

export let show = false;
const d = createEventDispatcher();
</script>

{#if show}
  <div
    class="fixed w-full h-full top-0 left-0 grid place-items-center"
    style="background-color: rgba(0,0,0,0.4)"
    on:click|self={() => d("close")}
    transition:fade
  >
    <div
      in:slide
      out:fade
      on:click|self={() => d("close")}
      class="fixed w-full h-full top-0 left-0 grid place-items-center"
    >
      <Auth on:done={() => d("close")} on:cancel={() => d("close")} />
    </div>
  </div>
{/if}
