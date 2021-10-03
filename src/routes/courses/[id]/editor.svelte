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
import { goto } from "$app/navigation";
import user from "$lib/stores/user";
import { Course, getCourses, getTeacher, Teacher } from "$lib/supabase";
import { onMount } from "svelte";
import notifications from "$lib/stores/notifications";

export let id: string;
let course: Course;
let loading = true;
let teacher: Teacher;
let sidebarOpen = true;

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
</script>

{#if !loading && course && teacher && $user}
  <header class="bg-primary border-b border-primary-dark py-6">
    <h1 class="text-center text-4xl font-bold m-4">{course.name}</h1>
    <p class="text-center text-xl m-4">Editing sections and lectures</p>
  </header>
  <section class="main">
    {#if sidebarOpen}
      <aside class="sidebar">
        <h2 class="title">
          Lectures <span class="close" on:click={() => (sidebarOpen = false)}
            >&laquo;</span
          >
        </h2>
      </aside>
    {/if}
    <main class="lecture-area">
      {#if !sidebarOpen}
        <small
          class="m-4 text-gray-200 font-mono hover:underline cursor-pointer"
          on:click={() => (sidebarOpen = true)}>&raquo; Open sidebar</small
        >
      {/if}
    </main>
  </section>
{/if}

<style lang="postcss">
.main {
  @apply min-h-screen flex;
  .sidebar {
    @apply bg-primary-light px-4 py-2 w-[450px];
    .title {
      @apply text-2xl font-bold flex items-center justify-between;
      .close {
        @apply font-normal text-4xl hover:text-gray-200 cursor-pointer;
        transition: color 500ms ease;
      }
    }
  }
}
</style>
