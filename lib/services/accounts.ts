// Accounts service (US08-3).
import { notImplemented } from "../not-implemented.ts";
import type { CurrentUser } from "./types.ts";

/** Deletes the user; applications, history, reminders and events go by cascade (decision 027). */
export async function deleteAccount(user: CurrentUser): Promise<void> {
  return notImplemented(user);
}
