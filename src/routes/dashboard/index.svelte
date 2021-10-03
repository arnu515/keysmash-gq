<script lang="ts">
import { onMount } from "svelte";
import { Course, getCourses, getTeacher, Teacher } from "$lib/supabase";
import BecomeTeacher from "$lib/components/BecomeTeacher.svelte";
import CourseCard from "$lib/components/CourseCard.svelte";

let teacher: Teacher;
let becomeTeacherModalVisible = false;
let coursesByUser: Course[] = [];

onMount(async () => {
  teacher = await getTeacher();

  if (teacher) {
    coursesByUser = await getCourses({ byUser: true });
  }
});
</script>

<h1 class="text-center text-5xl m-7 font-bold">Dashboard</h1>

<main class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <section class="grid-section">
    <h2 class="heading">Courses you're learning from</h2>
  </section>
  <section class="grid-section">
    <h2 class="heading">Courses you're teaching</h2>
    {#if !teacher}
      <p class="text-center m-4">
        You're not a teacher yet!
        <button
          class="text-secondary hover:text-secondary-hover cursor-pointer"
          style="transition: color 500ms ease"
          on:click={() => (becomeTeacherModalVisible = true)}
        >
          Become a teacher
        </button>
      </p>
    {:else}
      <p class="text-center m-4">
        <a
          class="text-secondary hover:text-secondary-hover"
          style="transition: color 500ms ease"
          href="/dashboard/courses/new"
        >
          Create new course
        </a>
      </p>
      {#each coursesByUser as course}
        <CourseCard {course} {teacher} />
      {/each}
    {/if}
  </section>
</main>

<BecomeTeacher
  show={becomeTeacherModalVisible}
  on:close={() => (becomeTeacherModalVisible = false)}
  on:done={({ detail: tcher }) => {
    teacher = tcher;
    becomeTeacherModalVisible = false;
  }}
/>

<style lang="postcss">
.grid-section {
  @apply bg-primary rounded-lg px-6 py-4 m-4;
  .heading {
    @apply text-3xl text-center m-4;
  }
}
</style>
