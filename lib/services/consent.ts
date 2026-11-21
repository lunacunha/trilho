// Consent service (US01-5/6, US08-1/2).
import { eq } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { user as userTable } from "../../db/schema.ts";
import { AccessDeniedError } from "./errors.ts";
import type { CurrentUser } from "./types.ts";

/** Stores the choice and its date. Students only. */
export async function setConsent(user: CurrentUser, consent: boolean): Promise<void> {
  if (user.role !== "student") throw new AccessDeniedError();
  await db
    .update(userTable)
    .set({ consent, consentUpdatedAt: new Date() })
    .where(eq(userTable.id, user.id));
}
