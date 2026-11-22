// R7 — Reply rate: applications with a first response ÷ all applications, consenting students only.
import { firstResponse } from "./first-response.ts";
import type { StatApplication } from "./types.ts";

export type ReplyRate = { applications: number; replied: number; rate: number };

/** Returns null when there are no applications from consenting students. `rate` is 0–1. */
export function replyRate(applications: StatApplication[]): ReplyRate | null {
  const counted = applications.filter((a) => a.consent === true);
  if (counted.length === 0) return null;
  const replied = counted.filter((a) => firstResponse(a.dateSent, a.changes) !== null).length;
  return { applications: counted.length, replied, rate: replied / counted.length };
}
