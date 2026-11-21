// Entry-layer helpers: read the session and turn it into a CurrentUser. Server code only.
// Not cached across requests (consent changes must take effect immediately); React's
// cache() only shares the result within one request.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth.ts";
import { routeAccess, type AccessArea } from "./rules/access.ts";
import type { CurrentUser } from "./services/types.ts";

export type SessionUser = CurrentUser & { name: string; email: string };

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role, consent } = session.user;
  return {
    id,
    name,
    email,
    role: role === "career_service" ? "career_service" : "student",
    consent: consent ?? null,
  };
});

/** The page path for each non-"allow" access result. */
const REDIRECTS = {
  login: "/login",
  consent: "/onboarding/consent",
  access_denied: "/access-denied",
  dashboard: "/admin/overview",
} as const;

/** Redirects unless the current user may open a page of `area`; returns the user otherwise. */
export async function requireArea(area: AccessArea): Promise<SessionUser> {
  const user = await getCurrentUser();
  const result = routeAccess(user, area);
  if (result !== "allow") redirect(REDIRECTS[result]);
  if (user === null) redirect("/login"); // unreachable: routeAccess(null) is "login"
  return user;
}

/** Where "/" (and a finished login) should send this user. */
export function homePathFor(user: SessionUser | null): string {
  if (user === null) return "/login";
  if (user.role === "career_service") return "/admin/overview";
  return user.consent === null ? "/onboarding/consent" : "/pipeline";
}
