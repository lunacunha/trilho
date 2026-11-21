// R7 — Reply rate: applications with a first response ÷ all applications, consenting students only.
import { notImplemented } from "../not-implemented.ts";
import type { StatApplication } from "./types.ts";

export type ReplyRate = { applications: number; replied: number; rate: number };

/** Returns null when there are no applications from consenting students. `rate` is 0–1. */
export function replyRate(applications: StatApplication[]): ReplyRate | null {
  return notImplemented(applications);
}
