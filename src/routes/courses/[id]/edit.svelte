<script lang="ts" context="module">
import type { Load } from "@sveltejs/kit";

export const load: Load = ({
  page: {
    params: { id }
  }
}) => {
  return { props: { id } };
};
</script>

<script lang="ts">
import { onMount } from "svelte";
import { Course, getCourses, getTeacher, Teacher } from "$lib/supabase";
import notifications from "$lib/stores/notifications";
import user from "$lib/stores/user";
import { goto } from "$app/navigation";
import { createForm } from "felte";
import { validator } from "@felte/validator-yup";
import { svelteReporter, ValidationMessage } from "@felte/reporter-svelte";
import * as yup from "yup";
import supabase from "$lib/supabase";
import session from "$lib/stores/session";

export let id: string;
let loading = true;
let course: Course;
let teacher: Teacher;

const schema = yup.object({
  name: yup.string().required(),
  tags: yup.string(),
  description: yup.string().required(),
  learning_goals: yup.string().required()
});

const { form } = createForm({
  onSubmit: editCourse,
  extend: [validator, svelteReporter],
  validateSchema: schema
});

async function editCourse(values: Record<string, unknown>) {
  if (teacher?.id !== $user?.id) {
    goto("/auth");
    return;
  }

  const { error, data } = await supabase
    .from("courses")
    .update({
      ...values
    })
    .eq("id", course.id);
  if (error) {
    notifications.notify(error.message);
  } else {
    notifications.notify({
      message: "Changes saved",
      type: "success"
    });
    course = data[0];
  }
}

async function changeVisibility() {
  if (!window.confirm("Are you sure?")) return;

  const { error, data } = await supabase
    .from("courses")
    .update({
      is_public: !course.is_public
    })
    .eq("id", course.id);
  if (error) {
    notifications.notify(error.message);
  } else {
    notifications.notify({
      message: "Changes saved",
      type: "success"
    });
    course = data[0];
  }
}

async function changeCoverImg() {
  const input = document.createElement("input");
  document.body.appendChild(input);
  input.style.display = "none";
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    console.log(file);
    if (!file.type.startsWith("image"))
      return notifications.notify("Please select an image");

    notifications.notify({ message: "Uploading cover...", type: "success" });

    fetch(`/courses/${course.id}/upload_cover`, {
      body: file,
      method: "POST",
      headers: {
        "x-token": $session.access_token
      }
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          notifications.notify(data.error);
        } else {
          notifications.notify({
            message: "Cover changed",
            type: "success"
          });
          course = data;
        }
      });
  });
  input.click();
}

onMount(async () => {
  if (!$user) {
    goto("/auth");
    return;
  }

  const courses = await getCourses({ id });
  if (Array.isArray(courses) && courses.length > 0) course = courses[0];
  if (!course) {
    notifications.notify("Course not found");
    loading = false;
    return;
  }

  // Get the teacher and profile of the teacher of the course
  teacher = await getTeacher(course.teacher_id);
  if (!teacher) {
    notifications.notify("Something went wrong! Check the console for details");
    console.error(
      "courses/id/edit.svelte:48 -> teacher was not found, relevant information logged"
    );
    console.log({ course, courses, teacher, id });
    course = null;
    return;
  }

  if ($user.id !== teacher.id) {
    notifications.notify("You don't have permission to do that!");
  }

  loading = false;
});

$: console.log({ course, teacher });
</script>

<h1 class="text-center text-4xl m-4 font-bold">Edit course</h1>
<p class="m-4 text-center text-xl flex justify-center items-center gap-4">
  <a href="/courses/{id}" class="button !bg-secondary">View course</a>
  <a href="/courses/{id}/editor" class="button">Edit sections and lectures</a>
</p>
{#if !loading && course && teacher && $user}
  <form
    use:form
    class="mx-auto mt-8 w-[50%] max-w-[1100px] min-w-[300px] px-6 py-4 bg-primary rounded-lg"
  >
    <h2 class="text-2xl text-center m-4">Metadata</h2>
    <div class="mt-2">
      <label for="name">Course Name</label>
      <input
        type="text"
        name="name"
        id="name"
        placeholder={course.name}
        value={course.name}
      />
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
        placeholder={course.description}
        rows={8}
        value={course.description}
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
        placeholder={course.tags}
        rows={3}
        value={course.tags}
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
        placeholder={course.learning_goals}
        rows={5}
        value={course.learning_goals}
      />
      <ValidationMessage let:messages={message} for="learning_goals">
        <small class:hidden={!message} class="text-sm text-red-500 mt-1"
          >{message}</small
        >
      </ValidationMessage>
    </div>
    <div class="mt-2">
      <button class="button w-full !bg-secondary" type="submit">Save changes</button>
    </div>
    <div class="mt-6">
      <h3 class="text-2xl m-4">
        Change cover image{#if course.cover_url} (click image to change){/if}:
      </h3>
      {#if course.cover_url}
        <img
          src={course.cover_url}
          alt="Cover"
          class="rounded-lg max-h-[360px] w-full cursor-pointer hover:brightness-50"
          style="transition: filter 1s ease;"
          on:click={changeCoverImg}
        />
      {:else}
        <p class="text-lg">
          <button
            type="button"
            on:click={changeCoverImg}
            class="text-secondary underline hover:text-secondary-hover cursor-pointer"
            style="transition: 500ms ease color">Add a cover image</button
          >
        </p>
      {/if}
    </div>
  </form>

  <div
    class="mx-auto mt-4 w-[50%] max-w-[1100px] min-w-[300px] px-6 py-4 bg-primary rounded-lg flex items-center justify-between"
  >
    <div class="flex flex-col justify-center">
      <h2 class="text-2xl">Make course {course.is_public ? "private" : "public"}</h2>
      {#if !course.is_public}
        <p class="text-xl mt-2 font-ubuntu">
          If you make a course public, everyone will be able to see it
        </p>
      {:else}
        <p class="text-xl mt-2 font-ubuntu">
          If you make a course private, only you can see it. Student data will not be
          removed.
        </p>
      {/if}
    </div>
    <button
      on:click={changeVisibility}
      class:!bg-secondary={!course.is_public}
      class:!bg-red-500={course.is_public}
      class="button text-lg">Make {course.is_public ? "private" : "public"}</button
    >
  </div>
{/if}
