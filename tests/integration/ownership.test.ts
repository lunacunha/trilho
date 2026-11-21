import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  changeStatus,
  deleteApplication,
  getApplication,
  getPipeline,
  updateApplication,
} from "@/lib/services/applications";
import { NotFoundError } from "@/lib/services/errors";
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

describe("US03-3 — Only my applications", () => {
  let ana: TestUser;
  let bruno: TestUser;
  let anaAppId: string;
  const edit: ApplicationInput = {
    company: "Lumen Energy",
    roleTitle: "Changed by someone else",
    sector: "Energy & Utilities",
    channel: "Career Fair",
    jobType: "Trainee programme",
    dateSent: "2026-11-01",
  };

  beforeEach(async () => {
    await resetDatabase();
    ana = await createUser({ name: "Ana" });
    bruno = await createUser({ name: "Bruno" });
    const lumen = await createCompany("Lumen Energy");
    anaAppId = (await insertApplication({ user: ana, company: lumen, dateSent: "2026-11-01" })).id;
    await insertApplication({ user: bruno, company: lumen, dateSent: "2026-11-02", roleTitle: "Bruno's role" });
  });

  it("US03-3: student B cannot read A's application (Not found)", async () => {
    await expect(getApplication(bruno, anaAppId)).rejects.toThrow(NotFoundError);
  });

  it("US03-3: a non-existent id gives the same Not found", async () => {
    await expect(getApplication(ana, randomUUID())).rejects.toThrow(NotFoundError);
  });

  it("US03-3: student B cannot update A's application, and it is unchanged", async () => {
    await expect(updateApplication(bruno, anaAppId, edit, TODAY)).rejects.toThrow(NotFoundError);
    expect((await getApplicationRow(anaAppId)).roleTitle).toBe("Operations Trainee");
  });

  it("US03-3: student B cannot change the status of A's application", async () => {
    await expect(
      changeStatus(bruno, anaAppId, { status: "in_process", changedOn: TODAY }, TODAY),
    ).rejects.toThrow(NotFoundError);
    expect(await getStatusChanges(anaAppId)).toHaveLength(1);
    expect((await getApplicationRow(anaAppId)).currentStatus).toBe("sent");
  });

  it("US03-3: student B cannot delete A's application, and it still exists", async () => {
    await expect(deleteApplication(bruno, anaAppId)).rejects.toThrow(NotFoundError);
    expect(await getApplicationRow(anaAppId)).toBeDefined();
  });

  it("US03-3: B's applications never appear in A's pipeline", async () => {
    const pipeline = await getPipeline(ana, TODAY);
    const cards = Object.values(pipeline.columns).flat();
    expect(cards.map((c) => c.id)).toEqual([anaAppId]);
  });
});
