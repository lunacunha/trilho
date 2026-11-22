// R3 — Statistic threshold: ≥ 5 applications with a first response (R1),
// counting only applications of students whose consent is currently true.
import { firstResponse } from "./first-response.ts";
import { median } from "./response-range.ts";
import type { StatApplication } from "./types.ts";

export const STATISTIC_MIN_RESPONSES = 5;

export type CompanyStatistic = { basedOn: number; medianDays: number };

export function companyStatistic(applications: StatApplication[]): CompanyStatistic | null {
  const days = applications
    .filter((a) => a.consent === true)
    .map((a) => firstResponse(a.dateSent, a.changes))
    .filter((r) => r !== null)
    .map((r) => r.days);
  if (days.length < STATISTIC_MIN_RESPONSES) return null;
  return { basedOn: days.length, medianDays: median(days) };
}
