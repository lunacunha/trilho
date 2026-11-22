import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import * as s from "@/db/schema";
import { deleteAccount } from "@/lib/services/accounts";
import { AccessDeniedError } from "@/lib/services/errors";
import {
  createCompany,
  createUser,
  daysAgo,
  getApplicationRow,
  getEvents,
  getReminders,
  getStatusChanges,
  insertApplication,
  insertEvent,
  insertReminder,
  resetDatabase,
  type InsertedApplication,
  type TestUser,
} from "./helpers";

describe("US08-3 — Delete account", () => {
  let ana: TestUser;
  let bruno: TestUser;
  let anaApp: InsertedApplication;
  let brunoApp: InsertedApplication;

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser();
    bruno = await createUser();
    const lumen = await createCompany("Lumen Energy");
    anaApp = await insertApplication({
      user: ana,
      company: lumen,
      dateSent: daysAgo(40),
      then: [["in_process", daysAgo(20)]],
    });
    brunoApp = await insertApplication({ user: bruno, company: lumen, dateSent: daysAgo(30) });
    // What logging in relies on: a credential account and a live session
    await db.insert(s.account).values({
      id: randomUUID(),
      accountId: ana.id,
      providerId: "credential",
      userId: ana.id,
      password: "not-a-real-hash",
    });
    await db.insert(s.session).values({
      id: randomUUID(),
      token: randomUUID(),
      userId: ana.id,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    for (const [user, app] of [
      [ana, anaApp],
      [bruno, brunoApp],
    ] as const) {
      await insertReminder({ applicationId: app.id, statusChangeId: app.statusChangeIds[0], outcome: "dismissed" });
      await insertEvent({ userId: user.id, name: "application_form_opened", properties: { form_session_id: "x" } });
      await insertEvent({ userId: user.id, name: "reminder_dismissed", applicationId: app.id });
    }
  });

  it("US08-3: deletes the account, applications, status history, reminders and product events", async () => {
    await deleteAccount(ana);

    expect(await db.select().from(s.user).where(eq(s.user.id, ana.id))).toHaveLength(0);
    expect(await getApplicationRow(anaApp.id)).toBeUndefined();
    expect(await getStatusChanges(anaApp.id)).toHaveLength(0);
    expect(await getReminders(anaApp.id)).toHaveLength(0);
    expect((await getEvents()).filter((e) => e.userId === ana.id)).toHaveLength(0);
  });

  it("US08-3: a career_service user cannot use the student account deletion", async () => {
    const careers = await createUser({ role: "career_service" });
    await expect(deleteAccount(careers)).rejects.toThrow(AccessDeniedError);
    expect(await db.select().from(s.user).where(eq(s.user.id, careers.id))).toHaveLength(1);
  });

  it("US08-4: the same email can register again as a new, empty account", async () => {
    await deleteAccount(ana);

    // Login fails: no user and no credential account remain for the deleted id
    expect(await db.select().from(s.account).where(eq(s.account.userId, ana.id))).toHaveLength(0);
    expect(await db.select().from(s.session).where(eq(s.session.userId, ana.id))).toHaveLength(0);

    const newId = randomUUID();
    await db.insert(s.user).values({ id: newId, name: "Ana Again", email: ana.email, emailVerified: true });
    expect(await db.select().from(s.application).where(eq(s.application.userId, newId))).toHaveLength(0);
    expect((await getEvents()).filter((e) => e.userId === newId)).toHaveLength(0);
  });

  it("US08-3: other students' data is untouched", async () => {
    await deleteAccount(ana);

    expect(await getApplicationRow(brunoApp.id)).toBeDefined();
    expect(await getStatusChanges(brunoApp.id)).toHaveLength(1);
    expect(await getReminders(brunoApp.id)).toHaveLength(1);
    expect((await getEvents()).filter((e) => e.userId === bruno.id)).toHaveLength(2);
  });
});
