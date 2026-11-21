import { describe, expect, it } from "vitest";
import { checkStatusChange, type StatusChangeCheckInput } from "@/lib/rules/status-transition";
import type { ApplicationStatus } from "@/lib/rules/types";

const base: StatusChangeCheckInput = {
  from: "sent",
  to: "in_process",
  changedOn: "2026-11-15",
  dateSent: "2026-10-01",
  lastChangeOn: "2026-10-01",
  today: "2026-11-15",
};
const check = (patch: Partial<StatusChangeCheckInput>) => checkStatusChange({ ...base, ...patch });

describe("R6 — Status transitions", () => {
  const manual: ApplicationStatus[] = ["sent", "in_process", "interview", "offer", "rejected"];

  it("R6: free movement between manual statuses, in any direction", () => {
    for (const from of manual) {
      for (const to of manual) {
        if (from === to) continue;
        expect(check({ from, to }), `${from} → ${to}`).toEqual({ ok: true });
      }
    }
  });

  it("R6: No response is never selectable manually", () => {
    expect(check({ from: "sent", to: "no_response" })).toEqual({ ok: false, reason: "not_manual" });
  });

  it("R6: No response → Interview is allowed (late reply, US04-8)", () => {
    expect(check({ from: "no_response", to: "interview" })).toEqual({ ok: true });
  });

  it("R6: changing to the current status is rejected", () => {
    expect(check({ from: "sent", to: "sent" })).toEqual({ ok: false, reason: "same_status" });
  });

  it("R6: a date in the future is rejected (US04-3)", () => {
    expect(check({ changedOn: "2026-11-16" })).toEqual({ ok: false, reason: "future" });
  });

  it("R6: today is accepted", () => {
    expect(check({ changedOn: "2026-11-15" })).toEqual({ ok: true });
  });

  it("R6: a date before the date sent is rejected (US04-3)", () => {
    expect(check({ changedOn: "2026-09-30" })).toEqual({ ok: false, reason: "before_date_sent" });
  });

  it("R6: the date sent itself is accepted", () => {
    expect(check({ changedOn: "2026-10-01" })).toEqual({ ok: true });
  });

  it("R6: a date before the last status change is rejected", () => {
    expect(
      check({ from: "in_process", to: "interview", lastChangeOn: "2026-10-18", changedOn: "2026-10-10" }),
    ).toEqual({ ok: false, reason: "before_last_change" });
  });

  it("R6: the same day as the last status change is accepted", () => {
    expect(
      check({ from: "in_process", to: "interview", lastChangeOn: "2026-10-18", changedOn: "2026-10-18" }),
    ).toEqual({ ok: true });
  });
});
