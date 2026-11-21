// R1 — First response: the first status change from "Sent" to any status except "No response".
import { notImplemented } from "../not-implemented.ts";
import type { StatusChangeInput } from "./types.ts";

export type FirstResponse = { date: string; days: number };

/** Returns the first response and the response time in days, or null if there is none. */
export function firstResponse(dateSent: string, changes: StatusChangeInput[]): FirstResponse | null {
  return notImplemented(dateSent, changes);
}
