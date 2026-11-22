// Calendar-date helpers. "Today" is the current date in Europe/Lisbon (SPEC glossary).
// Dates are "YYYY-MM-DD" strings; arithmetic is done in UTC so summer time never shifts a day.

const MS_PER_DAY = 86_400_000;

function toUtcMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

/** Calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

/** The date `days` calendar days after `date`. */
export function addDays(date: string, days: number): string {
  return new Date(toUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

const lisbonFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Lisbon",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar date of the instant `now` in Europe/Lisbon, as "YYYY-MM-DD". */
export function lisbonToday(now: Date): string {
  const parts = Object.fromEntries(lisbonFormatter.formatToParts(now).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
