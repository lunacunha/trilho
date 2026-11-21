import { beforeEach, describe, expect, it } from "vitest";
import { createApplication } from "@/lib/services/applications";
import { suggestCompanies } from "@/lib/services/companies";
import { AccessDeniedError } from "@/lib/services/errors";
import type { ApplicationInput } from "@/lib/validation";
import {
  countCompanies,
  createCompany,
  createUser,
  getApplicationRow,
  getEvents,
  getStatusChanges,
  resetDatabase,
  TODAY,
  type TestUser,
} from "./helpers";

const input = (patch: Partial<ApplicationInput> = {}): ApplicationInput => ({
  company: "Lumen Energy",
  roleTitle: "Operations Trainee",
  sector: "Energy & Utilities",
  channel: "Career Fair",
  jobType: "Trainee programme",
  dateSent: TODAY,
  ...patch,
});

describe("US02 — Log an application", () => {
  let ana: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser();
  });

  it("US02-1: saves with status Sent and an initial status change (Sent, date sent)", async () => {
    await createCompany("Lumen Energy");
    const { id } = await createApplication(ana, input(), { today: TODAY, formSessionId: "form-1" });

    const row = await getApplicationRow(id);
    expect(row).toMatchObject({ userId: ana.id, roleTitle: "Operations Trainee", dateSent: TODAY, currentStatus: "sent" });
    const changes = await getStatusChanges(id);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ status: "sent", changedOn: TODAY, isAutomatic: false });
  });

  it("US02-1: records application_created with application_id and form_session_id (SPEC §9)", async () => {
    const { id } = await createApplication(ana, input(), { today: TODAY, formSessionId: "form-1" });
    const events = await getEvents("application_created");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      userId: ana.id,
      applicationId: id,
      properties: { application_id: id, form_session_id: "form-1" },
    });
  });

  it("US02-6: ' lumen  ENERGY ' links to the existing 'Lumen Energy'; no new company", async () => {
    const lumen = await createCompany("Lumen Energy");
    const { id } = await createApplication(ana, input({ company: " lumen  ENERGY " }), { today: TODAY });
    expect((await getApplicationRow(id)).companyId).toBe(lumen.id);
    expect(await countCompanies()).toBe(1);
  });

  it("US02-5: a new company is created and linked, with the trimmed name typed", async () => {
    const { id } = await createApplication(ana, input({ company: " Douro Software " }), { today: TODAY });
    const suggestions = await suggestCompanies(ana, "douro");
    expect(suggestions).toEqual([{ id: (await getApplicationRow(id)).companyId, name: "Douro Software" }]);
    expect(await countCompanies()).toBe(1);
  });

  it("US02-4: 'lu' suggests 'Lumen Energy' and 'Lusíadas Saúde' (case-insensitive contains)", async () => {
    await createCompany("Lumen Energy");
    await createCompany("Lusíadas Saúde");
    await createCompany("Douro Software");
    const names = (await suggestCompanies(ana, "lu")).map((c) => c.name).sort();
    expect(names).toEqual(["Lumen Energy", "Lusíadas Saúde"]);
  });

  it("US02-4: at most 5 suggestions", async () => {
    for (const name of ["Lumen", "Lusíadas", "Blue Lumber", "Lux Media", "Value Lu", "Lunar", "Plural"]) {
      await createCompany(name);
    }
    expect(await suggestCompanies(ana, "LU")).toHaveLength(5);
  });

  it("SPEC §3: a career_service user cannot create applications", async () => {
    const careers = await createUser({ role: "career_service" });
    await expect(createApplication(careers, input(), { today: TODAY })).rejects.toThrow(AccessDeniedError);
  });
});
