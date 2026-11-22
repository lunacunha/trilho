import { beforeEach, describe, expect, it } from "vitest";
import { getPipeline } from "@/lib/services/applications";
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
  insertRepliedApplications,
  resetDatabase,
  TODAY,
  type TestUser,
} from "./helpers";

describe("US03 / US04-6/7 / US05 — Pipeline", () => {
  let ana: TestUser;
  let other: TestUser;
  let lumen: { id: string; name: string };
  let ferro: { id: string; name: string };

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser();
    other = await createUser();
    lumen = await createCompany("Lumen Energy"); // gets a statistic, median 17
    ferro = await createCompany("Ferro Industrial"); // no statistic
    await insertRepliedApplications(other, lumen, [10, 12, 17, 20, 30]);
  });

  it("US04-6: Sent with last change 1 Sep, loaded 15 Nov → No response dated 31 Oct (R5)", async () => {
    const { id } = await insertApplication({ user: ana, company: ferro, dateSent: "2026-09-01" });
    const pipeline = await getPipeline(ana, TODAY);

    expect(pipeline.columns.closed.map((c) => [c.id, c.status])).toEqual([[id, "no_response"]]);
    const changes = await getStatusChanges(id);
    expect(changes.at(-1)).toMatchObject({ status: "no_response", changedOn: "2026-10-31", isAutomatic: true });
    expect((await getApplicationRow(id)).currentStatus).toBe("no_response");
  });

  it("US04-6: R5 is applied once — loading twice records one automatic change", async () => {
    const { id } = await insertApplication({ user: ana, company: ferro, dateSent: "2026-09-01" });
    await getPipeline(ana, TODAY);
    await getPipeline(ana, TODAY);
    expect((await getStatusChanges(id)).filter((c) => c.isAutomatic)).toHaveLength(1);
  });

  it("US04-7: Interview since 1 Sep stays in Interview", async () => {
    const { id } = await insertApplication({
      user: ana,
      company: ferro,
      dateSent: "2026-08-20",
      then: [["interview", "2026-09-01"]],
    });
    const pipeline = await getPipeline(ana, TODAY);
    expect(pipeline.columns.interview.map((c) => c.id)).toEqual([id]);
    expect(await getStatusChanges(id)).toHaveLength(2);
  });

  it("US03-1: columns Sent (3), In process (2), Interview (1), Offer (1), Closed (2)", async () => {
    const recent = daysAgo(5);
    for (let i = 0; i < 3; i++) await insertApplication({ user: ana, company: ferro, dateSent: recent });
    for (let i = 0; i < 2; i++) {
      await insertApplication({ user: ana, company: ferro, dateSent: recent, then: [["in_process", daysAgo(2)]] });
    }
    await insertApplication({ user: ana, company: ferro, dateSent: recent, then: [["interview", daysAgo(2)]] });
    await insertApplication({ user: ana, company: ferro, dateSent: recent, then: [["offer", daysAgo(2)]] });
    await insertApplication({ user: ana, company: ferro, dateSent: recent, then: [["rejected", daysAgo(2)]] });
    await insertApplication({
      user: ana,
      company: ferro,
      dateSent: daysAgo(70),
      then: [["no_response", daysAgo(10), true]],
    });

    const { columns } = await getPipeline(ana, TODAY);
    expect({
      sent: columns.sent.length,
      in_process: columns.in_process.length,
      interview: columns.interview.length,
      offer: columns.offer.length,
      closed: columns.closed.length,
    }).toEqual({ sent: 3, in_process: 2, interview: 1, offer: 1, closed: 2 });
  });

  it("SPEC §3: a career_service user cannot load a pipeline", async () => {
    const careers = await createUser({ role: "career_service" });
    await expect(getPipeline(careers, TODAY)).rejects.toThrow(AccessDeniedError);
  });

  it("US04-6: In process with last change 60 days ago converts; Sent 59 days ago does not (R5)", async () => {
    const inProcess = await insertApplication({
      user: ana,
      company: ferro,
      dateSent: daysAgo(80),
      then: [["in_process", daysAgo(60)]],
    });
    const recent = await insertApplication({ user: ana, company: ferro, dateSent: daysAgo(59) });
    const { columns } = await getPipeline(ana, TODAY);
    expect(columns.closed.map((c) => c.id)).toEqual([inProcess.id]);
    expect(columns.sent.map((c) => c.id)).toEqual([recent.id]);
    expect((await getStatusChanges(inProcess.id)).at(-1)).toMatchObject({
      status: "no_response",
      changedOn: TODAY,
      isAutomatic: true,
    });
  });

  it("US03-4: a student with no applications gets five empty columns", async () => {
    const { columns } = await getPipeline(ana, TODAY);
    expect(columns).toEqual({ sent: [], in_process: [], interview: [], offer: [], closed: [] });
  });

  it("US03-2: each card has company, role and days since sent (R10); Closed cards say Rejected or No response", async () => {
    const sent = await insertApplication({ user: ana, company: lumen, dateSent: "2026-11-01", roleTitle: "Data Intern" });
    const rejected = await insertApplication({
      user: ana,
      company: ferro,
      dateSent: "2026-10-01",
      then: [["rejected", "2026-10-10"]],
    });
    const noResponse = await insertApplication({
      user: ana,
      company: ferro,
      dateSent: "2026-08-01",
      then: [["no_response", "2026-09-30", true]],
    });

    const { columns } = await getPipeline(ana, TODAY);
    expect(columns.sent.find((c) => c.id === sent.id)).toMatchObject({
      companyName: "Lumen Energy",
      roleTitle: "Data Intern",
      daysSinceSent: 14,
      status: "sent",
    });
    const closed = Object.fromEntries(columns.closed.map((c) => [c.id, c.status]));
    expect(closed).toEqual({ [rejected.id]: "rejected", [noResponse.id]: "no_response" });
  });

  it("US05-1: company median 17 days, Sent 17 days ago → reminder '17 days', reason company_median", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: daysAgo(17) });
    const { columns } = await getPipeline(ana, TODAY);

    expect(columns.sent.find((c) => c.id === id)?.reminder).toEqual({ daysQuiet: 17, reason: "company_median" });
    expect(await getReminders(id)).toHaveLength(1);
    const events = await getEvents("reminder_triggered");
    expect(events).toHaveLength(1);
    expect(events[0].properties).toEqual({ application_id: id, reason: "company_median", threshold_days: 17 });
  });

  it("US05-2: same company, last change 16 days ago → no reminder", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: daysAgo(16) });
    const { columns } = await getPipeline(ana, TODAY);
    expect(columns.sent.find((c) => c.id === id)?.reminder).toBeNull();
    expect(await getEvents("reminder_triggered")).toHaveLength(0);
  });

  it("US05-3: company without a statistic → reminder at 14 days, not at 13", async () => {
    const at14 = await insertApplication({ user: ana, company: ferro, dateSent: daysAgo(14) });
    const at13 = await insertApplication({ user: ana, company: ferro, dateSent: daysAgo(13) });
    const { columns } = await getPipeline(ana, TODAY);
    expect(columns.sent.find((c) => c.id === at14.id)?.reminder).toEqual({ daysQuiet: 14, reason: "fallback_14_days" });
    expect(columns.sent.find((c) => c.id === at13.id)?.reminder).toBeNull();
  });

  it("US05-4: Interview with no change for 30 days → no reminder", async () => {
    const { id } = await insertApplication({
      user: ana,
      company: ferro,
      dateSent: daysAgo(40),
      then: [["interview", daysAgo(30)]],
    });
    const { columns } = await getPipeline(ana, TODAY);
    expect(columns.interview.find((c) => c.id === id)?.reminder).toBeNull();
  });
});
