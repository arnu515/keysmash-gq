<script lang="ts">
import CourseCard from "$lib/components/CourseCard.svelte";
import notifications from "$lib/stores/notifications";
import type { Course, Teacher } from "$lib/supabase";
import supabase from "$lib/supabase";
import { onMount } from "svelte";

let courses: (Course & { teacher: Teacher })[] = [];

async function getCourses() {
  const { error, data: courses } = await supabase.from("courses").select(
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
  );
  if (error) notifications.notify(error.message);
  else return courses;
}

onMount(async () => {
  courses = await getCourses();
});
</script>

<h1 class="text-5xl text-center m-4">Courses on KeySmash</h1>
<div
  class="m-4 mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
>
  {#each courses as course}
    <CourseCard {course} teacher={course.teacher} />
  {/each}
</div>
