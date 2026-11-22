// R5 — 60-day "No response" rule.
import { addDays, daysBetween } from "./dates.ts";
import type { ApplicationStatus } from "./types.ts";

export const NO_RESPONSE_AFTER_DAYS = 60;

/** Statuses the 60-day rule applies to (decision 012). */
export const NO_RESPONSE_STATUSES = ["sent", "in_process"] as const satisfies readonly ApplicationStatus[];

/**
 * If an application in Sent or In process has had no change for ≥ 60 days,
 * returns the date to record the automatic "No response" (last change + 60 days).
 * Otherwise returns null.
 */
export function noResponseDate(status: ApplicationStatus, lastChangeOn: string, today: string): string | null {
  if (!(NO_RESPONSE_STATUSES as readonly ApplicationStatus[]).includes(status)) return null;
  if (daysBetween(lastChangeOn, today) < NO_RESPONSE_AFTER_DAYS) return null;
  return addDays(lastChangeOn, NO_RESPONSE_AFTER_DAYS);
}
