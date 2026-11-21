import { describe, expect, it } from "vitest";
import { displayCompanyName, normalizeCompanyName } from "@/lib/rules/company-name";

describe("R11 — Company name normalisation", () => {
  it("R11: ' lumen  ENERGY ' is the same company as 'Lumen Energy'", () => {
    expect(normalizeCompanyName(" lumen  ENERGY ")).toBe(normalizeCompanyName("Lumen Energy"));
  });

  it("R11: 'Lumen' and 'Lumen Energy SA' are different companies", () => {
    expect(normalizeCompanyName("Lumen")).not.toBe(normalizeCompanyName("Lumen Energy SA"));
  });

  it("R11: display name is the version typed, trimmed", () => {
    expect(displayCompanyName("  Lumen Energy ")).toBe("Lumen Energy");
  });

  it("R11: tabs and repeated inner spaces collapse to one space", () => {
    expect(normalizeCompanyName("Douro\t  Software")).toBe("douro software");
  });
});
