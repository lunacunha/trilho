// Route access for pages (US01-4, US01-7, US07-1). Pages use the result to redirect;
// services still check the role themselves.
import type { UserRole } from "./types.ts";

export type AccessUser = { role: UserRole; consent: boolean | null };
export type AccessArea = "student" | "career_service";
export type AccessResult = "allow" | "login" | "consent" | "access_denied" | "dashboard";

export function routeAccess(user: AccessUser | null, area: AccessArea): AccessResult {
  if (user === null) return "login";
  if (area === "career_service") {
    return user.role === "career_service" ? "allow" : "access_denied";
  }
  if (user.role === "career_service") return "dashboard";
  return user.consent === null ? "consent" : "allow";
}
