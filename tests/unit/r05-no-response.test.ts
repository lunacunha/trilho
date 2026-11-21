import { describe, expect, it } from "vitest";
import { noResponseDate } from "@/lib/rules/no-response";

describe("R5 — 60-day No response rule", () => {
  it("R5: last change 1 Sep, opened 15 Nov → No response recorded on 31 Oct", () => {
    expect(noResponseDate("sent", "2026-09-01", "2026-11-15")).toBe("2026-10-31");
  });

  it("R5: exactly 60 days → converts, dated last change + 60", () => {
    expect(noResponseDate("sent", "2026-09-16", "2026-11-15")).toBe("2026-11-15");
  });

  it("R5: 59 days → not converted", () => {
    expect(noResponseDate("sent", "2026-09-17", "2026-11-15")).toBeNull();
  });

  it("R5: applies to In process", () => {
    expect(noResponseDate("in_process", "2026-09-01", "2026-11-15")).toBe("2026-10-31");
  });

  it("R5: Interview since 1 Sep → unchanged (US04-7)", () => {
    expect(noResponseDate("interview", "2026-09-01", "2026-11-15")).toBeNull();
  });

  it.each(["offer", "rejected", "no_response"] as const)("R5: %s → unchanged", (status) => {
    expect(noResponseDate(status, "2026-09-01", "2026-11-15")).toBeNull();
  });
});
