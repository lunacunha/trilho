import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import * as s from "@/db/schema";
import { assertOnlySeedUsers } from "@/db/seed-guard";
import { createUser, resetDatabase } from "./helpers";

describe("Seed guard — never wipe real users", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("Seed guard: an empty database is allowed", async () => {
    await expect(assertOnlySeedUsers(db, ["demo@example.com"])).resolves.toBeUndefined();
  });

  it("Seed guard: a database with only seed accounts is allowed", async () => {
    const a = await createUser();
    const b = await createUser();
    await expect(assertOnlySeedUsers(db, [a.email, b.email.toUpperCase()])).resolves.toBeUndefined();
  });

  it("Seed guard: one account that is not a seed account → refuses, and nothing is deleted", async () => {
    const seedUser = await createUser();
    await createUser(); // a "real" user
    await expect(assertOnlySeedUsers(db, [seedUser.email])).rejects.toThrow(
      /Refusing to seed: the database has 1 account\(s\) that are not seed accounts/,
    );
    const users = await db.select({ id: s.user.id }).from(s.user);
    expect(users).toHaveLength(2);
  });
});
