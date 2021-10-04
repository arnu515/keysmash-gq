<script lang="ts">
import type { Course, Teacher } from "$lib/supabase";
import day from "dayjs";

export let course: Course;
export let teacher: Teacher;
export let showCover = true;
</script>

<a href="/courses/{course.id}">
  <article class="bg-primary-light rounded-lg m-4">
    {#if course.cover_url && showCover}
      <img
        src={course.cover_url}
        alt="Cover of {course.name}"
        class="w-full max-h-[180px]"
        style="border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem"
      />
    {/if}
    <div class="p-4">
      <h3 class="text-2xl">{course.name}</h3>
      <p class="text-gray-500 text-sm flex items-center justify-between">
        <span>By: {teacher.full_name}</span>
        <span>Added: {day(course.created_at).format("YYYY-MM-DD")}</span>
      </p>
    </div>
  </article>
</a>
