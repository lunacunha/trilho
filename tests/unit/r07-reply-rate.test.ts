import { describe, expect, it } from "vitest";
import { replyRate } from "@/lib/rules/reply-rate";
import type { StatApplication } from "@/lib/rules/types";

const replied = (consent: boolean | null): StatApplication => ({
  dateSent: "2026-10-01",
  consent,
  changes: [
    { status: "sent", changedOn: "2026-10-01" },
    { status: "in_process", changedOn: "2026-10-10" },
  ],
});
const silent = (consent: boolean | null): StatApplication => ({
  dateSent: "2026-10-01",
  consent,
  changes: [{ status: "sent", changedOn: "2026-10-01" }],
});
const noResponse = (consent: boolean | null): StatApplication => ({
  dateSent: "2026-08-01",
  consent,
  changes: [
    { status: "sent", changedOn: "2026-08-01" },
    { status: "no_response", changedOn: "2026-09-30" },
  ],
});

describe("R7 — Reply rate", () => {
  it("R7: 20 applications to Northwind, 7 with a first response → 35%", () => {
    const apps = [...Array.from({ length: 7 }, () => replied(true)), ...Array.from({ length: 13 }, () => silent(true))];
    expect(replyRate(apps)).toEqual({ applications: 20, replied: 7, rate: 0.35 });
  });

  it("R7: applications of non-consenting students are excluded", () => {
    const apps = [replied(true), silent(true), replied(false), replied(false), replied(null)];
    expect(replyRate(apps)).toEqual({ applications: 2, replied: 1, rate: 0.5 });
  });

  it("R7: automatic No response is not a reply", () => {
    expect(replyRate([noResponse(true), replied(true)])).toEqual({ applications: 2, replied: 1, rate: 0.5 });
  });

  it("R7: no applications from consenting students → null", () => {
    expect(replyRate([replied(false)])).toBeNull();
    expect(replyRate([])).toBeNull();
  });
});
