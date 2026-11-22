import { describe, expect, it } from "vitest";
import { findNonSeedEmails } from "@/db/seed-guard";

const SEED = ["demo@example.com", "careers@example.com"];

describe("Seed guard — findNonSeedEmails", () => {
  it("Seed guard: an empty database has no non-seed accounts", () => {
    expect(findNonSeedEmails([], SEED)).toEqual([]);
  });

  it("Seed guard: only seed accounts → nothing to protect", () => {
    expect(findNonSeedEmails(["demo@example.com", "careers@example.com"], SEED)).toEqual([]);
  });

  it("Seed guard: the comparison ignores case and surrounding spaces", () => {
    expect(findNonSeedEmails(["  DEMO@Example.com "], SEED)).toEqual([]);
  });

  it("Seed guard: one real account among seed accounts is reported", () => {
    expect(findNonSeedEmails(["demo@example.com", "real.person@example.com"], SEED)).toEqual([
      "real.person@example.com",
    ]);
  });
});
