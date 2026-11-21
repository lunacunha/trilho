// Calendar-date helpers. "Today" is the current date in Europe/Lisbon (SPEC glossary).
import { notImplemented } from "../not-implemented.ts";

/** Calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return notImplemented(from, to);
}

/** The date `days` calendar days after `date`. */
export function addDays(date: string, days: number): string {
  return notImplemented(date, days);
}

/** The calendar date of the instant `now` in Europe/Lisbon, as "YYYY-MM-DD". */
export function lisbonToday(now: Date): string {
  return notImplemented(now);
}
