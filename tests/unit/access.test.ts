import { describe, expect, it } from "vitest";
import { routeAccess } from "@/lib/rules/access";

describe("Route access (US01-4, US01-7, US07-1)", () => {
  it("US01-4: student who has not answered consent → consent screen", () => {
    expect(routeAccess({ role: "student", consent: null }, "student")).toBe("consent");
  });

  it("US01-7: student who already answered (true or false) → allowed", () => {
    expect(routeAccess({ role: "student", consent: true }, "student")).toBe("allow");
    expect(routeAccess({ role: "student", consent: false }, "student")).toBe("allow");
  });

  it("US07-1: visitor who is not logged in → login page", () => {
    expect(routeAccess(null, "student")).toBe("login");
    expect(routeAccess(null, "career_service")).toBe("login");
  });

  it("US07-1: student opening the dashboard → access denied", () => {
    expect(routeAccess({ role: "student", consent: true }, "career_service")).toBe("access_denied");
  });

  it("US07-1: career_service opening the dashboard → allowed", () => {
    expect(routeAccess({ role: "career_service", consent: null }, "career_service")).toBe("allow");
  });

  it("US07-1: career_service opening a student page → sent to the dashboard", () => {
    expect(routeAccess({ role: "career_service", consent: null }, "student")).toBe("dashboard");
  });
});
