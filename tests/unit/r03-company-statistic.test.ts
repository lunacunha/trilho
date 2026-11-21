import { describe, expect, it } from "vitest";
import { companyStatistic } from "@/lib/rules/company-statistic";
import type { StatApplication } from "@/lib/rules/types";

/** An application sent on 1 Oct that got a first response after `days` days (or none). */
function app(consent: boolean | null, days: number | null): StatApplication {
  const changes: StatApplication["changes"] = [{ status: "sent", changedOn: "2026-10-01" }];
  if (days !== null) {
    const d = new Date(Date.UTC(2026, 9, 1 + days)).toISOString().slice(0, 10);
    changes.push({ status: "in_process", changedOn: d });
  }
  return { dateSent: "2026-10-01", consent, changes };
}

describe("R3 — Statistic threshold", () => {
  it("R3: 5 replied applications from consenting students → statistic", () => {
    const stat = companyStatistic([10, 12, 17, 20, 30].map((d) => app(true, d)));
    expect(stat).toEqual({ basedOn: 5, medianDays: 17 });
  });

  it("R3: 4 replied applications → no statistic", () => {
    expect(companyStatistic([10, 12, 17, 20].map((d) => app(true, d)))).toBeNull();
  });

  it("R3: 6 replied, 2 of them from students who withdrew consent → 4 → no statistic", () => {
    const apps = [
      ...[10, 12, 17, 20].map((d) => app(true, d)),
      app(false, 15),
      app(false, 16),
    ];
    expect(companyStatistic(apps)).toBeNull();
  });

  it("R3: applications without a first response do not count", () => {
    const apps = [...[10, 12, 17, 20].map((d) => app(true, d)), app(true, null), app(true, null)];
    expect(companyStatistic(apps)).toBeNull();
  });

  it("R3: consent not answered (NULL) is not consenting", () => {
    const apps = [...[10, 12, 17, 20].map((d) => app(true, d)), app(null, 15)];
    expect(companyStatistic(apps)).toBeNull();
  });

  it("R3: basedOn counts only eligible applications", () => {
    const apps = [...[10, 12, 14, 16, 18, 20].map((d) => app(true, d)), app(false, 5), app(true, null)];
    expect(companyStatistic(apps)).toEqual({ basedOn: 6, medianDays: 15 });
  });
});
