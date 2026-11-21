import { describe, expect, it } from "vitest";
import { isActiveStudent } from "@/lib/rules/active-student";

const TODAY = "2026-11-15";

describe("R9 — Active student", () => {
  it("R9: today 15 Nov, last activity 20 Oct → active", () => {
    expect(isActiveStudent({ consent: true, lastActivityOn: "2026-10-20" }, TODAY)).toBe(true);
  });

  it("R9: today 15 Nov, last activity 10 Oct → not active", () => {
    expect(isActiveStudent({ consent: true, lastActivityOn: "2026-10-10" }, TODAY)).toBe(false);
  });

  it("R9: last activity 17 Oct (29 days before today) → active", () => {
    expect(isActiveStudent({ consent: true, lastActivityOn: "2026-10-17" }, TODAY)).toBe(true);
  });

  it("R9: last activity 16 Oct (30 days before today) → not active", () => {
    expect(isActiveStudent({ consent: true, lastActivityOn: "2026-10-16" }, TODAY)).toBe(false);
  });

  it("R9: activity today → active", () => {
    expect(isActiveStudent({ consent: true, lastActivityOn: TODAY }, TODAY)).toBe(true);
  });

  it("R9: non-consenting student → never active", () => {
    expect(isActiveStudent({ consent: false, lastActivityOn: TODAY }, TODAY)).toBe(false);
    expect(isActiveStudent({ consent: null, lastActivityOn: TODAY }, TODAY)).toBe(false);
  });

  it("R9: no activity → not active", () => {
    expect(isActiveStudent({ consent: true, lastActivityOn: null }, TODAY)).toBe(false);
  });
});
