// R10 — Days since sent (pipeline card): today − date sent, in calendar days.
import { daysBetween } from "./dates.ts";

export function daysSinceSent(dateSent: string, today: string): number {
  return daysBetween(dateSent, today);
}
