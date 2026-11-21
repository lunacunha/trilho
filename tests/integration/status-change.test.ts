import { beforeEach, describe, expect, it } from "vitest";
import { changeStatus, deleteApplication, getApplication, updateApplication } from "@/lib/services/applications";
import {
  createCompany,
  createUser,
  getApplicationRow,
  getEvents,
  getReminders,
  getStatusChanges,
  insertApplication,
  insertEvent,
  insertReminder,
  resetDatabase,
  TODAY,
  type TestUser,
} from "./helpers";

describe("US04 — Update, edit or delete", () => {
  let ana: TestUser;
  let lumen: { id: string; name: string };

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser();
    lumen = await createCompany("Lumen Energy");
  });

  it("US04-1: Sent on 1 Oct → In process on 18 Oct; history in order with 'after N days'", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await changeStatus(ana, id, { status: "in_process", changedOn: "2026-10-18" }, TODAY);

    const detail = await getApplication(ana, id);
    expect(detail.currentStatus).toBe("in_process");
    expect(detail.history).toEqual([
      { status: "sent", changedOn: "2026-10-01", isAutomatic: false, daysAfterSent: 0 },
      { status: "in_process", changedOn: "2026-10-18", isAutomatic: false, daysAfterSent: 17 },
    ]);
  });

  it("US04-4: editing fields updates them and creates no status change", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await updateApplication(
      ana,
      id,
      {
        company: "Lumen Energy",
        roleTitle: "Senior Operations Trainee",
        sector: "Energy & Utilities",
        channel: "Referral",
        jobType: "Full-time",
        dateSent: "2026-10-02",
      },
      TODAY,
    );

    const detail = await getApplication(ana, id);
    expect(detail).toMatchObject({
      roleTitle: "Senior Operations Trainee",
      channel: "Referral",
      jobType: "Full-time",
      dateSent: "2026-10-02",
    });
    expect(await getStatusChanges(id)).toHaveLength(1);
  });

  it("US04-5: deleting removes the application, its history and reminders; its events keep no link", async () => {
    const app = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await insertReminder({ applicationId: app.id, statusChangeId: app.statusChangeIds[0] });
    await insertEvent({ userId: ana.id, name: "reminder_triggered", applicationId: app.id });

    await deleteApplication(ana, app.id);

    expect(await getApplicationRow(app.id)).toBeUndefined();
    expect(await getStatusChanges(app.id)).toHaveLength(0);
    expect(await getReminders(app.id)).toHaveLength(0);
    const events = await getEvents("reminder_triggered");
    expect(events).toHaveLength(1);
    expect(events[0].applicationId).toBeNull();
  });

  it("US04-8: an application in No response can move to Interview (late reply)", async () => {
    const { id } = await insertApplication({
      user: ana,
      company: lumen,
      dateSent: "2026-08-01",
      then: [["no_response", "2026-09-30", true]],
    });
    await changeStatus(ana, id, { status: "interview", changedOn: TODAY }, TODAY);

    const detail = await getApplication(ana, id);
    expect(detail.currentStatus).toBe("interview");
    expect(detail.history.map((h) => h.status)).toEqual(["sent", "no_response", "interview"]);
  });
});
