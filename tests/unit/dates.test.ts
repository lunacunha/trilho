import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDisplayDate, lisbonToday } from "@/lib/rules/dates";

describe("Dates — 'Today' is the current date in Europe/Lisbon (SPEC glossary)", () => {
  it("Today: 15 Nov 23:30 UTC is still 15 Nov in Lisbon (winter, UTC+0)", () => {
    expect(lisbonToday(new Date("2026-11-15T23:30:00Z"))).toBe("2026-11-15");
  });

  it("Today: 1 Jul 23:30 UTC is already 2 Jul in Lisbon (summer, UTC+1)", () => {
    expect(lisbonToday(new Date("2026-07-01T23:30:00Z"))).toBe("2026-07-02");
  });

  it("Dates: addDays and daysBetween are inverse (1 Sep + 60 = 31 Oct)", () => {
    expect(addDays("2026-09-01", 60)).toBe("2026-10-31");
    expect(daysBetween("2026-09-01", "2026-10-31")).toBe(60);
    expect(daysBetween("2026-10-31", "2026-09-01")).toBe(-60);
  });

  it("§11: dates are shown as '12 Oct 2026'", () => {
    expect(formatDisplayDate("2026-10-12")).toBe("12 Oct 2026");
    expect(formatDisplayDate("2026-03-01")).toBe("1 Mar 2026");
  });
});
