import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import * as s from "@/db/schema";
import { parseMetricsSql } from "@/scripts/metrics-sql";
import { createCompany, createUser, insertApplication, resetDatabase, type TestUser } from "./helpers";

// Runs the real queries from docs/product/metrics.sql. They use now(), so fixture
// timestamps are relative to the real clock (not the fixed TODAY of other tests).

const QUERIES = parseMetricsSql(
  readFileSync(new URL("../../docs/product/metrics.sql", import.meta.url), "utf8"),
);

type Row = Record<string, string | number | null>;
async function metric(id: string): Promise<Row[]> {
  const q = QUERIES.find((x) => x.id === id);
  if (!q) throw new Error(`No query ${id}`);
  const result = await db.execute(sql.raw(q.sql));
  return result.rows as Row[];
}
const num = (v: string | number | null | undefined) => (v === null || v === undefined ? null : Number(v));

const SECOND = 1000;
const DAY = 86_400_000;
const ago = (ms: number) => new Date(Date.now() - ms);
const plus = (t: Date, ms: number) => new Date(t.getTime() + ms);

async function event(
  user: { id: string },
  name: s.ProductEventName,
  properties: Record<string, unknown>,
  createdAt: Date,
): Promise<void> {
  await db.insert(s.productEvent).values({ userId: user.id, name, properties, createdAt });
}

/** Opens (and optionally saves) one form session `seconds` long. */
async function formSession(user: { id: string }, key: string, seconds: number | null): Promise<void> {
  const openedAt = ago(DAY);
  await event(user, "application_form_opened", { form_session_id: key }, openedAt);
  if (seconds !== null) {
    await event(user, "application_created", { form_session_id: key }, plus(openedAt, seconds * SECOND));
  }
}

async function registeredAt(user: { id: string }, createdAt: Date, verified = true): Promise<void> {
  await db
    .update(s.user)
    .set({ createdAt, emailVerified: verified, emailVerifiedAt: verified ? createdAt : null })
    .where(eq(s.user.id, user.id));
}

/** An application created at `createdAt` (its initial "sent" row too). Returns its id. */
async function appAt(user: { id: string }, company: { id: string }, createdAt: Date): Promise<string> {
  const { id } = await insertApplication({ user, company, dateSent: createdAt.toISOString().slice(0, 10) });
  await db.update(s.application).set({ createdAt }).where(eq(s.application.id, id));
  await db.update(s.statusChange).set({ createdAt }).where(eq(s.statusChange.applicationId, id));
  return id;
}

async function changeAt(applicationId: string, createdAt: Date, isAutomatic: boolean): Promise<void> {
  await db.insert(s.statusChange).values({
    applicationId,
    status: isAutomatic ? "no_response" : "in_process",
    changedOn: createdAt.toISOString().slice(0, 10),
    isAutomatic,
    createdAt,
  });
}

