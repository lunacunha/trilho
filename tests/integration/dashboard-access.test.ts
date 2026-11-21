import { beforeEach, describe, expect, it } from "vitest";
import { getDashboard } from "@/lib/services/dashboard";
import { AccessDeniedError } from "@/lib/services/errors";
import {
  createCompany,
  createUser,
  insertRepliedApplications,
  resetDatabase,
  TODAY,
  type TestUser,
} from "./helpers";

describe("US07-1 / US07-4 — Dashboard access and anonymity", () => {
  let student: TestUser;
  let careers: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    student = await createUser({ name: "Carla Student" });
    careers = await createUser({ role: "career_service", name: "Career Office" });
    const lumen = await createCompany("Lumen Energy");
    await insertRepliedApplications(student, lumen, [10, 12, 17, 20, 30]);
  });

  it("US07-1: a student cannot get the dashboard data (Access denied)", async () => {
    await expect(getDashboard(student, TODAY)).rejects.toThrow(AccessDeniedError);
  });

  it("US07-1: a career_service user gets the dashboard data", async () => {
    const dashboard = await getDashboard(careers, TODAY);
    expect(dashboard.companies.map((c) => c.name)).toEqual(["Lumen Energy"]);
  });

  it("US07-4: the dashboard contains no names, emails or per-student data", async () => {
    const json = JSON.stringify(await getDashboard(careers, TODAY));
    expect(json).not.toContain(student.name);
    expect(json).not.toContain(student.email);
    expect(json).not.toContain(student.id);
  });
});
