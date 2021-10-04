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
  getCourses,
  getTeacher,
  Teacher
} from "$lib/supabase";
import { onMount } from "svelte";
import notifications from "$lib/stores/notifications";
import EditOrCreateSectionModal from "$lib/components/EditOrCreateSectionModal.svelte";

export let id: string;
let course: Course;
let loading = true;
let teacher: Teacher;
let sidebarOpen = true;
let sections: Section[] = [];

let editSection = false;
let selectedSection: Section | {} = null;

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

async function createOrEditSection(
  section: Omit<CourseSection, "created_at" | "course_id">,
  edit = false
) {
  console.log({ section, edit });
  if (edit && !section.id) return;
  const toInsert = {
    name: section.name,
    description: section.description,
    id: edit ? section.id : undefined,
    course_id: course.id
  };
  const { data, error } = await supabase
    .from("course_sections")
    .upsert(toInsert, { returning: "representation" });

  if (error) {
    notifications.notify(error.message);
  } else {
    const section = data[0];
    if (!edit) sections = [...sections, { ...section, lessons: [] }];
    else
      sections = sections.map(i => {
        if (i.id !== section.id) return i;
        return { ...section, lessons: [] };
      });

    notifications.notify({
      message: `${edit ? "Edited" : "Created"} section`,
      type: "success"
    });
  }
}

async function deleteSection(sectionId: number) {
  notifications.notify({ message: "Deleting section", type: "success" });
  const { error } = await supabase.from("course_sections").delete().eq("id", sectionId);
  if (error) {
    notifications.notify(error.message);
  } else {
    sections = sections.filter(i => i.id !== sectionId);
  }
  notifications.notify({ message: "Deleted section", type: "success" });
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

  sections = await getSections();

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
          Sections and Lessons <span
            class="close"
            on:click={() => (sidebarOpen = false)}>&laquo;</span
          >
        </h2>
        {#each sections as section}
          <div class="section">
            <div
              class="name"
              on:click={() => {
                selectedSection = section;
                editSection = true;
              }}
            >
              {section.name}
            </div>
            <ul class="lessons">
              {#each section.lessons as lesson}
                <li class="lesson">{lesson.title}</li>
              {/each}
              <li class="sidebar-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add lesson
              </li>
            </ul>
          </div>
        {/each}
        <div class="sidebar-button" on:click={() => (selectedSection = {})}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create new section
        </div>
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

<EditOrCreateSectionModal
  show={!!selectedSection}
  defaultValues={selectedSection || {}}
  edit={editSection}
  on:delete={({ detail: id }) => {
    deleteSection(id);
    selectedSection = undefined;
    editSection = false;
  }}
  on:close={() => {
    selectedSection = undefined;
    editSection = false;
  }}
  on:done={e => {
    const { section, edit } = e.detail;
    createOrEditSection(section, edit);
    selectedSection = undefined;
    editSection = false;
  }}
/>

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
        @apply bg-primary-dark px-4 py-2;
      }
      .lessons {
        @apply m-0 p-0 ml-2 list-none flex flex-col gap-2 justify-center;
        .lesson {
          @apply py-1 px-2;
        }
      }
    }
  }
}
</style>
