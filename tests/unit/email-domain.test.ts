import { describe, expect, it } from "vitest";
import { isAllowedEmailDomain } from "@/lib/rules/email-domain";

describe("Email domain check (US01-2)", () => {
  it.each(["ana@up.pt", "ana@fe.up.pt"])("US01-2: %s is accepted", (email) => {
    expect(isAllowedEmailDomain(email)).toBe(true);
  });

  it("US01-2: the check ignores case (ANA@UP.PT, Ana@Fe.Up.Pt)", () => {
    expect(isAllowedEmailDomain("ANA@UP.PT")).toBe(true);
    expect(isAllowedEmailDomain("Ana@Fe.Up.Pt")).toBe(true);
  });

  it("US01-2: ana@gmail.com is rejected", () => {
    expect(isAllowedEmailDomain("ana@gmail.com")).toBe(false);
  });

  it("US01-2: subdomains such as ana@edu.fe.up.pt are rejected (exact domains only)", () => {
    expect(isAllowedEmailDomain("ana@edu.fe.up.pt")).toBe(false);
  });

  it.each(["ana@notup.pt", "ana@up.pt.com", "ana@xfe.up.pt"])("US01-2: look-alike domain %s is rejected", (email) => {
    expect(isAllowedEmailDomain(email)).toBe(false);
  });

  it("US01-2: only the part after the last @ counts (ana@up.pt@gmail.com is rejected)", () => {
    expect(isAllowedEmailDomain("ana@up.pt@gmail.com")).toBe(false);
  });

  it.each(["", "up.pt", "@up.pt", "ana@"])("US01-2: malformed value '%s' is rejected", (email) => {
    expect(isAllowedEmailDomain(email)).toBe(false);
  });
});
