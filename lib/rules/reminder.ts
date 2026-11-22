// R4 — Reminder trigger and R12 — Reminder lifecycle.
import { daysBetween } from "./dates.ts";
import type { ApplicationStatus, ReminderOutcome, ReminderReason } from "./types.ts";

export const FALLBACK_THRESHOLD_DAYS = 14;

/** Statuses R4 applies to. */
export const REMINDER_STATUSES = ["sent", "in_process"] as const satisfies readonly ApplicationStatus[];

/**
 * R4 threshold: the company median when it has a statistic (R3), otherwise 14 days.
 * Days are whole numbers, so a median of 16.5 gives a threshold of 17.
 */
export function reminderThreshold(companyMedianDays: number | null): {
  days: number;
  reason: ReminderReason;
} {
  return companyMedianDays === null
    ? { days: FALLBACK_THRESHOLD_DAYS, reason: "fallback_14_days" }
    : { days: Math.ceil(companyMedianDays), reason: "company_median" };
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
 * Once triggered, a reminder keeps showing for its quiet period even if the threshold
 * later rises (R12: one reminder per quiet period).
 */
export type ReminderState = "none" | "trigger" | "show" | "hidden";

export function reminderState(input: ReminderStateInput): ReminderState {
  if (!(REMINDER_STATUSES as readonly ApplicationStatus[]).includes(input.status)) return "none";
  if (input.existing && input.existing.statusChangeId === input.lastChange.id) {
    return input.existing.outcome === null ? "show" : "hidden";
  }
  if (daysBetween(input.lastChange.changedOn, input.today) < input.thresholdDays) return "none";
  return "trigger";
}
