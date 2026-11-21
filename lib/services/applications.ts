// Applications service: create, read, edit, delete, status changes and the pipeline.
import { notImplemented } from "../not-implemented.ts";
import type { ApplicationInput, StatusChangeInput } from "../validation.ts";
import type { ApplicationDetail, CurrentUser, Pipeline } from "./types.ts";

/** US02-1/5/6: finds or creates the company (R11), inserts the application and its
 * initial status change in one transaction, and records `application_created`. */
export async function createApplication(
  user: CurrentUser,
  input: ApplicationInput,
  opts: { today: string; formSessionId?: string },
): Promise<{ id: string }> {
  return notImplemented(user, input, opts);
}

/** US03-3, US04-1: throws NotFoundError if missing or owned by someone else. */
export async function getApplication(user: CurrentUser, id: string): Promise<ApplicationDetail> {
  return notImplemented(user, id);
}

/** US04-4: edits fields; never creates a status change. */
export async function updateApplication(
  user: CurrentUser,
  id: string,
  input: ApplicationInput,
  today: string,
): Promise<void> {
  return notImplemented(user, id, input, today);
}

/** US04-5: deletes the application and (by cascade) its history and reminders. */
export async function deleteApplication(user: CurrentUser, id: string): Promise<void> {
  return notImplemented(user, id);
}

/** US04-1/2/3/8, R6: records a status change and updates current_status in one transaction. */
export async function changeStatus(
  user: CurrentUser,
  id: string,
  input: StatusChangeInput,
  today: string,
): Promise<void> {
  return notImplemented(user, id, input, today);
}

/** US03, US05: applies R5, then returns the student's columns with R10 and R4/R12 reminders,
 * recording `reminder_triggered` for reminders shown for the first time. */
export async function getPipeline(user: CurrentUser, today: string): Promise<Pipeline> {
  return notImplemented(user, today);
}
