// R6 — Status transitions.
import { MANUAL_STATUSES } from "../fixed-lists.ts";
import type { ApplicationStatus } from "./types.ts";

const MANUAL: readonly ApplicationStatus[] = MANUAL_STATUSES;

export type StatusChangeCheckInput = {
  from: ApplicationStatus;
  to: ApplicationStatus;
  changedOn: string;
  dateSent: string;
  lastChangeOn: string;
  today: string;
};

export type StatusChangeRejection =
  | "not_manual"
  | "same_status"
  | "future"
  | "before_date_sent"
  | "before_last_change";

export type StatusChangeCheck = { ok: true } | { ok: false; reason: StatusChangeRejection };

/**
 * Free movement between manual statuses (any direction, also out of No response); never
 * to No response or to the current status; date between max(date sent, last change) and today.
 * Dates are "YYYY-MM-DD", so string comparison is chronological.
 */
export function checkStatusChange(input: StatusChangeCheckInput): StatusChangeCheck {
  const reject = (reason: StatusChangeRejection): StatusChangeCheck => ({ ok: false, reason });
  if (!MANUAL.includes(input.to)) return reject("not_manual");
  if (input.to === input.from) return reject("same_status");
  if (input.changedOn > input.today) return reject("future");
  if (input.changedOn < input.dateSent) return reject("before_date_sent");
  if (input.changedOn < input.lastChangeOn) return reject("before_last_change");
  return { ok: true };
}
