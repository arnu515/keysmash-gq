<script lang="ts">
import { createForm } from "felte";
import { validator } from "@felte/validator-yup";
import { svelteReporter, ValidationMessage } from "@felte/reporter-svelte";
import * as yup from "yup";
import supabase from "$lib/supabase";
import notifications from "$lib/stores/notifications";
import user from "$lib/stores/user";
import { goto } from "$app/navigation";
import { createEventDispatcher, onMount } from "svelte";
import profile from "$lib/stores/profile";

const d = createEventDispatcher();
let md5: (x: string) => string;

const schema = yup.object({
  username: yup
    .string()
    .required()
    .matches(/[\w_]+/g)
});

const { form } = createForm({
  onSubmit: auth,
  extend: [validator, svelteReporter],
  validateSchema: schema
});

async function auth({ username }: { username: string }) {
  if ($user && $profile) {
    notifications.notify("Already logged in!");
    goto("/");
    return;
  }

  const { error, data } = await supabase.from("profiles").insert({
    id: $user.id,
    username: username.trim(),
    avatar_url: `https://gravatar.com/avatar/${md5($user.email)}.png?d=mp&s=64`
  });
  if (error) {
    notifications.notify(error.message);
  } else {
    notifications.notify({
      message: "Created your account",
      type: "success"
    });
    $profile = data[0];
    d("done");
  }
}

onMount(async () => {
  const { default: mdfive } = await import("md5");
  md5 = mdfive;
});
</script>

<form
  use:form
  class="mx-auto w-[50%] max-w-[1100px] min-w-[300px] px-6 py-4 bg-primary rounded-lg"
>
  <h1 class="text-3xl text-center m-4">Create your profile</h1>
  <div class="mt-2">
    <label for="username">Username</label>
    <input type="text" name="username" id="username" placeholder="Enter a username" />
    <ValidationMessage let:messages={message} for="username">
      <small class:hidden={!message} class="text-sm text-red-500 mt-1">{message}</small>
    </ValidationMessage>
  </div>
  <div class="mt-2">
    <button class="button w-full !bg-secondary" type="submit">Create my profile</button>
  </div>
</form>
