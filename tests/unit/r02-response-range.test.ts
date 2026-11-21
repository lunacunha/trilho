import { describe, expect, it } from "vitest";
import { formatTypicalRange, median, typicalRange } from "@/lib/rules/response-range";

const label = (medianDays: number) => formatTypicalRange(typicalRange(medianDays));

describe("R2 — Typical response range", () => {
  it("R2: median 17 days → '2–3 weeks'", () => {
    expect(typicalRange(17)).toEqual({ kind: "range", from: 2, to: 3 });
    expect(label(17)).toBe("2–3 weeks");
  });

  it("R2: median 14 days → exactly 2 weeks → 'about 2 weeks'", () => {
    expect(typicalRange(14)).toEqual({ kind: "about", weeks: 2 });
    expect(label(14)).toBe("about 2 weeks");
  });

  it("R2: median 5 days (< 7) → 'less than 1 week'", () => {
    expect(typicalRange(5)).toEqual({ kind: "less_than_1_week" });
    expect(label(5)).toBe("less than 1 week");
  });

  it("R2: median 7 days → 'about 1 week'", () => {
    expect(label(7)).toBe("about 1 week");
  });

  it("R2: median 6 days → 'less than 1 week' (boundary below 7)", () => {
    expect(label(6)).toBe("less than 1 week");
  });

  it("R2: median of 10, 12, 20, 30 → 16 days → '2–3 weeks'", () => {
    expect(median([10, 12, 20, 30])).toBe(16);
    expect(label(16)).toBe("2–3 weeks");
  });

  it("R2: odd number of values → middle value", () => {
    expect(median([30, 10, 17, 12, 20])).toBe(17);
  });

  it("R2: median 16.5 days → '2–3 weeks'", () => {
    expect(median([10, 16, 17, 30])).toBe(16.5);
    expect(label(16.5)).toBe("2–3 weeks");
  });
});
