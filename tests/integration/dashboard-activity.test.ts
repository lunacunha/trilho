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

// R9 uses the action timestamps (application created, status change made); automatic
// R5 changes are not made by the student and do not count as activity.
describe("US07-2 / R9 — Active students and median on the dashboard", () => {
  let careers: TestUser;
  let lumen: { id: string; name: string };

  beforeEach(async () => {
    await resetDatabase();
    careers = await createUser({ role: "career_service" });
    lumen = await createCompany("Lumen Energy");
  });

  it("R9: an application created 29 days ago counts; 30 days ago does not", async () => {
    const recent = await createUser({ consent: true });
    const old = await createUser({ consent: true });
    await insertApplication({ user: recent, company: lumen, dateSent: daysAgo(29) });
    await insertApplication({ user: old, company: lumen, dateSent: daysAgo(30) });
    expect((await getDashboard(careers, TODAY)).activeStudents).toBe(1);
  });

  it("R9: a status change made in the window makes an older application's owner active", async () => {
    const student = await createUser({ consent: true });
    await insertApplication({ user: student, company: lumen, dateSent: daysAgo(90), then: [["interview", daysAgo(2)]] });
    expect((await getDashboard(careers, TODAY)).activeStudents).toBe(1);
  });

  it("R9: a student whose only recent change is an automatic No response is not active", async () => {
    const student = await createUser({ consent: true });
    await insertApplication({ user: student, company: lumen, dateSent: daysAgo(61), then: [["no_response", daysAgo(1), true]] });
    expect((await getDashboard(careers, TODAY)).activeStudents).toBe(0);
  });

  it("US07-2: no first responses → median time to first reply is null", async () => {
    const student = await createUser({ consent: true });
    await insertApplication({ user: student, company: lumen, dateSent: daysAgo(3) });
    const dashboard = await getDashboard(careers, TODAY);
    expect(dashboard.medianDaysToFirstReply).toBeNull();
    expect(dashboard.companies).toEqual([]);
  });

  it("US07-2 / R3: 4 replied applications from consenting students → no median (Not enough data yet)", async () => {
    const consenting = await createUser({ consent: true });
    const declined = await createUser({ consent: false });
    await insertRepliedApplications(consenting, lumen, [10, 12, 17, 20]);
    await insertRepliedApplications(declined, lumen, [5, 5, 5]);
    expect((await getDashboard(careers, TODAY)).medianDaysToFirstReply).toBeNull();
  });

  it("US07-2 / R3: 5 replied applications from consenting students → median shown", async () => {
    const consenting = await createUser({ consent: true });
    await insertRepliedApplications(consenting, lumen, [10, 12, 17, 20, 30]);
    expect((await getDashboard(careers, TODAY)).medianDaysToFirstReply).toBe(17);
  });
});
