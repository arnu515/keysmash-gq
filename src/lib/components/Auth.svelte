<script lang="ts">
import { createForm } from "felte";
import { validator } from "@felte/validator-yup";
import { svelteReporter, ValidationMessage } from "@felte/reporter-svelte";
import * as yup from "yup";
import supabase from "$lib/supabase";
import notifications from "$lib/stores/notifications";
import user from "$lib/stores/user";
import { goto } from "$app/navigation";
import { createEventDispatcher } from "svelte";

const d = createEventDispatcher();

const schema = yup.object({
  email: yup.string().email().required()
});

const { form } = createForm({
  onSubmit: auth,
  extend: [validator, svelteReporter],
  validateSchema: schema
});

async function auth({ email }: { email: string }) {
  if ($user) {
    notifications.notify("Already logged in!");
    goto("/");
    return;
  }

  const { error } = await supabase.auth.signIn({ email });
  if (error) {
    notifications.notify(error.message);
  } else {
    notifications.notify({
      message: "Check your email!",
      type: "success"
    });
    d("done");
  }
}
</script>

<form
  use:form
  class="mx-auto w-[50%] max-w-[1100px] min-w-[300px] px-6 py-4 bg-primary rounded-lg"
>
  <h1 class="text-3xl text-center m-4">Authenticate</h1>
  <div class="mt-2">
    <label for="email">Email</label>
    <input type="email" name="email" id="email" placeholder="Enter your email" />
    <ValidationMessage let:messages={message} for="email">
      <small class:hidden={!message} class="text-sm text-red-500 mt-1">{message}</small>
    </ValidationMessage>
  </div>
  <div class="mt-2 flex gap-4 items-center">
    <button class="button w-full" on:click={() => d("cancel")} type="button"
      >Cancel</button
    >
    <button class="button w-full !bg-secondary" type="submit">✉ Send me a link!</button>
  </div>
</form>
