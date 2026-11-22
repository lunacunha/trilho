// Decision 041: HTTP driver for queries, a per-transaction WebSocket Pool for transactions.
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, withTransaction } from "@/db/client";
import * as s from "@/db/schema";
import { resetDatabase } from "./helpers";

async function companyExists(id: string): Promise<boolean> {
  const rows = await db.select({ id: s.company.id }).from(s.company).where(eq(s.company.id, id));
  return rows.length === 1;
}

function fictionalCompany() {
  const name = `Fictional Co ${randomUUID().slice(0, 8)}`;
  return { name, normalizedName: name.toLowerCase() };
}

describe("Database client — withTransaction", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("041: commits and returns the callback's value; db (HTTP) reads the committed row", async () => {
    const id = await withTransaction(async (tx) => {
      const [row] = await tx.insert(s.company).values(fictionalCompany()).returning({ id: s.company.id });
      return row.id;
    });
    expect(await companyExists(id)).toBe(true);
  });

  it("041: rolls back everything when the callback throws", async () => {
    const id = randomUUID();
    await expect(
      withTransaction(async (tx) => {
        await tx.insert(s.company).values({ id, ...fictionalCompany() });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    expect(await companyExists(id)).toBe(false);
  });

  it("041: consecutive transactions each get a fresh pool and work", async () => {
    for (let i = 0; i < 3; i++) {
      const id = await withTransaction(async (tx) => {
        const [row] = await tx.insert(s.company).values(fictionalCompany()).returning({ id: s.company.id });
        return row.id;
      });
      expect(await companyExists(id)).toBe(true);
    }
  });
});
