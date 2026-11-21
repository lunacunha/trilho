import { describe, expect, it } from "vitest";
import { daysSinceSent } from "@/lib/rules/days-since-sent";

describe("R10 — Days since sent", () => {
  it("R10: sent 1 Nov, today 15 Nov → 14 days", () => {
    expect(daysSinceSent("2026-11-01", "2026-11-15")).toBe(14);
  });

  it("R10: sent today → 0 days", () => {
    expect(daysSinceSent("2026-11-15", "2026-11-15")).toBe(0);
  });

  it("R10: counts calendar days across the end of summer time (25 Oct)", () => {
    expect(daysSinceSent("2026-10-20", "2026-10-30")).toBe(10);
  });
});
