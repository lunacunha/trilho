import { beforeEach, describe, expect, it } from "vitest";
import { changeStatus, getApplication, updateApplication } from "@/lib/services/applications";
import { ValidationError } from "@/lib/services/errors";
import type { ManualStatus } from "@/lib/fixed-lists";
import type { ApplicationInput } from "@/lib/validation";
import {
  createCompany,
  createUser,
  getApplicationRow,
  getStatusChanges,
  insertApplication,
  resetDatabase,
  TODAY,
  type TestUser,
} from "./helpers";

/** Expects a ValidationError on `field`, and that nothing was written. */
async function expectRejected(
  promise: Promise<unknown>,
  field: string,
  appId: string,
  before: { status: string; changes: number },
) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ValidationError);
  expect((error as ValidationError).field).toBe(field);
  expect((await getApplicationRow(appId)).currentStatus).toBe(before.status);
  expect(await getStatusChanges(appId)).toHaveLength(before.changes);
}

describe("R6 — the service enforces status transitions itself", () => {
  let ana: TestUser;
  let lumen: { id: string; name: string };

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser();
    lumen = await createCompany("Lumen Energy");
  });

  it("R6: Sent → Sent is rejected (not a real change)", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await expectRejected(changeStatus(ana, id, { status: "sent", changedOn: TODAY }, TODAY), "status", id, {
      status: "sent",
      changes: 1,
    });
  });

  it("R6: a future date is rejected (US04-3)", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await expectRejected(
      changeStatus(ana, id, { status: "in_process", changedOn: "2026-11-16" }, TODAY),
      "changedOn",
      id,
      { status: "sent", changes: 1 },
    );
  });

  it("R6: a date before the date sent is rejected (US04-3)", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await expectRejected(
      changeStatus(ana, id, { status: "in_process", changedOn: "2026-09-30" }, TODAY),
      "changedOn",
      id,
      { status: "sent", changes: 1 },
    );
  });

  it("R6: a date before the last status change is rejected", async () => {
    const { id } = await insertApplication({
      user: ana,
      company: lumen,
      dateSent: "2026-10-01",
      then: [["in_process", "2026-10-18"]],
    });
    await expectRejected(
      changeStatus(ana, id, { status: "interview", changedOn: "2026-10-10" }, TODAY),
      "changedOn",
      id,
      { status: "in_process", changes: 2 },
    );
  });

  it("R6: No response as a target is rejected", async () => {
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await expectRejected(
      changeStatus(ana, id, { status: "no_response" as ManualStatus, changedOn: TODAY }, TODAY),
      "status",
      id,
      { status: "sent", changes: 1 },
    );
  });
});

describe("US04-4 — editing the date sent moves the initial Sent change", () => {
  let ana: TestUser;
  let lumen: { id: string; name: string };
  const edit = (dateSent: string): ApplicationInput => ({
    company: "Lumen Energy",
    roleTitle: "Operations Trainee",
    sector: "Energy & Utilities",
    channel: "Company portal",
    jobType: "Trainee programme",
    dateSent,
  });

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser();
    lumen = await createCompany("Lumen Energy");
  });

  it("US04-4: date sent 1 Oct → 3 Oct moves the Sent entry; no status change is added", async () => {
    const { id } = await insertApplication({
      user: ana,
      company: lumen,
      dateSent: "2026-10-01",
      then: [["in_process", "2026-10-18"]],
    });
    await updateApplication(ana, id, edit("2026-10-03"), TODAY);

    const detail = await getApplication(ana, id);
    expect(detail.dateSent).toBe("2026-10-03");
    expect(detail.history).toEqual([
      { status: "sent", changedOn: "2026-10-03", isAutomatic: false, daysAfterSent: 0 },
      { status: "in_process", changedOn: "2026-10-18", isAutomatic: false, daysAfterSent: 15 },
    ]);
  });

  it("US04-4: date sent after the next status change is rejected and nothing changes", async () => {
    const { id } = await insertApplication({
      user: ana,
      company: lumen,
      dateSent: "2026-10-01",
      then: [["in_process", "2026-10-18"]],
    });
    const error = await updateApplication(ana, id, edit("2026-10-19"), TODAY).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).field).toBe("dateSent");
    expect((error as ValidationError).message).toBe("Date sent cannot be after the next status change (18 Oct 2026)");
    expect((await getApplicationRow(id)).dateSent).toBe("2026-10-01");
    expect((await getStatusChanges(id)).map((c) => c.changedOn)).toEqual(["2026-10-01", "2026-10-18"]);
  });

  it("US04-4: a new company name links to an existing company (R11)", async () => {
    const ferro = await createCompany("Ferro Industrial");
    const { id } = await insertApplication({ user: ana, company: lumen, dateSent: "2026-10-01" });
    await updateApplication(ana, id, { ...edit("2026-10-01"), company: "  ferro INDUSTRIAL " }, TODAY);
    expect((await getApplication(ana, id)).company).toEqual({ id: ferro.id, name: "Ferro Industrial" });
  });
});
