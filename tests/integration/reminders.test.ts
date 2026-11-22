import { beforeEach, describe, expect, it } from "vitest";
import { changeStatus, getApplication, getPipeline } from "@/lib/services/applications";
import { NotFoundError } from "@/lib/services/errors";
import { dismissReminder, markFollowUpDone } from "@/lib/services/reminders";
import {
  createCompany,
  createUser,
  getEvents,
  getReminders,
  insertApplication,
  resetDatabase,
  type TestUser,
} from "./helpers";

// Company without a statistic → 14-day threshold. Sent on 1 Oct.
const SENT = "2026-10-01";
const DAY_19 = "2026-10-20";

describe("R12 / US05-5/6/7 — Reminder lifecycle", () => {
  let ana: TestUser;
  let appId: string;

  const cardReminder = async (today: string) => {
    const { columns } = await getPipeline(ana, today);
    return Object.values(columns).flat().find((c) => c.id === appId)?.reminder ?? null;
  };

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser();
    const ferro = await createCompany("Ferro Industrial");
    appId = (await insertApplication({ user: ana, company: ferro, dateSent: SENT })).id;
  });

  it("R12: loading the pipeline twice in a quiet period → one reminder, one reminder_triggered", async () => {
    expect(await cardReminder(DAY_19)).toEqual({ daysQuiet: 19, reason: "fallback_14_days" });
    expect(await cardReminder(DAY_19)).not.toBeNull();
    expect(await getReminders(appId)).toHaveLength(1);
    expect(await getEvents("reminder_triggered")).toHaveLength(1);
  });

  it("US05-5: Follow-up done hides the reminder, keeps the status and records the event", async () => {
    await cardReminder(DAY_19);
    await markFollowUpDone(ana, appId);

    expect(await cardReminder("2026-10-21")).toBeNull();
    expect((await getApplication(ana, appId)).currentStatus).toBe("sent");
    expect((await getReminders(appId))[0].outcome).toBe("followup_done");
    const events = await getEvents("reminder_followup_done");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ applicationId: appId, properties: { application_id: appId } });
  });

  it("US05-6: Dismiss hides the reminder and records the event", async () => {
    await cardReminder(DAY_19);
    await dismissReminder(ana, appId);

    expect(await cardReminder("2026-10-21")).toBeNull();
    expect((await getReminders(appId))[0].outcome).toBe("dismissed");
    expect(await getEvents("reminder_dismissed")).toHaveLength(1);
  });

  it("US05-7: after a status change, a new reminder appears once the new threshold passes", async () => {
    await cardReminder(DAY_19);
    await dismissReminder(ana, appId);
    await changeStatus(ana, appId, { status: "in_process", changedOn: "2026-10-25" }, "2026-10-25");

    expect(await cardReminder("2026-11-07")).toBeNull(); // 13 days into the new quiet period
    expect(await cardReminder("2026-11-08")).toEqual({ daysQuiet: 14, reason: "fallback_14_days" });
    expect(await getReminders(appId)).toHaveLength(2);
    expect(await getEvents("reminder_triggered")).toHaveLength(2);
  });

  it("US03-3: another student cannot react to A's reminder", async () => {
    await cardReminder(DAY_19);
    const bruno = await createUser();
    await expect(dismissReminder(bruno, appId)).rejects.toThrow(NotFoundError);
    await expect(markFollowUpDone(bruno, appId)).rejects.toThrow(NotFoundError);
    expect((await getReminders(appId))[0].outcome).toBeNull();
  });

  it("US05-6: no reminder showing (below threshold) → Follow-up done and Dismiss return Not found", async () => {
    await cardReminder("2026-10-14"); // 13 days quiet: no reminder
    await expect(markFollowUpDone(ana, appId)).rejects.toThrow(NotFoundError);
    await expect(dismissReminder(ana, appId)).rejects.toThrow(NotFoundError);
    expect(await getEvents("reminder_followup_done")).toHaveLength(0);
    expect(await getEvents("reminder_dismissed")).toHaveLength(0);
  });

  it("US05-6: reminder already dismissed → a second reaction returns Not found and records nothing", async () => {
    await cardReminder(DAY_19);
    await dismissReminder(ana, appId);
    await expect(markFollowUpDone(ana, appId)).rejects.toThrow(NotFoundError);
    await expect(dismissReminder(ana, appId)).rejects.toThrow(NotFoundError);
    expect((await getReminders(appId))[0].outcome).toBe("dismissed");
    expect(await getEvents("reminder_dismissed")).toHaveLength(1);
    expect(await getEvents("reminder_followup_done")).toHaveLength(0);
  });

  it("US05-6: the reminder of a past quiet period cannot be reacted to → Not found", async () => {
    await cardReminder(DAY_19); // shown, no reaction
    await changeStatus(ana, appId, { status: "in_process", changedOn: "2026-10-25" }, "2026-10-25");
    await expect(dismissReminder(ana, appId)).rejects.toThrow(NotFoundError);
    expect((await getReminders(appId))[0].outcome).toBeNull();
  });
});
