// Shared input types for the pure business rules. Dates are "YYYY-MM-DD" strings.
import type { ApplicationStatus, UserRole } from "../../db/schema.ts";

export type { ApplicationStatus, UserRole };
export type ReminderReason = "company_median" | "fallback_14_days";
export type ReminderOutcome = "followup_done" | "dismissed";

/** One dated status change of an application. */
export type StatusChangeInput = { status: ApplicationStatus; changedOn: string };

/** An application as seen by the statistics rules (R1, R3, R7). */
export type StatApplication = {
  dateSent: string;
  /** Consent of the application's owner at calculation time. NULL = not answered. */
  consent: boolean | null;
  /** Full status history, including the initial "sent". */
  changes: StatusChangeInput[];
};
