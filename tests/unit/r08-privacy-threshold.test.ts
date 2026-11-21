import { describe, expect, it } from "vitest";
import { meetsPrivacyThreshold } from "@/lib/rules/privacy-threshold";

describe("R8 — Dashboard privacy threshold", () => {
  it("R8: 5 applications from consenting students → shown", () => {
    expect(meetsPrivacyThreshold(5)).toBe(true);
  });

  it("R8: 4 applications → hidden", () => {
    expect(meetsPrivacyThreshold(4)).toBe(false);
  });

  it("R8: only one student applied (1 application) → hidden", () => {
    expect(meetsPrivacyThreshold(1)).toBe(false);
  });
});
