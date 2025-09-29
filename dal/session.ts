// lib/dal/session.ts
import "server-only";
import { headers } from "next/headers";
import { cache } from "react"; // React's built-in cache
import { auth } from "@/lib/auth";

export const getCachedSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
});

export const getSessionFromRequest = cache(async (request: Request) => {
  const session = await auth.api.getSession({
    headers: request.headers, // pass raw headers (cookies + authorization)
  });
  return session;
});
