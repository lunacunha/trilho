// Accounts service (US01, US08-3).
import { eq } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { user as userTable } from "../../db/schema.ts";
import { notImplemented } from "../not-implemented.ts";
import type { CurrentUser } from "./types.ts";

/**
 * Stores when the email was verified (decision 033, metric M6).
 * Called by Better Auth's afterEmailVerification callback, not by users.
 */
export async function recordEmailVerified(userId: string, at: Date): Promise<void> {
  await db.update(userTable).set({ emailVerifiedAt: at }).where(eq(userTable.id, userId));
}

/** Deletes the user; applications, history, reminders and events go by cascade (decision 027). */
export async function deleteAccount(user: CurrentUser): Promise<void> {
  return notImplemented(user);
}
