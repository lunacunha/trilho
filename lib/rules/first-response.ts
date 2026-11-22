// R1 — First response: the first status change from "Sent" to any status except "No response".
import { daysBetween } from "./dates.ts";
import type { StatusChangeInput } from "./types.ts";

export type FirstResponse = { date: string; days: number };

/**
 * Returns the first response and the response time in days, or null if there is none.
 * `changes` must be in chronological order.
 */
export function firstResponse(dateSent: string, changes: StatusChangeInput[]): FirstResponse | null {
  const first = changes.find((c) => c.status !== "sent" && c.status !== "no_response");
  return first ? { date: first.changedOn, days: daysBetween(dateSent, first.changedOn) } : null;
}
