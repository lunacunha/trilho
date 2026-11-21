import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import * as s from "@/db/schema";
import { deleteAccount } from "@/lib/services/accounts";
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

  it("US08-3: other students' data is untouched", async () => {
    await deleteAccount(ana);

    expect(await getApplicationRow(brunoApp.id)).toBeDefined();
    expect(await getStatusChanges(brunoApp.id)).toHaveLength(1);
    expect(await getReminders(brunoApp.id)).toHaveLength(1);
    expect((await getEvents()).filter((e) => e.userId === bruno.id)).toHaveLength(2);
  });
});
