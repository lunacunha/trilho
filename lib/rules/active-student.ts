// R9 — Active student: a consenting student with an application created or a status change
// in the last 30 days, today included (today and the 29 days before it).
import { notImplemented } from "../not-implemented.ts";

export type ActivityInput = {
  consent: boolean | null;
  /** Date of the latest application created or status change; null if none. */
  lastActivityOn: string | null;
};

export function isActiveStudent(input: ActivityInput, today: string): boolean {
  return notImplemented(input, today);
}
