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
import supabase, {
  Course,
  CourseLesson,
  CourseSection,
  getCourses
} from "$lib/supabase";
import { onMount } from "svelte";
import notifications from "$lib/stores/notifications";
import { session } from "$app/stores";
import type MarkdownIt from "markdown-it";
import "$lib/md.postcss";

export let id: string;
let course: Course;
let loading = true;
let sidebarOpen = true;
let sections: Section[] = [];
let selectedLesson: Partial<CourseLesson>;

let mdit: MarkdownIt;
let mdContent = "Loading...";

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

async function getMd() {
  if (!selectedLesson) return;
  if (selectedLesson.type !== "markdown") return;
  if (!selectedLesson.item_link) return;
  mdContent = "";
  try {
    const res = await fetch(selectedLesson.item_link, {
      method: "GET",
      cache: "no-cache",
      headers: {
        Authorization: "Bearer " + $session.access_token
      }
    });
    const data = await res.text();
    mdContent = mdit.render(data);
  } catch (e) {
    console.error(e);
  }
}

$: if (selectedLesson && selectedLesson.type === "markdown" && selectedLesson.item_link)
  getMd();

onMount(async () => {
  if (!$user) {
    goto("/auth");
    return;
  }

  if (!(await getUserEnrolled())) {
    notifications.notify("You haven't enrolled for this course yet");
    goto(`/courses/${id}`);
  }

  const { default: MarkdownIt } = await import("markdown-it");
  const { default: hljs } = await import("highlight.js");
  mdit = new MarkdownIt({
    highlight: (str, lang) => {
      console.log(str, lang);
      try {
        return (
          '<pre class="hljs lang-' +
          lang +
          "><code>" +
          hljs.highlightAuto(str).value +
          "</code></pre>"
        );
      } catch (e) {
        console.error(e);
      }
      return '<pre class="hljs"><code>' + mdit.utils.escapeHtml(str) + "</code></pre>";
    },
    html: true,
    linkify: true,
    breaks: true
  });

  const courses = await getCourses({ id });
  if (Array.isArray(courses) && courses.length > 0) course = courses[0];
  if (!course) {
    notifications.notify("Course not found");
    loading = false;
    return;
  }

  sections = await getSections();

  loading = false;
});
</script>

<svelte:head>
  <!-- TODO: Add title, desc, meta tags for all web pages -->
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.2.0/styles/github-dark.min.css"
    integrity="sha512-rO+olRTkcf304DQBxSWxln8JXCzTHlKnIdnMUwYvQa9/Jd4cQaNkItIUj6Z4nvW1dqK0SKXLbn9h4KwZTNtAyw=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
  <title>Keysmash - Free courses for everyone</title>
  <meta
    name="description"
    content="Keysmash provides free developer courses for everyone"
  />
</svelte:head>

{#if !loading && course && $user}
  <header class="bg-primary border-b border-primary-dark py-6">
    <h1 class="text-center text-4xl font-bold m-4">{course.name}</h1>
    <p class="text-center text-xl m-4">{course.description}</p>
  </header>
  <section class="main">
    {#if sidebarOpen}
      <aside class="sidebar">
        <h2 class="title">
          Sections and Lessons <span
            class="close"
            on:click={() => (sidebarOpen = false)}>&laquo;</span
          >
        </h2>
        {#each sections as section}
          <div class="section">
            <div class="name">
              {section.name}
              {#if section.description}
                <p class="desc">
                  {section.description}
                </p>
              {/if}
            </div>
            <ol class="lessons">
              {#each section.lessons as lesson}
                {#if lesson.item_link}
                  <li
                    class="lesson"
                    on:click={() => {
                      selectedLesson = lesson;
                    }}
                  >
                    {lesson.title}
                  </li>
                {/if}
              {/each}
            </ol>
          </div>
        {/each}
        <div class="sidebar-button" on:click={() => goto("/dashboard")}>
          Go to dashboard
        </div>
      </aside>
    {/if}
    <main class="lesson-area">
      {#if !sidebarOpen}
        <small
          class="m-4 text-gray-200 font-mono hover:underline cursor-pointer"
          on:click={() => (sidebarOpen = true)}>&raquo; Open sidebar</small
        >
      {/if}
      {#if selectedLesson}
        <h1 class="title">{selectedLesson.title}</h1>
        <p class="description">{selectedLesson.description}</p>
        <hr class="w-full border-t border-white my-4" />
        {#if selectedLesson.type === "youtube"}
          <iframe
            title="Video"
            allowFullScreen={true}
            src={selectedLesson.item_link}
            frameborder="0"
            width={1280}
            height={720}
          />
        {:else}
          <div class="md-content">
            {@html mdContent}
          </div>
        {/if}
      {:else}
        <h2 class="text-3xl m-4">Select a lesson in the sidebar</h2>
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
    .sidebar-button {
      @apply bg-primary mt-2 cursor-pointer px-4 py-2 flex gap-4 items-center;
      transition: 500ms filter ease;
      &:hover {
        filter: brightness(1.1);
      }
    }
    .section {
      @apply mt-2;
      * {
        cursor: pointer;
        transition: 500ms filter ease;
      }
      *:hover {
        filter: brightness(1.1);
      }
      .name {
        @apply bg-primary-dark px-4 py-2 cursor-default;
        .desc {
          @apply ml-4 text-gray-300;
        }
      }
      .lessons {
        @apply m-0 p-0 ml-2 list-decimal flex flex-col gap-2 justify-center;
        .lesson {
          @apply py-1 px-2;
        }
      }
    }
  }

  .lesson-area {
    @apply p-4 w-full;
    .title {
      @apply text-4xl font-bold;
    }
    .description {
      @apply text-xl text-gray-300;
    }
  }
}
</style>
