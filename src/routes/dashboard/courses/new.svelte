<script lang="ts">
import { createForm } from "felte";
import { validator } from "@felte/validator-yup";
import { svelteReporter, ValidationMessage } from "@felte/reporter-svelte";
import * as yup from "yup";
import supabase from "$lib/supabase";
import notifications from "$lib/stores/notifications";
import user from "$lib/stores/user";
import { goto } from "$app/navigation";
import { onMount } from "svelte";
import profile, { getTeacher, Teacher } from "$lib/stores/profile";

let loading = true;
let teacher: Teacher;

onMount(async () => {
  if (!$user) {
    goto("/auth");
  }

  teacher = await getTeacher();
  if (!teacher) {
    goto("/dashboard");
    return;
  }

  loading = false;
});

const schema = yup.object({
  name: yup.string().required(),
  tags: yup.string(),
  description: yup.string().required(),
  learning_goals: yup.string().required()
});

const { form } = createForm({
  onSubmit: auth,
  extend: [validator, svelteReporter],
  validateSchema: schema
});

async function auth(values: Record<string, unknown>) {
  if (!teacher) {
    goto("/dashboard");
    return;
  }

  const { error, data } = await supabase.from("courses").insert({
    ...values,
    teacher_id: teacher.id
  });
  if (error) {
    notifications.notify(error.message);
  } else {
    notifications.notify({
      message: "Created a course",
      type: "success"
    });
    goto("/courses/" + data[0].id);
  }
}
</script>

{#if !loading && teacher && $user}
  <form
    use:form
    class="mx-auto mt-8 w-[50%] max-w-[1100px] min-w-[300px] px-6 py-4 bg-primary rounded-lg"
  >
    <h1 class="text-3xl text-center m-4">Create course</h1>
    <div class="mt-2">
      <label for="name">Course Name</label>
      <input type="text" name="name" id="name" placeholder="Name of the course" />
      <ValidationMessage let:messages={message} for="name">
        <small class:hidden={!message} class="text-sm text-red-500 mt-1"
          >{message}</small
        >
      </ValidationMessage>
    </div>
    <div class="mt-2">
      <label for="description">Course Description</label>
      <textarea
        type="text"
        name="description"
        id="description"
        placeholder="Enter a description"
        rows={8}
      />
      <ValidationMessage let:messages={message} for="description">
        <small class:hidden={!message} class="text-sm text-red-500 mt-1"
          >{message}</small
        >
      </ValidationMessage>
    </div>
    <div class="mt-2">
      <label for="tags">Tags</label>
      <textarea
        type="text"
        name="tags"
        id="tags"
        placeholder="Write one tag on one line"
        rows={3}
      />
      <ValidationMessage let:messages={message} for="tags">
        <small class:hidden={!message} class="text-sm text-red-500 mt-1"
          >{message}</small
        >
      </ValidationMessage>
    </div>
    <div class="mt-2">
      <label for="learning_goals">Learning Goals</label>
      <textarea
        type="text"
        name="learning_goals"
        id="learning_goals"
        placeholder="What the user will acheive once they complete the course. One goal on one line"
        rows={5}
      />
      <ValidationMessage let:messages={message} for="learning_goals">
        <small class:hidden={!message} class="text-sm text-red-500 mt-1"
          >{message}</small
        >
      </ValidationMessage>
    </div>
    <div class="mt-2">
      <button class="button w-full !bg-secondary" type="submit">Create course</button>
    </div>
  </form>
{/if}
