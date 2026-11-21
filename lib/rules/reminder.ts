// R4 — Reminder trigger and R12 — Reminder lifecycle.
import { notImplemented } from "../not-implemented.ts";
import type { ApplicationStatus, ReminderOutcome, ReminderReason } from "./types.ts";

export const FALLBACK_THRESHOLD_DAYS = 14;

/**
 * R4 threshold: the company median when it has a statistic (R3), otherwise 14 days.
 * Days are whole numbers, so a median of 16.5 gives a threshold of 17.
 */
export function reminderThreshold(companyMedianDays: number | null): {
  days: number;
  reason: ReminderReason;
} {
  return notImplemented(companyMedianDays);
}

export type ReminderStateInput = {
  status: ApplicationStatus;
  /** The last status change: it starts the current quiet period. */
  lastChange: { id: string; changedOn: string };
  today: string;
  thresholdDays: number;
  /** The reminder already stored for this application's latest quiet period, if any. */
  existing: { statusChangeId: string; outcome: ReminderOutcome | null } | null;
};

/**
 * - "none": no reminder (status not Sent/In process, or threshold not reached)
 * - "trigger": show it and record it for the first time in this quiet period
 * - "show": already triggered in this quiet period, no reaction yet
 * - "hidden": "Follow-up done" or "Dismiss" in this quiet period
 */
export type ReminderState = "none" | "trigger" | "show" | "hidden";

export function reminderState(input: ReminderStateInput): ReminderState {
  return notImplemented(input);
}
