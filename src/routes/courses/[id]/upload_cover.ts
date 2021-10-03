import { createClient } from "@supabase/supabase-js";
import type { RequestHandler } from "@sveltejs/kit";

export const post: RequestHandler = async ({ body, locals, headers, params }) => {
  if (!headers["content-type"]?.startsWith("image/") || !(body instanceof Uint8Array))
    return { status: 422, body: { error: "Invalid body" } };

  if (!headers["x-token"]) return { status: 401, body: { error: "Unauthorized" } };

  const supabase = createClient(
    locals.env.VITE_SUPABASE_URL,
    locals.env.SUPABASE_SERVICE_KEY
  );

  const { error: fError, data: fData } = await supabase
    .rpc<{ id: string; email: string }>("get_user_from_jwt", {
      jwt: headers["x-token"]
    })
    .select();
  if (fError || !fData[0]) {
    return { status: 401, body: { error: fError?.message || "Unauthorized" } };
  }
  const user = fData[0];

  const { error: cError, data: cData } = await supabase
    .from("courses")
    .select()
    .eq("id", params.id);
  if (cError || !cData[0]) {
    return { status: 401, body: { error: cError?.message || "Unauthorized" } };
  }
  const course = cData[0];
  if (course.teacher_id !== user.id) {
    return { status: 401, body: { error: "Unauthorized" } };
  }

  const { error: sError } = await supabase.storage
    .from("images")
    .upload(
      `course_covers/${course.id}.${headers["content-type"].split("/").pop()}`,
      body.buffer,
      {
        upsert: true
      }
    );
  if (sError) {
    return { body: { status: 400, error: sError.message } };
  }

  const { error: uError, data: uData } = supabase.storage
    .from("images")
    .getPublicUrl(
      `course_covers/${course.id}.${headers["content-type"].split("/").pop()}`
    );
  if (uError) {
    return { body: { status: 400, error: uError.message } };
  }

  const { error, data } = await supabase
    .from("courses")
    .update({
      cover_url: uData.publicURL
    })
    .eq("id", course.id);
  if (error) {
    return { body: { status: 400, error: error.message } };
  } else {
    return { body: data[0] };
  }
};
