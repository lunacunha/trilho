import { describe, expect, it } from "vitest";
import { reminderState, type ReminderStateInput } from "@/lib/rules/reminder";

const base: ReminderStateInput = {
  status: "sent",
  lastChange: { id: "sc-1", changedOn: "2026-10-20" },
  today: "2026-11-15",
  thresholdDays: 14,
  existing: null,
};

describe("R12 — Reminder lifecycle", () => {
  it("R12: threshold passed, no reminder yet in this quiet period → trigger", () => {
    expect(reminderState(base)).toBe("trigger");
  });

  it("R12: already triggered in this quiet period, no reaction → show (not triggered again)", () => {
    expect(reminderState({ ...base, existing: { statusChangeId: "sc-1", outcome: null } })).toBe("show");
  });

  it("R12: Follow-up done in this quiet period → hidden (US05-5)", () => {
    expect(reminderState({ ...base, existing: { statusChangeId: "sc-1", outcome: "followup_done" } })).toBe(
      "hidden",
    );
  });

  it("R12: Dismissed in this quiet period → hidden (US05-6)", () => {
    expect(reminderState({ ...base, existing: { statusChangeId: "sc-1", outcome: "dismissed" } })).toBe("hidden");
  });

  it("R12: a new status change starts a new quiet period → a new reminder can trigger (US05-7)", () => {
    expect(
      reminderState({
        ...base,
        status: "in_process",
        lastChange: { id: "sc-2", changedOn: "2026-10-30" },
        existing: { statusChangeId: "sc-1", outcome: "dismissed" },
      }),
    ).toBe("trigger");
  });

  it("R12: new quiet period before its threshold → none", () => {
    expect(
      reminderState({
        ...base,
        status: "in_process",
        lastChange: { id: "sc-2", changedOn: "2026-11-10" },
        existing: { statusChangeId: "sc-1", outcome: "dismissed" },
      }),
    ).toBe("none");
  });
});
