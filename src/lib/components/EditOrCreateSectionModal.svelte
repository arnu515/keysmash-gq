<script lang="ts">
import { createForm } from "felte";
import { validator } from "@felte/validator-yup";
import { svelteReporter, ValidationMessage } from "@felte/reporter-svelte";
import * as yup from "yup";
import notifications from "$lib/stores/notifications";
import { createEventDispatcher } from "svelte";
import { fade, slide } from "svelte/transition";

const d = createEventDispatcher();
export let show = false;
export let edit = false;
export let defaultValues: { name?: string; description?: string; id?: number } = {};

const schema = yup.object({
  name: yup.string().default(defaultValues.name),
  description: yup.string().default(defaultValues.description)
});

const { form } = createForm({
  onSubmit: editOrCreateSection,
  extend: [validator, svelteReporter],
  validateSchema: schema
});

async function editOrCreateSection(values: Record<string, string>) {
  const section = {
    ...defaultValues,
    name: typeof values.name === "string" ? values.name.trim() : "",
    description:
      typeof values.description === "string" ? values.description.trim() : undefined
  };

  if (!section.name) return;

  notifications.notify({
    message: `${edit ? "Editing" : "Creating"} section`,
    type: "success"
  });
  let toInsert: Record<string, unknown> = { ...section };
  if (edit) toInsert.id = section["id"];
  d("done", { section: toInsert, edit });
}
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
      <form
        use:form
        class="mx-auto w-[50%] max-w-[1100px] min-w-[300px] px-6 py-4 bg-primary rounded-lg"
      >
        <h1 class="text-3xl text-center m-4">{edit ? "Edit" : "Create"} section</h1>
        <div class="mt-2">
          <label for="name">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder={defaultValues.name || "Section Name"}
          />
          <ValidationMessage let:messages={message} for="name">
            <small class:hidden={!message} class="text-sm text-red-500 mt-1"
              >{message}</small
            >
          </ValidationMessage>
        </div>
        <div class="mt-2">
          <label for="name">Description</label>
          <textarea
            rows={5}
            type="text"
            name="description"
            id="description"
            placeholder={defaultValues.description || "Section Description"}
          />
          <ValidationMessage let:messages={message} for="description">
            <small class:hidden={!message} class="text-sm text-red-500 mt-1"
              >{message}</small
            >
          </ValidationMessage>
        </div>
        <div class="mt-2 flex gap-4 items-center">
          {#if edit}
            <button
              class="button w-full !bg-red-500"
              on:click={() => d("delete", defaultValues.id)}
              type="button">Delete section</button
            >
          {:else}
            <button class="button w-full" on:click={() => d("close")} type="button"
              >Cancel</button
            >
          {/if}
          <button class="button w-full !bg-secondary" type="submit"
            >{edit ? "Edit" : "Create"} section</button
          >
        </div>
        {#if edit}
          <div class="mt-2">
            <button class="button w-full" on:click={() => d("close")} type="button"
              >Cancel</button
            >
          </div>
        {/if}
      </form>
    </div>
  </div>
{/if}
