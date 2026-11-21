import { beforeEach, describe, expect, it } from "vitest";
import { getDashboard } from "@/lib/services/dashboard";
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

describe("US07-2 / R8 — Dashboard hides small companies and channels", () => {
  let careers: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    careers = await createUser({ role: "career_service" });
    const consenting = await createUser({ consent: true });
    const declined = await createUser({ consent: false });

    const lumen = await createCompany("Lumen Energy");
    const northwind = await createCompany("Northwind Consulting");
    const vela = await createCompany("Vela Logistics");

    // Lumen: 6 consenting applications via Career Fair (3 replied)
    await insertRepliedApplications(consenting, lumen, [10, 12, 17], { channel: "Career Fair" });
    for (let i = 0; i < 3; i++) {
      await insertApplication({ user: consenting, company: lumen, dateSent: daysAgo(5), channel: "Career Fair" });
    }
    // Northwind: 5 consenting applications via Company portal
    await insertRepliedApplications(consenting, northwind, [8, 9, 11, 13, 15], { channel: "Company portal" });
    // Vela: 4 consenting + 3 non-consenting via Referral → 4 count → hidden
    await insertRepliedApplications(consenting, vela, [5, 6, 7, 8], { channel: "Referral" });
    await insertRepliedApplications(declined, vela, [5, 6, 7], { channel: "Referral" });
  });

  it("US07-2: companies with ≥ 5 applications appear, sorted by applications descending", async () => {
    const { companies } = await getDashboard(careers, TODAY);
    expect(companies.map((c) => [c.name, c.applications])).toEqual([
      ["Lumen Energy", 6],
      ["Northwind Consulting", 5],
    ]);
  });

  it("R8: a company with 4 applications from consenting students is hidden, even with 7 in total", async () => {
    const { companies } = await getDashboard(careers, TODAY);
    expect(companies.map((c) => c.name)).not.toContain("Vela Logistics");
  });

  it("R8: channels with < 5 applications from consenting students are hidden", async () => {
    const { channels } = await getDashboard(careers, TODAY);
    expect(channels.map((c) => c.name).sort()).toEqual(["Career Fair", "Company portal"]);
  });

  it("US07-2: reply rate per company (R7)", async () => {
    const { companies } = await getDashboard(careers, TODAY);
    expect(companies.find((c) => c.name === "Lumen Energy")?.replyRate).toBeCloseTo(0.5);
    expect(companies.find((c) => c.name === "Northwind Consulting")?.replyRate).toBeCloseTo(1);
  });
});
