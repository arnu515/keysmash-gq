<script lang="ts">
import { createForm } from "felte";
import { validator } from "@felte/validator-yup";
import { svelteReporter, ValidationMessage } from "@felte/reporter-svelte";
import * as yup from "yup";
import supabase from "$lib/supabase";
import notifications from "$lib/stores/notifications";
import user from "$lib/stores/user";
import { createEventDispatcher } from "svelte";
import { getTeacher } from "$lib/stores/profile";
import { fade, slide } from "svelte/transition";

const d = createEventDispatcher();
export let show = false;

const schema = yup.object({
  full_name: yup
    .string()
    .required()
    .matches(/[\w_]+/g),
  website: yup.string().url(),
  about: yup.string()
});

const { form } = createForm({
  onSubmit: becomeTeacher,
  extend: [validator, svelteReporter],
  validateSchema: schema
});

async function becomeTeacher(values: Record<string, string>) {
  if (await getTeacher()) {
    notifications.notify("You're already a teacher!");
    d("done");
    return;
  }

  const { error, data } = await supabase.from("teachers").insert({
    id: $user.id,
    ...values
  });
  if (error) {
    notifications.notify(error.message);
  } else {
    notifications.notify({
      message: "You're now a teacher",
      type: "success"
    });
    d("done", data[0]);
  }
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
        <h1 class="text-3xl text-center m-4">Become a teacher</h1>
        <p class="text-center text-xl m-4">
          Teachers can create courses and interact with students.
        </p>
        <div class="mt-2">
          <label for="full_name">Full name</label>
          <input
            type="text"
            name="full_name"
            id="full_name"
            placeholder="Enter your full name"
          />
          <ValidationMessage let:messages={message} for="full_name">
            <small class:hidden={!message} class="text-sm text-red-500 mt-1"
              >{message}</small
            >
          </ValidationMessage>
        </div>
        <div class="mt-2">
          <label for="website">Website (Optional)</label>
          <input
            type="text"
            name="website"
            id="website"
            placeholder="Enter your website's URL"
          />
          <ValidationMessage let:messages={message} for="website">
            <small class:hidden={!message} class="text-sm text-red-500 mt-1"
              >{message}</small
            >
          </ValidationMessage>
        </div>
        <div class="mt-2">
          <label for="about">About You (Optional)</label>
          <textarea
            type="text"
            rows={5}
            name="about"
            id="about"
            placeholder="Your students will see this when they visit your profile"
          />
          <ValidationMessage let:messages={message} for="about">
            <small class:hidden={!message} class="text-sm text-red-500 mt-1"
              >{message}</small
            >
          </ValidationMessage>
        </div>
        <div class="mt-2 flex gap-4 items-center">
          <button class="button w-full" on:click={() => d("close")} type="button"
            >Cancel</button
          >
          <button class="button w-full !bg-secondary" type="submit"
            >Create my profile</button
          >
        </div>
      </form>
    </div>
  </div>
{/if}
