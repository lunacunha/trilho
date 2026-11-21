// R6 — Status transitions.
import { notImplemented } from "../not-implemented.ts";
import type { ApplicationStatus } from "./types.ts";

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

export function checkStatusChange(input: StatusChangeCheckInput): StatusChangeCheck {
  return notImplemented(input);
}
