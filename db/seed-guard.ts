// Seed guard: the seed wipes all Trilho data, so it must never run against a database
// that has real users. It only runs when every existing account is a seed account.
import { user } from "./schema.ts";
import type { Database } from "./client.ts";

/** Emails in `existing` that are not seed accounts (case-insensitive). */
export function findNonSeedEmails(existing: readonly string[], seedEmails: readonly string[]): string[] {
  const seed = new Set(seedEmails.map((e) => e.trim().toLowerCase()));
  return existing.filter((e) => !seed.has(e.trim().toLowerCase()));
}

/** Throws (before anything is written) when the database has any non-seed account. */
export async function assertOnlySeedUsers(db: Database, seedEmails: readonly string[]): Promise<void> {
  const rows = await db.select({ email: user.email }).from(user);
  const others = findNonSeedEmails(
    rows.map((r) => r.email),
    seedEmails,
  );
  if (others.length > 0) {
    // Count only: never print other people's emails.
    throw new Error(
      `Refusing to seed: the database has ${others.length} account(s) that are not seed accounts. ` +
        "The seed deletes all data and must only run on an empty or seed-only database.",
    );
  }
}
