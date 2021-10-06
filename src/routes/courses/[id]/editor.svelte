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
import * as yup from "yup";
import session from "$lib/stores/session";

export let id: string;
let course: Course;
let loading = true;
let teacher: Teacher;
let sidebarOpen = true;
let sections: Section[] = [];

let editSection = false;
let selectedSection: Section | {} = null;

let selectedLesson: Partial<CourseLesson>;

let ytLink: string;
let mdContent: string;

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
  if (!window.confirm("Are you sure")) return;
  notifications.notify({ message: "Deleting section", type: "success" });
  const { error } = await supabase.from("course_sections").delete().eq("id", sectionId);
  if (error) {
    notifications.notify(error.message);
  } else {
    sections = sections.filter(i => i.id !== sectionId);
  }
  notifications.notify({ message: "Deleted section", type: "success" });
}

async function changeLessonMeta(lesson: typeof selectedLesson) {
  const schema = yup.object({
    title: yup.string().required(),
    description: yup.string().required(),
    type: yup.string().required().oneOf(["youtube", "markdown", "document"])
  });
  if (!(await schema.isValid(lesson))) return;
  const created = !lesson.id;
  const { error, data } = await supabase
    .from("course_lessons")
    .upsert({ ...lesson }, { returning: "representation" });
  if (error) {
    notifications.notify(error.message);
  } else {
    let ins = data[0];
    let section = sections.find(i => i.id === ins.section_id);
    if (created) section.lessons = [...section.lessons, ins];
    else section.lessons = section.lessons.map(i => (i.id === ins.id ? ins : i));
    sections = sections.map(i => (i.id === section.id ? section : i));
    selectedLesson = null;
  }
}

async function deleteLesson() {
  if (!selectedLesson) return;
  let lesson = selectedLesson;
  if (!window.confirm("Are you sure")) return;
  notifications.notify({ message: "Deleting lesson", type: "success" });
  const { error } = await supabase.from("course_lessons").delete().eq("id", lesson.id);
  if (error) {
    notifications.notify(error.message);
  } else {
    let section = sections.find(i => i.id === lesson.section_id);
    section.lessons = section.lessons.filter(i => i.id !== lesson.id);
    sections = sections.map(i => (i.id === section.id ? section : i));
    selectedLesson = null;
  }
}

async function addYt() {
  if (!selectedLesson) return;
  if (selectedLesson.type !== "youtube") return;
  const url = new URL(ytLink);
  if (!url.hostname.endsWith("youtube.com"))
    return notifications.notify("Invalid Youtube URL");
  const v = url.searchParams.get("v");
  if (!v) return notifications.notify("Invalid Youtube URL");
  const ytUrl = `https://youtube.com/embed/${v}`;
  selectedLesson.item_link = ytUrl;
  const { data, error } = await supabase
    .from("course_lessons")
    .update({
      item_link: ytUrl,
      type: "youtube"
    })
    .eq("id", selectedLesson.id);
  if (error) notifications.notify(error.message);
  else {
    selectedLesson = data[0];
    notifications.notify({
      type: "success",
      message: "Updated URL"
    });
  }
}

async function getMd() {
  if (!selectedLesson) return;
  if (selectedLesson.type !== "markdown") return;
  if (!selectedLesson.item_link) return;
  mdContent = "";
  try {
    const res = await fetch(selectedLesson.item_link, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + $session.access_token
      }
    });
    const data = await res.text();
    mdContent = data;
  } catch (e) {
    console.error(e);
  }
}

async function addMd() {
  if (selectedLesson?.type !== "markdown") return;
  if (!mdContent.trim()) return;
  try {
    const res = await fetch(`/courses/${id}/content?lesson=${selectedLesson.id}&md=1`, {
      method: "POST",
      headers: {
        "x-token": $session.access_token,
        "Content-Type": "text/plain"
      },
      body: mdContent.trim()
    });
    const data = await res.json();
    if (!res.ok) {
      notifications.notify(data.error);
    } else {
      selectedLesson = data[0];
      notifications.notify({
        type: "success",
        message: "Saved"
      });
    }
  } catch (e) {
    console.error(e);
  }
}

