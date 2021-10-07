<script lang="ts">
import { onMount } from "svelte";
import supabase, { Course, getCourses, getTeacher, Teacher } from "$lib/supabase";
import BecomeTeacher from "$lib/components/BecomeTeacher.svelte";
import CourseCard from "$lib/components/CourseCard.svelte";
import user from "$lib/stores/user";
import { goto } from "$app/navigation";
import notifications from "$lib/stores/notifications";

let teacher: Teacher;
let becomeTeacherModalVisible = false;
let enrolledCourses: ({ teacher: Teacher } & Course)[] = [];
let coursesByUser: Course[] = [];

async function getEnrolledCourses() {
  if (!$user) return;
  const { error, data: ueData } = await supabase
    .from("user_enrolled_courses")
    .select()
    .eq("user_id", $user.id);
  if (error) notifications.notify(error.message);
  else {
    const courseIds: number[] = ueData.map(i => i.course_id);
    const { error, data: courses } = await supabase
      .from("courses")
      .select(
        `
      id,
      name,
      teacher:teachers(*),
      cover_url,
      tags,
      description,
      learning_goals,
      is_public
    `
      )
      .in("id", courseIds);
    if (error) notifications.notify(error.message);
    else return courses;
  }
}

onMount(async () => {
  if (!$user) {
    goto("/");
    return;
  }

  teacher = await getTeacher();

  if (teacher) {
    getCourses({ byUser: true }).then(c => (coursesByUser = c));
  }
  getEnrolledCourses().then(c => (enrolledCourses = c));
});

$: console.log(enrolledCourses);
</script>

<svelte:head>
  <title>Keysmash - Free courses for everyone</title>
  <meta
    name="description"
    content="Keysmash provides free developer courses for everyone"
  />
</svelte:head>

{#if $user}
  <h1 class="text-center text-5xl m-7 font-bold">Dashboard</h1>

  <main class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <section class="grid-section">
      <h2 class="heading">Courses you're learning from</h2>
      {#each enrolledCourses as course}
        <CourseCard {course} teacher={course.teacher} showCover={false} />
      {/each}
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
          <CourseCard {course} {teacher} showCover={false} />
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
{/if}

<style lang="postcss">
.grid-section {
  @apply bg-primary rounded-lg px-6 py-4 m-4;
  .heading {
    @apply text-3xl text-center m-4;
  }
}
</style>
