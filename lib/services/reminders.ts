// Reminders service (US05-5/6, R12): reactions to the reminder of the current quiet period.
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db/client.ts";
import { application, reminder, statusChange } from "../../db/schema.ts";
import type { ReminderOutcome } from "../rules/types.ts";
import { AccessDeniedError, NotFoundError } from "./errors.ts";
import { recordEvent } from "./events.ts";
import type { CurrentUser } from "./types.ts";

const idSchema = z.uuid();

const EVENT_OF = {
  followup_done: "reminder_followup_done",
  dismissed: "reminder_dismissed",
} as const satisfies Record<ReminderOutcome, string>;

/**
 * Sets the outcome of the reminder showing for the application's current quiet period and
 * records the event, in one transaction. Never changes the status (R12).
 * NotFoundError if the application is missing or someone else's, or no reminder is showing (US05-6).
 */
async function react(user: CurrentUser, applicationId: string, outcome: ReminderOutcome): Promise<void> {
  if (user.role !== "student") throw new AccessDeniedError();
  if (!idSchema.safeParse(applicationId).success) throw new NotFoundError();

  await db.transaction(async (tx) => {
    // The row lock serialises this with status changes, so the quiet period cannot move meanwhile
    const [owned] = await tx
      .select({ id: application.id })
      .from(application)
      .where(and(eq(application.id, applicationId), eq(application.userId, user.id)))
      .for("update");
    if (!owned) throw new NotFoundError();

    const [last] = await tx
      .select({ id: statusChange.id })
      .from(statusChange)
      .where(eq(statusChange.applicationId, owned.id))
      .orderBy(desc(statusChange.changedOn), desc(statusChange.createdAt))
      .limit(1);
    if (!last) throw new NotFoundError();

    const updated = await tx
      .update(reminder)
      .set({ outcome, outcomeAt: new Date() })
      .where(and(eq(reminder.statusChangeId, last.id), eq(reminder.applicationId, owned.id), isNull(reminder.outcome)))
      .returning({ id: reminder.id });
    if (updated.length === 0) throw new NotFoundError();

    await recordEvent(tx, user.id, EVENT_OF[outcome], { application_id: owned.id }, owned.id);
  });
}

/** Marks "Follow-up done" and records `reminder_followup_done`. Status is unchanged. */
export async function markFollowUpDone(user: CurrentUser, applicationId: string): Promise<void> {
  await react(user, applicationId, "followup_done");
}

/** Marks "Dismiss" and records `reminder_dismissed`. Status is unchanged. */
export async function dismissReminder(user: CurrentUser, applicationId: string): Promise<void> {
  await react(user, applicationId, "dismissed");
}
