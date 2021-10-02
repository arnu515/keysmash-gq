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
import {
  Course,
  getCourses,
  getProfile,
  getTeacher,
  Profile,
  Teacher
} from "$lib/supabase";
import notifications from "$lib/stores/notifications";
import user from "$lib/stores/user";

export let id: string;
let loading = true;
let course: Course;
let instructor: { teacher: Teacher; profile: Profile };

onMount(async () => {
  const courses = await getCourses({ id });
  if (Array.isArray(courses) && courses.length > 0) course = courses[0];
  if (!course) {
    loading = false;
    return;
  }

  // Get the teacher and profile of the teacher of the course
  const teacher = await getTeacher(course.teacher_id);
  const teacherProfile = await getProfile(teacher?.id);
  if (!teacher || !teacherProfile) {
    notifications.notify("Something went wrong! Check the console for details");
    console.error(
      "courses/id.svelte:33 -> teacher / teacher's profile was not found, relevant information logged"
    );
    console.log({ course, courses, teacher, teacherProfile, id });
    course = null;
    return;
  }
  instructor = { teacher, profile: teacherProfile };

  loading = false;
});

$: console.log({ course, instructor });
</script>

{#if !loading}
  {#if !course}
    <div
      class="mx-auto mt-8 w-[50%] max-w-[1100px] min-w-[300px] px-6 py-4 bg-primary rounded-lg"
    >
      <h1 class="text-center text-5xl m-4 font-bold">Course not found!</h1>
      <p class="text-center text-xl m-4 font-ubuntu">
        That course wasn't found. Check the URL and try again
      </p>
      <p class="text-center m-4">
        <a href="/" class="button !bg-secondary">Homepage</a>
      </p>
    </div>
  {:else}
    <main class="course-grid">
      <section id="course" class="card">
        <img
          on:click={() => (window.location.href = course.cover_url)}
          src={course.cover_url}
          alt="Course's cover"
          class="cover"
        />
        {#if !course.is_public}
          <div class="private">
            This course is private!
            <a href="/courses/{course.id}/edit" class="underline font-bold">Edit it</a> to
            make it public
          </div>
        {/if}
        <div class="content">
          <h1 class="title">
            {course.name}
            {#if $user?.id === instructor.teacher.id}
              <button class="button !bg-secondary">Enroll now</button>
            {:else}
              <a href="/courses/{course.id}/edit" class="button !bg-secondary"
                >Edit course</a
              >
            {/if}
          </h1>
          <p class="desc">{course.description}</p>
        </div>
      </section>
      <aside>
        <section id="about-the-instructor" class="card">
          <h2 class="text-center font-bold text-3xl m-4">About the instructor</h2>
          <div class="flex justify-center m-4 items-center gap-4">
            <img
              src={instructor.profile.avatar_url}
              alt="Instructor's avatar"
              class="w-16 h-16 rounded-full border border-white"
            />
            <div class="flex flex-col justify-center gap-1">
              <p class="font-bold">{instructor.teacher.full_name}</p>
              <p class="text-gray-500 text-sm">{instructor.profile.username}</p>
            </div>
          </div>
          {#if instructor.teacher.about}
            <p class="m-4 text-lg font-ubuntu text-center">
              {instructor.teacher.about}
            </p>
          {/if}
          {#if instructor.teacher.website}
            <p class="m-4 text-gray-500 text-sm text-center">
              <a href={instructor.teacher.website}
                >Website of {instructor.teacher.full_name}</a
              >
            </p>
          {/if}
        </section>
        <section id="goals" class="card">
          <h2 class="text-center font-bold text-3xl m-4">Learning goals</h2>
          <ol class="m-4 p-4 list-decimal">
            {#each course.learning_goals.split("\n") as goal}
              <li>{goal}</li>
            {/each}
          </ol>
        </section>
      </aside>
    </main>
  {/if}
{/if}

<style lang="postcss">
.course-grid {
  display: grid;
  grid-template-columns: auto;
  gap: 1rem;
  margin: 1rem;
}

.card {
  @apply bg-primary border border-transparent rounded-2xl;
}

#course {
  .private {
    @apply text-center px-4 py-2 bg-red-500 text-white;
    margin-top: -1px;
  }
  img {
    @apply w-full;
    max-height: 360px;
    cursor: pointer;
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
  }
  .content {
    @apply px-6 py-4;
    .title {
      @apply text-4xl font-bold m-4 flex items-center justify-between;
      button {
        @apply text-base;
      }
    }
    .desc {
      @apply text-2xl m-4;
      font-family: Ubuntu, sans-serif;
    }
  }
}

aside {
  @apply flex flex-col gap-4;
}

@media screen(md) {
  .course-grid {
    grid-template-columns: 75% 25%;
  }
}
</style>
