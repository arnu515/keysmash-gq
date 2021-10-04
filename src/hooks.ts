import dotenv from "dotenv";
dotenv.config();
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ request, resolve }) => {
  request.locals.env = process.env;

  const response = await resolve(request);

  return response;
};
