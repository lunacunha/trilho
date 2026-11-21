// Zod schemas for every server-side input (SPEC §10). Factories take "today" (and other
// context) as parameters because some checks depend on it.
import type { z } from "zod";
import type { ApplicationStatus } from "../db/schema.ts";
import type { Channel, JobType, ManualStatus, Sector } from "./fixed-lists.ts";
import { notImplemented } from "./not-implemented.ts";

export const EMAIL_DOMAIN_MESSAGE = "Use your University of Porto email (@up.pt or @fe.up.pt)";
export const DATE_SENT_FUTURE_MESSAGE = "Date sent cannot be in the future";

export type RegistrationInput = { name: string; email: string; password: string };

/** US01-1/2: name, email with domain exactly up.pt or fe.up.pt (any case), password ≥ 8. */
export function registrationSchema(): z.ZodType<RegistrationInput, unknown> {
  return notImplemented();
}

export type ApplicationInput = {
  company: string;
  roleTitle: string;
  sector: Sector;
  channel: Channel;
  jobType: JobType;
  dateSent: string;
};

/** US02-2/3/7, §10: required fields, trimmed 1–120 chars, fixed lists, date not in the future. */
export function applicationInputSchema(today: string): z.ZodType<ApplicationInput, unknown> {
  return notImplemented(today);
}

export type StatusChangeInput = { status: ManualStatus; changedOn: string };

export type StatusChangeContext = {
  currentStatus: ApplicationStatus;
  dateSent: string;
  lastChangeOn: string;
  today: string;
};

/** US04-2/3, R6: manual status different from the current one; date checks of R6. */
export function statusChangeInputSchema(ctx: StatusChangeContext): z.ZodType<StatusChangeInput, unknown> {
  return notImplemented(ctx);
}
