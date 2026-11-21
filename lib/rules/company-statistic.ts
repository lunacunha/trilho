// R3 — Statistic threshold: ≥ 5 applications with a first response (R1),
// counting only applications of students whose consent is currently true.
import { notImplemented } from "../not-implemented.ts";
import type { StatApplication } from "./types.ts";

export const STATISTIC_MIN_RESPONSES = 5;

export type CompanyStatistic = { basedOn: number; medianDays: number };

export function companyStatistic(applications: StatApplication[]): CompanyStatistic | null {
  return notImplemented(applications);
}
