// Reminders service (US05-5/6, R12): reactions to the reminder of the current quiet period.
import { notImplemented } from "../not-implemented.ts";
import type { CurrentUser } from "./types.ts";

/** Marks "Follow-up done" and records `reminder_followup_done`. Status is unchanged. */
export async function markFollowUpDone(user: CurrentUser, applicationId: string): Promise<void> {
  return notImplemented(user, applicationId);
}

/** Marks "Dismiss" and records `reminder_dismissed`. Status is unchanged. */
export async function dismissReminder(user: CurrentUser, applicationId: string): Promise<void> {
  return notImplemented(user, applicationId);
}
