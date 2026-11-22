// R9 — Active student: a consenting student with an application created or a status change
// in the last 30 days, today included (today and the 29 days before it).
import { daysBetween } from "./dates.ts";

export const ACTIVE_WINDOW_DAYS = 30;

export type ActivityInput = {
  consent: boolean | null;
  /** Date of the latest application created or status change; null if none. */
  lastActivityOn: string | null;
};

export function isActiveStudent(input: ActivityInput, today: string): boolean {
  if (input.consent !== true || input.lastActivityOn === null) return false;
  const daysAgo = daysBetween(input.lastActivityOn, today);
  return daysAgo >= 0 && daysAgo < ACTIVE_WINDOW_DAYS;
}
