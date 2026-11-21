import { describe, expect, it } from "vitest";
import { firstResponse } from "@/lib/rules/first-response";

describe("R1 — First response", () => {
  it("R1: sent 1 Oct, In process 18 Oct → first response 18 Oct, 17 days", () => {
    expect(
      firstResponse("2026-10-01", [
        { status: "sent", changedOn: "2026-10-01" },
        { status: "in_process", changedOn: "2026-10-18" },
      ]),
    ).toEqual({ date: "2026-10-18", days: 17 });
  });

  it("R1: auto No response on 30 Nov, then Interview on 5 Dec → first response 5 Dec, 65 days", () => {
    expect(
      firstResponse("2026-10-01", [
        { status: "sent", changedOn: "2026-10-01" },
        { status: "no_response", changedOn: "2026-11-30" },
        { status: "interview", changedOn: "2026-12-05" },
      ]),
    ).toEqual({ date: "2026-12-05", days: 65 });
  });

  it("R1: only Sent → no first response", () => {
    expect(firstResponse("2026-10-01", [{ status: "sent", changedOn: "2026-10-01" }])).toBeNull();
  });

  it("R1: No response is not a response", () => {
    expect(
      firstResponse("2026-10-01", [
        { status: "sent", changedOn: "2026-10-01" },
        { status: "no_response", changedOn: "2026-11-30" },
      ]),
    ).toBeNull();
  });

  it("R1: Rejected counts as a first response", () => {
    expect(
      firstResponse("2026-10-01", [
        { status: "sent", changedOn: "2026-10-01" },
        { status: "rejected", changedOn: "2026-10-11" },
        { status: "interview", changedOn: "2026-10-20" },
      ]),
    ).toEqual({ date: "2026-10-11", days: 10 });
  });
});
