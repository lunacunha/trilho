// Zod schemas for every server-side input (SPEC §10). Factories take "today" (and other
// context) as parameters because some checks depend on it.
import { z } from "zod";
import type { ApplicationStatus } from "../db/schema.ts";
import { CHANNELS, JOB_TYPES, SECTORS, type Channel, type JobType, type ManualStatus, type Sector } from "./fixed-lists.ts";
import { notImplemented } from "./not-implemented.ts";
import { isAllowedEmailDomain } from "./rules/email-domain.ts";

export const EMAIL_DOMAIN_MESSAGE = "Use your University of Porto email (@up.pt or @fe.up.pt)";
export const DATE_SENT_FUTURE_MESSAGE = "Date sent cannot be in the future";

export type RegistrationInput = { name: string; email: string; password: string };

/** US01-1/2: name, email with domain exactly up.pt or fe.up.pt (any case), password ≥ 8. */
export function registrationSchema(): z.ZodType<RegistrationInput, unknown> {
  return z.object({
    name: z.string().trim().min(1, "Enter your name"),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email")
      .pipe(z.email("Enter a valid email").refine(isAllowedEmailDomain, EMAIL_DOMAIN_MESSAGE)),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(128, "Use at most 128 characters"),
  });
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
  const text = (emptyMessage: string) =>
    z
      .string({ error: emptyMessage })
      .trim()
      .min(1, emptyMessage)
      .max(120, "Use at most 120 characters");
  return z.object({
    company: text("Enter the company"),
    roleTitle: text("Enter the role"),
    sector: z.enum(SECTORS, { error: "Choose a sector" }),
    channel: z.enum(CHANNELS, { error: "Choose a channel" }),
    jobType: z.enum(JOB_TYPES, { error: "Choose a job type" }),
    dateSent: z
      .string({ error: "Enter the date sent" })
      .min(1, "Enter the date sent")
      .pipe(z.iso.date({ error: "Enter a valid date" }))
      .refine((date) => date <= today, DATE_SENT_FUTURE_MESSAGE),
  });
}

/** SPEC §9: the id generated when the new application form opens. */
export const formSessionIdSchema = z.uuid();

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
