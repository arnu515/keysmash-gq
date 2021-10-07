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
import supabase, {
  Course,
  CourseLesson,
  CourseSection,
  getCourses,
  getProfile,
  getTeacher,
  Profile,
  Teacher
} from "$lib/supabase";
import notifications from "$lib/stores/notifications";
import user from "$lib/stores/user";
import { goto } from "$app/navigation";
import AuthModal from "$lib/components/AuthModal.svelte";

export let id: string;
let loading = true;
let course: Course;
let sections: Section[];
let instructor: { teacher: Teacher; profile: Profile };
let isUserEnrolled = false;
let showAuthModal = false;

interface Section extends CourseSection {
  lessons: CourseLesson[];
}

async function getSections() {
  // Get all sections of a course with lessons
  const { error, data } = await supabase
    .from("course_sections")
    .select(
      `
    id,
    created_at,
    name,
    course_id,
    description,
    lessons:course_lessons(
      *
    )
  `
    )
    .eq("course_id", course.id);
  if (error) {
    notifications.notify(error.message);
    return [];
  } else {
    return data;
  }
}

async function getUserEnrolled() {
  if ($user) {
    const { data } = await supabase
      .from("user_enrolled_courses")
      .select()
      .eq("user_id", $user.id)
      .eq("course_id", id);
    return !!data?.[0];
  }
  return false;
}

async function enrollInCourse() {
  if (!$user) {
    showAuthModal = true;
    return;
  }
  if (!window.confirm("Are you sure?")) return;
  if (isUserEnrolled) return goto(`/dashboard/courses/${id}`);
  const { error } = await supabase.from("user_enrolled_courses").insert({
    user_id: $user.id,
    course_id: course.id
  });
  if (error) {
    notifications.notify(error.message);
  } else goto(`/dashboard/courses/${id}`);
}

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

  sections = await getSections();

  isUserEnrolled = await getUserEnrolled();

  loading = false;
});

$: console.log({ course, instructor });
</script>

<svelte:head>
  <title>{course?.name || "Loading..."}</title>
  <meta
    name="description"
    content={course?.description || "Free courses for everyone"}
  />
  <meta name="keywords" content={course.tags.split("\n").join(",")} />
</svelte:head>

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
        {#if course.cover_url}
          <img
            on:click={() => (window.location.href = course.cover_url)}
            src={course.cover_url}
            alt="Course's cover"
            class="cover"
          />
        {/if}
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
            <div class="flex gap-4 mr-4 items-center">
              {#if $user?.id === instructor.teacher.id}
                <a href="/courses/{course.id}/edit" class="button">Edit course</a>
              {/if}
              {#if isUserEnrolled}
                <a href="/dashboard/courses/{course.id}" class="button !bg-secondary"
                  >View Course</a
                >
              {:else}
                <button on:click={enrollInCourse} class="button font-bold !bg-secondary"
                  >Enroll</button
                >
              {/if}
            </div>
          </h1>
          <p class="desc">{course.description}</p>

          <div class="course-content">
            <h2 class="title">Course content</h2>
            {#if sections}
              <div class="content">
                {#each sections as section, sectionIndex}
                  <div class="section">
                    {sectionIndex + 1}. {section.name}
                  </div>
                  {#each section.lessons as lesson, lessonIndex}
                    <div class="lesson">{lessonIndex + 1}. {lesson.title}</div>
                  {/each}
                {/each}
              </div>
            {/if}
          </div>
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

<AuthModal show={showAuthModal} on:close={() => (showAuthModal = false)} />

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
      .button {
        @apply text-base;
      }
    }
    .desc {
      @apply text-2xl m-4;
      font-family: Ubuntu, sans-serif;
    }
  }
}

.course-content {
  .title {
    @apply text-3xl font-bold m-4;
  }
  .content {
    @apply mt-4;
    .section {
      @apply bg-primary-dark px-4 py-2 text-2xl font-bold;
    }
    .lesson {
      @apply bg-primary-light pl-6 border-b border-primary text-xl py-2;
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
