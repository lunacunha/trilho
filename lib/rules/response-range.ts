// R2 — Typical response range: median in days → weeks, rounded down and up.

export type TypicalRange =
  | { kind: "less_than_1_week" }
  | { kind: "about"; weeks: number }
  | { kind: "range"; from: number; to: number };

const DAYS_PER_WEEK = 7;

/** Median; with an even number of values, the average of the two middle values. */
export function median(values: number[]): number {
  if (values.length === 0) throw new Error("median of an empty list");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function typicalRange(medianDays: number): TypicalRange {
  if (medianDays < DAYS_PER_WEEK) return { kind: "less_than_1_week" };
  const weeks = medianDays / DAYS_PER_WEEK;
  if (Number.isInteger(weeks)) return { kind: "about", weeks };
  return { kind: "range", from: Math.floor(weeks), to: Math.ceil(weeks) };
}

const weeksLabel = (n: number) => (n === 1 ? "week" : "weeks");

/** "less than 1 week", "about 2 weeks", "2–3 weeks" (en dash). */
export function formatTypicalRange(range: TypicalRange): string {
  switch (range.kind) {
    case "less_than_1_week":
      return "less than 1 week";
    case "about":
      return `about ${range.weeks} ${weeksLabel(range.weeks)}`;
    case "range":
      return `${range.from}–${range.to} weeks`;
  }
}
