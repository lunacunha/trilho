import { beforeEach, describe, expect, it } from "vitest";
import { getCompanyPage } from "@/lib/services/companies";
import { setConsent } from "@/lib/services/consent";
import { getDashboard } from "@/lib/services/dashboard";
import { AccessDeniedError, NotFoundError } from "@/lib/services/errors";
import {
  createCompany,
  createUser,
  daysAgo,
  insertApplication,
  insertRepliedApplications,
  resetDatabase,
  TODAY,
  type TestUser,
} from "./helpers";

describe("US06 / US07-3 / US08-1 — Only consenting students count", () => {
  let viewer: TestUser;
  let consenting: TestUser;
  let declined: TestUser;
  let careers: TestUser;
  let lumen: { id: string; name: string };

  beforeEach(async () => {
    await resetDatabase();
    viewer = await createUser({ consent: false });
    consenting = await createUser({ consent: true });
    declined = await createUser({ consent: false });
    careers = await createUser({ role: "career_service" });
    lumen = await createCompany("Lumen Energy");
  });

  it("US06-1: ≥ 5 replied applications from consenting students → range and base", async () => {
    await insertRepliedApplications(consenting, lumen, [10, 12, 17, 20, 30]);
    const page = await getCompanyPage(viewer, lumen.id);
    expect(page.statistic).toEqual({ label: "2–3 weeks", basedOn: 5 });
  });

  it("US06-2: median 14 days → 'about 2 weeks'", async () => {
    await insertRepliedApplications(consenting, lumen, [7, 10, 14, 20, 21]);
    expect((await getCompanyPage(viewer, lumen.id)).statistic?.label).toBe("about 2 weeks");
  });

  it("US06-3: 4 replied applications → Not enough data yet (no statistic)", async () => {
    await insertRepliedApplications(consenting, lumen, [10, 12, 17, 20]);
    expect((await getCompanyPage(viewer, lumen.id)).statistic).toBeNull();
  });

  it("US06-4: 6 replied, 2 from non-consenting students → 4 count → no statistic", async () => {
    await insertRepliedApplications(consenting, lumen, [10, 12, 17, 20]);
    await insertRepliedApplications(declined, lumen, [15, 16]);
    expect((await getCompanyPage(viewer, lumen.id)).statistic).toBeNull();
  });

  it("US06-5: the company page returns only name and statistic — no rates, rankings or student data", async () => {
    await insertRepliedApplications(consenting, lumen, [10, 12, 17, 20, 30]);
    const page = await getCompanyPage(viewer, lumen.id);
    expect(Object.keys(page).sort()).toEqual(["id", "name", "statistic"]);
    expect(Object.keys(page.statistic ?? {}).sort()).toEqual(["basedOn", "label"]);
    const json = JSON.stringify(page);
    expect(json).not.toContain(consenting.id);
    expect(json).not.toContain(consenting.email);
  });

  it("US07-3: dashboard numbers exclude non-consenting students", async () => {
    // Consenting: 5 applications to Lumen, 2 replied (10 and 20 days)
    await insertRepliedApplications(consenting, lumen, [10, 20]);
    for (let i = 0; i < 3; i++) await insertApplication({ user: consenting, company: lumen, dateSent: daysAgo(3) });
    // Consenting: 3 replied applications to Vela (15 days) → hidden (R8), but reach the
    // 5 replies the median needs (R3 minimum): median of [10, 15, 15, 15, 20] = 15
    const vela = await createCompany("Vela Logistics");
    await insertRepliedApplications(consenting, vela, [15, 15, 15]);
    // Non-consenting: 5 applications, all replied after 2 days
    await insertRepliedApplications(declined, lumen, [2, 2, 2, 2, 2]);
    await insertApplication({ user: declined, company: lumen, dateSent: daysAgo(1) });

    const dashboard = await getDashboard(careers, TODAY);
    expect(dashboard.companies).toEqual([{ name: "Lumen Energy", applications: 5, replyRate: 0.4 }]);
    expect(dashboard.medianDaysToFirstReply).toBe(15);
    expect(dashboard.activeStudents).toBe(1);
  });

  it("US08-1: after withdrawing consent, the statistic drops immediately (not cached)", async () => {
    await insertRepliedApplications(consenting, lumen, [10, 12, 17, 20, 30]);
    expect((await getCompanyPage(viewer, lumen.id)).statistic).not.toBeNull();
    await setConsent(consenting, false);
    expect((await getCompanyPage(viewer, lumen.id)).statistic).toBeNull();
  });

  it("US08-2: a student who declined can give consent later and then counts", async () => {
    await insertRepliedApplications(declined, lumen, [10, 12, 17, 20, 30]);
    expect((await getCompanyPage(viewer, lumen.id)).statistic).toBeNull();
    await setConsent(declined, true);
    expect((await getCompanyPage(viewer, lumen.id)).statistic).toEqual({ label: "2–3 weeks", basedOn: 5 });
  });

  it("SPEC §10: unknown or malformed company id → Not found", async () => {
    await expect(getCompanyPage(viewer, "00000000-0000-4000-8000-000000000000")).rejects.toThrow(NotFoundError);
    await expect(getCompanyPage(viewer, "not-a-uuid")).rejects.toThrow(NotFoundError);
  });

  it("SPEC §3: a career_service user cannot open a company page (Access denied)", async () => {
    await expect(getCompanyPage(careers, lumen.id)).rejects.toThrow(AccessDeniedError);
  });
});
