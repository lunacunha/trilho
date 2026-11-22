import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import * as s from "@/db/schema";
import { getConsent, setConsent } from "@/lib/services/consent";
import { AccessDeniedError } from "@/lib/services/errors";
import { createUser, resetDatabase } from "./helpers";

async function consentOf(userId: string) {
  const [row] = await db
    .select({ consent: s.user.consent, consentUpdatedAt: s.user.consentUpdatedAt })
    .from(s.user)
    .where(eq(s.user.id, userId));
  return row;
}

describe("US01-5 / US01-6 — Consent choice", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("US01-5: 'Don't share' stores consent false with the date", async () => {
    const ana = await createUser({ consent: null });
    const before = Date.now();
    await setConsent(ana, false);
    const row = await consentOf(ana.id);
    expect(row.consent).toBe(false);
    expect(row.consentUpdatedAt?.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it("US01-6: 'Share anonymously' stores consent true with the date", async () => {
    const ana = await createUser({ consent: null });
    await setConsent(ana, true);
    const row = await consentOf(ana.id);
    expect(row.consent).toBe(true);
    expect(row.consentUpdatedAt).not.toBeNull();
  });

  it("SPEC §3: a career_service user cannot answer consent", async () => {
    const careers = await createUser({ role: "career_service" });
    await expect(setConsent(careers, true)).rejects.toThrow(AccessDeniedError);
  });
});

describe("US08-1 / US08-2 — Privacy page reads the current choice", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("US08-1: after withdrawing, getConsent returns false with the date of the change", async () => {
    const ana = await createUser({ consent: true });
    const before = Date.now();
    await setConsent(ana, false);
    const result = await getConsent(ana);
    expect(result.consent).toBe(false);
    expect(result.updatedAt?.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });

  it("US08-2: after giving consent later, getConsent returns true", async () => {
    const ana = await createUser({ consent: false });
    await setConsent(ana, true);
    expect((await getConsent(ana)).consent).toBe(true);
  });

  it("SPEC §3: a career_service user has no consent to read", async () => {
    const careers = await createUser({ role: "career_service" });
    await expect(getConsent(careers)).rejects.toThrow(AccessDeniedError);
  });
});
