// Consent service (US01-5/6, US08-1/2).
import { eq } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { user as userTable } from "../../db/schema.ts";
import { AccessDeniedError } from "./errors.ts";
import type { CurrentUser } from "./types.ts";

export type ConsentChoice = { consent: boolean | null; updatedAt: Date | null };

/** The current choice and when it was made (privacy page, US08-1/2). Students only. */
export async function getConsent(user: CurrentUser): Promise<ConsentChoice> {
  if (user.role !== "student") throw new AccessDeniedError();
  const [row] = await db
    .select({ consent: userTable.consent, updatedAt: userTable.consentUpdatedAt })
    .from(userTable)
    .where(eq(userTable.id, user.id));
  return row ?? { consent: null, updatedAt: null };
}

/** Stores the choice and its date. Students only. */
export async function setConsent(user: CurrentUser, consent: boolean): Promise<void> {
  if (user.role !== "student") throw new AccessDeniedError();
  await db
    .update(userTable)
    .set({ consent, consentUpdatedAt: new Date() })
    .where(eq(userTable.id, user.id));
}
