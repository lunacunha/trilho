// Accounts service (US01, US08-3).
import { eq } from "drizzle-orm";
import { db } from "../../db/client.ts";
import { user as userTable } from "../../db/schema.ts";
import { AccessDeniedError } from "./errors.ts";
import type { CurrentUser } from "./types.ts";

/**
 * Stores when the email was verified (decision 033, metric M6).
 * Called by Better Auth's afterEmailVerification callback, not by users.
 */
export async function recordEmailVerified(userId: string, at: Date): Promise<void> {
  await db.update(userTable).set({ emailVerifiedAt: at }).where(eq(userTable.id, userId));
}

/**
 * US08-3: deletes the current user's own account. One statement: the database cascades to
 * sessions, credential accounts, applications → status changes → reminders, and product
 * events (decision 027, docs/data-model.md "Delete behaviour"). Students only.
 */
export async function deleteAccount(user: CurrentUser): Promise<void> {
  if (user.role !== "student") throw new AccessDeniedError();
  await db.delete(userTable).where(eq(userTable.id, user.id));
}
