// R2 — Typical response range: median in days → weeks, rounded down and up.
import { notImplemented } from "../not-implemented.ts";

export type TypicalRange =
  | { kind: "less_than_1_week" }
  | { kind: "about"; weeks: number }
  | { kind: "range"; from: number; to: number };

/** Median; with an even number of values, the average of the two middle values. */
export function median(values: number[]): number {
  return notImplemented(values);
}

export function typicalRange(medianDays: number): TypicalRange {
  return notImplemented(medianDays);
}

/** "less than 1 week", "about 2 weeks", "2–3 weeks" (en dash). */
export function formatTypicalRange(range: TypicalRange): string {
  return notImplemented(range);
}
