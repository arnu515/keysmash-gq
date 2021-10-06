import { createClient } from "@supabase/supabase-js";
import sanitize from "sanitize-html";
import type { RequestHandler } from "@sveltejs/kit";

export function sanitizeMd(md: string): string {
  return sanitize(md, {
    allowedTags: [
      "address",
      "article",
      "aside",
      "footer",
      "header",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hgroup",
      "main",
      "nav",
      "section",
      "blockquote",
      "dd",
      "div",
      "dl",
      "dt",
      "figcaption",
      "figure",
      "hr",
      "li",
      "main",
      "ol",
      "p",
      "pre",
      "ul",
      "a",
      "abbr",
      "b",
      "bdi",
      "bdo",
      "br",
      "cite",
      "code",
      "data",
      "dfn",
      "em",
      "i",
      "kbd",
      "mark",
      "q",
      "rb",
      "rp",
      "rt",
      "rtc",
      "ruby",
      "s",
      "samp",
      "small",
      "span",
      "strong",
      "sub",
      "sup",
      "time",
      "u",
      "var",
      "wbr",
      "caption",
      "col",
      "colgroup",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr"
    ],
    allowedAttributes: {
      a: ["href", "target"]
    },
    disallowedTagsMode: "escape"
  });
}

export const post: RequestHandler = async ({
  body,
  locals,
  headers,
  params,
  query
}) => {
  if (typeof body !== "string" && !(body instanceof Uint8Array)) {
    return { status: 422, body: { error: "Invalid body" } };
  }
  const lessonId = query.get("lesson");
  const md = !!query.get("md");
  if (!lessonId) return { status: 422, body: { error: "Give lesson qs" } };

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
  if (fError || !fData) {
    return { status: 401, body: { error: fError?.message || "Invalid token" } };
  }
  const user = fData as unknown as { id: string };

  const { error: cError, data: cData } = await supabase
    .from("courses")
    .select()
    .eq("id", params.id);
  if (cError || !cData[0]) {
    return {
      status: cError ? 400 : 404,
      body: { error: cError?.message || "Course not found" }
    };
  }
  const course = cData[0];
  if (course.teacher_id !== user.id) {
    return { status: 403, body: { error: "Forbidden" } };
  }

  const { error: lError, data: lData } = await supabase
    .from("course_lessons")
    .select()
    .eq("id", lessonId)
    .eq("course_id", course.id);
  if (lError || !lData[0]) {
    return {
      status: lError ? 400 : 404,
      body: { error: lError?.message || "Lesson not found" }
    };
  }
  const lesson = lData[0];

  if (md && typeof body === "string") {
    body = sanitize(body);
  }

  const { error: sError } = await supabase.storage
    .from("images")
    .upload(
      `lesson_content/${lesson.id}.${
        md ? "md" : headers["content-type"].split("/").pop()
      }`,
      typeof body === "string" ? body : body.buffer,
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
      `lesson_content/${lesson.id}.${
        md ? "md" : headers["content-type"].split("/").pop()
      }`
    );
  if (uError) {
    return { body: { status: 400, error: uError.message } };
  }

  const { error, data } = await supabase
    .from("course_lessons")
    .update({
      item_link: uData.publicURL
    })
    .eq("id", lesson.id);
  if (error) {
    return { body: { status: 400, error: error.message } };
  } else {
    return { body: data[0] };
  }
};
