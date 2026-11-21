// Career Service dashboard (US07). career_service role only; consenting students only.
import { notImplemented } from "../not-implemented.ts";
import type { CurrentUser, Dashboard } from "./types.ts";

/** Throws AccessDeniedError for students. Companies and channels follow R8. */
export async function getDashboard(user: CurrentUser, today: string): Promise<Dashboard> {
  return notImplemented(user, today);
}
