import { describe, expect, it } from "vitest";
import { reminderState, reminderThreshold } from "@/lib/rules/reminder";
import type { ApplicationStatus } from "@/lib/rules/types";

const TODAY = "2026-11-15";
const daysAgo = (n: number) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);

function state(status: ApplicationStatus, quietDays: number, thresholdDays: number) {
  return reminderState({
    status,
    lastChange: { id: "sc-1", changedOn: daysAgo(quietDays) },
    today: TODAY,
    thresholdDays,
    existing: null,
  });
}

describe("R4 — Reminder trigger", () => {
  it("R4: company with a statistic → threshold = median, reason company_median", () => {
    expect(reminderThreshold(17)).toEqual({ days: 17, reason: "company_median" });
  });

  it("R4: company without a statistic → threshold 14 days, reason fallback_14_days", () => {
    expect(reminderThreshold(null)).toEqual({ days: 14, reason: "fallback_14_days" });
  });

  it("R4: median 16.5 → threshold 17", () => {
    expect(reminderThreshold(16.5)).toEqual({ days: 17, reason: "company_median" });
  });

  it("R4: median 17, Sent, last change 17 days ago → reminder", () => {
    expect(state("sent", 17, 17)).toBe("trigger");
  });

  it("R4: median 17, Sent, last change 16 days ago → no reminder", () => {
    expect(state("sent", 16, 17)).toBe("none");
  });

  it("R4: no statistic, 14 days → reminder", () => {
    expect(state("sent", 14, 14)).toBe("trigger");
  });

  it("R4: no statistic, 13 days → no reminder", () => {
    expect(state("sent", 13, 14)).toBe("none");
  });

  it("R4: applies to In process", () => {
    expect(state("in_process", 20, 14)).toBe("trigger");
  });

  it.each<ApplicationStatus>(["interview", "offer", "rejected", "no_response"])(
    "R4: %s quiet for 30 days → no reminder (US05-4)",
    (status) => {
      expect(state(status, 30, 14)).toBe("none");
    },
  );
});
