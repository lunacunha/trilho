// Consent service (US01-5/6, US08-1/2).
import { notImplemented } from "../not-implemented.ts";
import type { CurrentUser } from "./types.ts";

/** Stores the choice and its date. Students only. */
export async function setConsent(user: CurrentUser, consent: boolean): Promise<void> {
  return notImplemented(user, consent);
}