describe("Product metrics (docs/product/metrics.sql)", () => {
  let careers: TestUser;
  let lumen: { id: string; name: string };

  beforeEach(async () => {
    await resetDatabase();
    careers = await createUser({ role: "career_service" });
    lumen = await createCompany("Lumen Energy");
  });

  describe("M1 / M2 — form sessions", () => {
    it("M1: saves of 20 s, 40 s and 60 s → median 40.0 s over 3 sessions", async () => {
      const student = await createUser();
      await formSession(student, "a", 20);
      await formSession(student, "b", 40);
      await formSession(student, "c", 60);
      await formSession(student, "abandoned", null);
      await formSession(careers, "careers", 500); // never counted
      const [row] = await metric("M1");
      expect(num(row.saved_sessions)).toBe(3);
      expect(num(row.median_seconds)).toBe(40);
    });

    it("M1: events without a form session id are excluded", async () => {
      const student = await createUser();
      await formSession(student, "a", 30);
      await event(student, "application_form_opened", {}, ago(DAY));
      await event(student, "application_created", { form_session_id: null }, ago(DAY - 5 * SECOND));
      const [row] = await metric("M1");
      expect(num(row.saved_sessions)).toBe(1);
      expect(num(row.median_seconds)).toBe(30);
    });

    it("M2: 4 sessions opened, 3 saved → 75.0%", async () => {
      const student = await createUser();
      await formSession(student, "a", 20);
      await formSession(student, "b", 20);
      await formSession(student, "c", 20);
      await formSession(student, "d", null);
      await formSession(careers, "careers", null); // never counted
      const [row] = await metric("M2");
      expect([num(row.saved), num(row.opened), num(row.rate_pct)]).toEqual([3, 4, 75]);
    });

    it("M2: no form opened → rate is null, not a division error", async () => {
      const [row] = await metric("M2");
      expect([num(row.saved), num(row.opened), row.rate_pct]).toEqual([0, 0, null]);
    });
  });

  describe("M3 — consent rate", () => {
    it("M3: 3 share, 1 declines, 1 unanswered → 75.0% overall, and per registration week", async () => {
      const week1 = new Date("2026-11-02T10:00:00Z"); // Monday
      const week2 = new Date("2026-11-11T10:00:00Z"); // Wednesday of the next week
      for (const [consent, at] of [
        [true, week1],
        [true, week1],
        [false, week1],
        [true, week2],
        [null, week2],
      ] as const) {
        const u = await createUser({ consent });
        await registeredAt(u, at);
      }
      const rows = await metric("M3");
      const byWeek = Object.fromEntries(
        rows.map((r) => [r.registration_week, [num(r.shared), num(r.answered), num(r.rate_pct)]]),
      );
      expect(byWeek).toEqual({
        All: [3, 4, 75],
        "2026-11-02": [2, 3, 66.7],
        "2026-11-09": [1, 1, 100],
      });
    });
  });

  describe("M4 / M4b / M5 — reminders", () => {
    it("M4 / M4b: outcomes are matched to the latest reminder of the same application", async () => {
      const student = await createUser();
      const appA = await appAt(student, lumen, ago(60 * DAY));
      const appB = await appAt(student, lumen, ago(60 * DAY));
      // App A, quiet period 1: 14-day reminder, followed up
      await event(student, "reminder_triggered", { application_id: appA, reason: "fallback_14_days", threshold_days: 14 }, ago(40 * DAY));
      await event(student, "reminder_followup_done", { application_id: appA }, ago(39 * DAY));
      // App A, quiet period 2: company reminder, dismissed
      await event(student, "reminder_triggered", { application_id: appA, reason: "company_median", threshold_days: 17 }, ago(10 * DAY));
      await event(student, "reminder_dismissed", { application_id: appA }, ago(9 * DAY));
      // App B: company reminder, followed up
      await event(student, "reminder_triggered", { application_id: appB, reason: "company_median", threshold_days: 17 }, ago(20 * DAY));
      await event(student, "reminder_followup_done", { application_id: appB }, ago(19 * DAY));

      const [m4] = await metric("M4");
      expect([num(m4.followup_done), num(m4.dismissed), num(m4.rate_pct)]).toEqual([2, 1, 66.7]);

      const m4b = Object.fromEntries(
        (await metric("M4b")).map((r) => [r.reason, [num(r.followup_done), num(r.dismissed), num(r.rate_pct)]]),
      );
      expect(m4b).toEqual({ company_median: [1, 1, 50], fallback_14_days: [1, 0, 100] });
    });

    it("M5: 4 reminders triggered, 1 followed up → 25.0%", async () => {
      const student = await createUser();
      const app = await appAt(student, lumen, ago(90 * DAY));
      for (const d of [80, 60, 40, 20]) {
        await event(student, "reminder_triggered", { application_id: app, reason: "fallback_14_days", threshold_days: 14 }, ago(d * DAY));
      }
      await event(student, "reminder_followup_done", { application_id: app }, ago(19 * DAY));
      await event(careers, "reminder_triggered", { application_id: app, reason: "fallback_14_days", threshold_days: 14 }, ago(DAY));
      const [row] = await metric("M5");
      expect([num(row.followup_done), num(row.triggered), num(row.rate_pct)]).toEqual([1, 4, 25]);
    });
  });

  describe("M6 — activation", () => {
    it("M6: ≥ 3 applications before registration + 7 days; only verified students registered ≥ 7 days ago", async () => {
      const reg10 = ago(10 * DAY);

      const activated = await createUser();
      await registeredAt(activated, reg10);
      for (const d of [1, 2, 6]) await appAt(activated, lumen, plus(reg10, d * DAY));

      // Third application exactly at registration + 7 days → outside the window
      const late = await createUser();
      await registeredAt(late, reg10);
      for (const d of [1, 2, 7]) await appAt(late, lumen, plus(reg10, d * DAY));

      // Registered 6 days ago → has not had 7 days yet, not in the denominator
      const recent = await createUser();
      const reg6 = ago(6 * DAY);
      await registeredAt(recent, reg6);
      for (const h of [1, 2, 3]) await appAt(recent, lumen, plus(reg6, h * 3_600_000));

      // Unverified → excluded
      const unverified = await createUser();
      await registeredAt(unverified, reg10, false);

      await registeredAt(careers, reg10); // never counted

      const [row] = await metric("M6");
      expect([num(row.activated), num(row.eligible), num(row.rate_pct)]).toEqual([1, 2, 50]);
    });
  });

  describe("M7 — week-4 retention", () => {
    /** A student registered `daysAgo` days ago with 3 applications on day 1. */
    async function activatedStudent(daysAgo: number): Promise<{ user: TestUser; reg: Date; appId: string }> {
      const user = await createUser();
      const reg = ago(daysAgo * DAY);
      await registeredAt(user, reg);
      const appId = await appAt(user, lumen, plus(reg, DAY));
      await appAt(user, lumen, plus(reg, DAY));
      await appAt(user, lumen, plus(reg, DAY));
      return { user, reg, appId };
    }

    it("M7: activity at registration + 21 days counts; + 28 days does not; automatic changes do not", async () => {
      const day22 = await activatedStudent(40);
      await appAt(day22.user, lumen, plus(day22.reg, 21 * DAY));

      const day29 = await activatedStudent(40);
      await appAt(day29.user, lumen, plus(day29.reg, 28 * DAY));

      const manual = await activatedStudent(40);
      await changeAt(manual.appId, plus(manual.reg, 25 * DAY), false);

      const automatic = await activatedStudent(40);
      await changeAt(automatic.appId, plus(automatic.reg, 25 * DAY), true);

      // Not activated → not in the denominator, even with activity in days 22–28
      const notActivated = await createUser();
      const reg = ago(40 * DAY);
      await registeredAt(notActivated, reg);
      await appAt(notActivated, lumen, plus(reg, 22 * DAY));

      // Registered 20 days ago → has not had 28 days yet
      await activatedStudent(20);

      const [row] = await metric("M7");
      expect([num(row.retained), num(row.eligible), num(row.rate_pct)]).toEqual([2, 4, 50]);
    });
  });
});
