import { describe, expect, it } from "vitest";
import {
  applicationInputSchema,
  DATE_SENT_FUTURE_MESSAGE,
  EMAIL_DOMAIN_MESSAGE,
  registrationSchema,
  statusChangeInputSchema,
  type StatusChangeContext,
} from "@/lib/validation";

const TODAY = "2026-11-15";

type ParseResult = { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } };

/** Error messages grouped by the first path segment (the form field). */
function fieldErrors(result: ParseResult): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of result.error?.issues ?? []) {
    const key = String(issue.path[0] ?? "");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

describe("Registration (US01-1, US01-2)", () => {
  const valid = { name: "Ana Demo", email: "ana@up.pt", password: "12345678" };
  const parse = (patch: Partial<typeof valid>) => registrationSchema().safeParse({ ...valid, ...patch });

  it("US01-1: name, @up.pt email and an 8-character password are accepted", () => {
    expect(parse({}).success).toBe(true);
  });

  it("US01-2: ana@gmail.com is rejected with the University of Porto message", () => {
    const result = parse({ email: "ana@gmail.com" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result).email).toContain(EMAIL_DOMAIN_MESSAGE);
    expect(EMAIL_DOMAIN_MESSAGE).toBe("Use your University of Porto email (@up.pt or @fe.up.pt)");
  });

  it("US01-2: the domain check ignores case (ANA@UP.PT is accepted)", () => {
    expect(parse({ email: "ANA@UP.PT" }).success).toBe(true);
  });

  it("US01-2: @fe.up.pt is accepted", () => {
    expect(parse({ email: "ana@fe.up.pt" }).success).toBe(true);
  });

  it("US01-2: subdomains such as @edu.fe.up.pt are rejected (exact domains only)", () => {
    expect(fieldErrors(parse({ email: "ana@edu.fe.up.pt" })).email).toContain(EMAIL_DOMAIN_MESSAGE);
  });

  it("US01-2: look-alike domains (@notup.pt, @up.pt.com) are rejected", () => {
    expect(parse({ email: "ana@notup.pt" }).success).toBe(false);
    expect(parse({ email: "ana@up.pt.com" }).success).toBe(false);
  });

  it("US01-1: a 7-character password is rejected", () => {
    expect(fieldErrors(parse({ password: "1234567" })).password).toBeDefined();
  });

  it("US01-1: an empty name is rejected", () => {
    expect(fieldErrors(parse({ name: "   " })).name).toBeDefined();
  });
});

describe("Application input (US02-2, US02-3, US02-7, SPEC §10)", () => {
  const valid = {
    company: "Lumen Energy",
    roleTitle: "Operations Trainee",
    sector: "Energy & Utilities",
    channel: "Career Fair",
    jobType: "Trainee programme",
    dateSent: TODAY,
  };
  const parse = (patch: Record<string, unknown>) => applicationInputSchema(TODAY).safeParse({ ...valid, ...patch });

  it("US02-1: a complete application is accepted", () => {
    expect(parse({}).success).toBe(true);
  });

  it.each(["company", "roleTitle", "sector", "channel", "jobType", "dateSent"])(
    "US02-2: missing %s → error on that field only",
    (field) => {
      const result = parse({ [field]: undefined });
      expect(result.success).toBe(false);
      expect(Object.keys(fieldErrors(result))).toEqual([field]);
    },
  );

  it.each(["sector", "channel", "jobType", "dateSent"])(
    "US02-2: %s sent empty by the form ('') → error on that field only",
    (field) => {
      expect(Object.keys(fieldErrors(parse({ [field]: "" })))).toEqual([field]);
    },
  );

  it.each(["company", "roleTitle"])("US02-2: %s with only spaces is treated as empty", (field) => {
    expect(fieldErrors(parse({ [field]: "   " }))[field]).toBeDefined();
  });

  it("US02-3: date sent defaults to today, and today is accepted", () => {
    expect(parse({ dateSent: TODAY }).success).toBe(true);
  });

  it("US02-3: a date in the future → 'Date sent cannot be in the future'", () => {
    const result = parse({ dateSent: "2026-11-16" });
    expect(fieldErrors(result).dateSent).toContain(DATE_SENT_FUTURE_MESSAGE);
    expect(DATE_SENT_FUTURE_MESSAGE).toBe("Date sent cannot be in the future");
  });

  it("US02-3: an invalid date is rejected", () => {
    expect(fieldErrors(parse({ dateSent: "2026-02-30" })).dateSent).toBeDefined();
  });

  it.each([
    ["sector", "Aerospace"],
    ["channel", "Carrier pigeon"],
    ["jobType", "Part-time"],
  ])("US02-7: %s outside the fixed list ('%s') is rejected", (field, value) => {
    expect(fieldErrors(parse({ [field]: value }))[field]).toBeDefined();
  });

  it("§10: company and role of 120 characters are accepted", () => {
    expect(parse({ company: "C".repeat(120), roleTitle: "R".repeat(120) }).success).toBe(true);
  });

  it("§10: company or role of 121 characters is rejected", () => {
    const errors = fieldErrors(parse({ company: "C".repeat(121), roleTitle: "R".repeat(121) }));
    expect(errors.company).toBeDefined();
    expect(errors.roleTitle).toBeDefined();
  });

  it("§10: length is measured after trimming, and values are trimmed", () => {
    const result = applicationInputSchema(TODAY).safeParse({
      ...valid,
      company: `  ${"C".repeat(120)}  `,
      roleTitle: "  Analyst  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.company).toBe("C".repeat(120));
      expect(result.data.roleTitle).toBe("Analyst");
    }
  });
});

describe("Status change input (US04-2, US04-3, R6)", () => {
  const ctx: StatusChangeContext = {
    currentStatus: "sent",
    dateSent: "2026-10-01",
    lastChangeOn: "2026-10-01",
    today: TODAY,
  };
  const parse = (input: Record<string, unknown>, patch: Partial<StatusChangeContext> = {}) =>
    statusChangeInputSchema({ ...ctx, ...patch }).safeParse(input);

  it("US04-1: In process on 18 Oct is accepted", () => {
    expect(parse({ status: "in_process", changedOn: "2026-10-18" }).success).toBe(true);
  });

  it("US04-2: No response is not a selectable status", () => {
    expect(fieldErrors(parse({ status: "no_response", changedOn: TODAY })).status).toBeDefined();
  });

  it("US04-2: the current status cannot be selected again", () => {
    expect(fieldErrors(parse({ status: "sent", changedOn: TODAY })).status).toBeDefined();
  });

  it("US04-3: today (the pre-filled date) is accepted", () => {
    expect(parse({ status: "interview", changedOn: TODAY }).success).toBe(true);
  });

  it("US04-3: a future date is rejected", () => {
    expect(fieldErrors(parse({ status: "interview", changedOn: "2026-11-16" })).changedOn).toBeDefined();
  });

  it("US04-3: a date before the date sent is rejected", () => {
    expect(fieldErrors(parse({ status: "interview", changedOn: "2026-09-30" })).changedOn).toBeDefined();
  });

  it("US04-3: a date before the last status change is rejected", () => {
    const result = parse(
      { status: "interview", changedOn: "2026-10-10" },
      { currentStatus: "in_process", lastChangeOn: "2026-10-18" },
    );
    expect(fieldErrors(result).changedOn).toBeDefined();
  });

  it("US04-8: from No response, a manual status is accepted (late reply)", () => {
    expect(
      parse({ status: "interview", changedOn: TODAY }, { currentStatus: "no_response", lastChangeOn: "2026-11-01" })
        .success,
    ).toBe(true);
  });
});
