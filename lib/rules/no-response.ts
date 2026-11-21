// R5 — 60-day "No response" rule.
import { notImplemented } from "../not-implemented.ts";
import type { ApplicationStatus } from "./types.ts";

export const NO_RESPONSE_AFTER_DAYS = 60;

/**
 * If an application in Sent or In process has had no change for ≥ 60 days,
 * returns the date to record the automatic "No response" (last change + 60 days).
 * Otherwise returns null.
 */
export function noResponseDate(status: ApplicationStatus, lastChangeOn: string, today: string): string | null {
  return notImplemented(status, lastChangeOn, today);
}