$: if (selectedLesson?.type === "markdown") getMd();

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
            <ol class="lessons">
              {#each section.lessons as lesson}
                <li
                  class="lesson"
                  on:click={() => {
                    selectedLesson = lesson;
                  }}
                >
                  {lesson.title}
                </li>
              {/each}
              <li
                class="sidebar-button"
                on:click={() => {
                  selectedLesson = {
                    course_id: course.id,
                    description: "",
                    title: "",
                    section_id: section.id,
                    type: "youtube"
                  };
                }}
              >
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
            </ol>
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
        <div class="sidebar-button" on:click={() => goto(`/courses/${id}`)}>
          Go to course
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
        <form
          on:submit|preventDefault={() => changeLessonMeta(selectedLesson)}
          class="lesson-meta"
        >
          <h3 class="text-2xl m-4">Lesson Metadata (click to edit)</h3>
          <input
            type="text"
            class="title-input"
            aria-label="Title"
            placeholder="Title"
            bind:value={selectedLesson.title}
          />
          <textarea
            rows={1}
            class="description-input"
            aria-label="Description"
            placeholder="Description"
            bind:value={selectedLesson.description}
          />
          <select
            class="type-input"
            aria-label="Type of content"
            bind:value={selectedLesson.type}
          >
            <option value="youtube">Type: Youtube Video</option>
            <option value="markdown">Type: Markdown</option>
            <option value="document">Type: Document</option>
          </select>
          <div class="flex gap-4 items-center my-2">
            <button
              class="button !bg-red-500 w-full"
              type="button"
              on:click={deleteLesson}>Delete</button
            >
            <button class="button !bg-secondary w-full" type="submit">Save</button>
          </div>
        </form>
        <hr class="my-4 border-t border-white" />
        <div class="m-4">
          <h3 class="text-2xl m-4">Edit lesson content</h3>
          {#if selectedLesson.id}
            {#if !selectedLesson.item_link}
              <p class="text-xl font-bold text-center text-red-500">
                This lesson has no content, and will, therefore, not be available to
                students.
              </p>
            {/if}
            {#if selectedLesson.type === "youtube"}
              <form on:submit|preventDefault={addYt}>
                <label for="yt-url">Enter Youtube Video URL</label>
                <input
                  bind:value={ytLink}
                  type="url"
                  id="yt-url"
                  placeholder="https://youtube.com/watch?v=XXXXXXXX"
                />
                <button class="button my-2 !bg-secondary w-full" type="submit"
                  >Save</button
                >
              </form>
              <iframe
                title="Video"
                allowFullScreen={true}
                src={selectedLesson.item_link}
                frameborder="0"
                width={1280}
                height={720}
              />
            {:else if selectedLesson.type === "markdown"}
              <form on:submit|preventDefault={addMd}>
                <label for="content">Enter content</label>
                <textarea
                  placeholder="Write some markdown here"
                  rows={15}
                  bind:value={mdContent}
                  id="content"
                />
                <small class="text-sm"
                  ><a href="/" class="link !text-secondary">How to style content</a
                  ></small
                >
                <button class="button my-2 !bg-secondary w-full" type="submit"
                  >Save</button
                >
              </form>
            {/if}
          {:else}
            <p class="text-center text-xl">Save your lesson to add content</p>
          {/if}
        </div>
      {:else}
        <h2 class="text-3xl m-4">Select a lesson to edit it</h2>
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
        @apply m-0 p-0 ml-2 list-decimal flex flex-col gap-2 justify-center;
        .lesson {
          @apply py-1 px-2;
        }
      }
    }
  }
  .lesson-area {
    .lesson-meta {
      @apply border-b border-black px-4 py-2;
      .title-input {
        @apply border border-black text-3xl font-bold font-sans my-2;
      }
      .description-input {
        @apply border border-black text-xl my-2;
      }
      .type-input {
        @apply px-4 py-2 w-full bg-white text-black my-2;
      }
    }
  }
}
</style>
