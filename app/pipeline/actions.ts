"use server";

import { refresh } from "next/cache";
import { NotFoundError } from "@/lib/services/errors";
import { dismissReminder, markFollowUpDone } from "@/lib/services/reminders";
import { requireArea } from "@/lib/session";

// Bound to the application id by the pipeline page. The service checks ownership and
// that a reminder is showing (US05-6); this action only maps the button to a service call.

export type ReminderActionState = { message?: string };

/** US05-5/6: "Follow-up done" or "Dismiss" on the reminder of the current quiet period. */
export async function reminderAction(
  id: string,
  _prev: ReminderActionState,
  formData: FormData,
): Promise<ReminderActionState> {
  const user = await requireArea("student");
  const outcome = formData.get("outcome");
  if (outcome !== "followup_done" && outcome !== "dismissed") {
    return { message: "Choose Follow-up done or Dismiss." };
  }

  try {
    if (outcome === "followup_done") await markFollowUpDone(user, id);
    else await dismissReminder(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      refresh();
      return { message: "This reminder is no longer showing. Reload the page." };
    }
    console.error("Reminder reaction failed", error);
    return { message: "We could not save that. Try again in a moment." };
  }

  refresh();
  return {};
}
