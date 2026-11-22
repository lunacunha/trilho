import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock("nodemailer", () => ({ default: { createTransport } }));

const { sendVerificationEmail } = await import("@/lib/email");

describe("Verification email — SMTP timeouts (deploy readiness)", () => {
  beforeEach(() => {
    vi.stubEnv("SMTP_USER", "sender@example.com");
    vi.stubEnv("SMTP_PASSWORD", "not-a-real-password");
    sendMail.mockReset();
    createTransport.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("Email: the Gmail transport uses 10 s connection, greeting and socket timeouts", async () => {
    sendMail.mockResolvedValue({});
    await sendVerificationEmail("ana@example.com", "https://trilho.example.com/verify");
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        service: "gmail",
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 10_000,
      }),
    );
  });

  it("Email: a failed send is logged on the server without the link, and rethrown", async () => {
    sendMail.mockRejectedValue(new Error("Greeting never received"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      sendVerificationEmail("ana@example.com", "https://trilho.example.com/verify?token=secret-token"),
    ).rejects.toThrow("Greeting never received");
    expect(log).toHaveBeenCalledWith("Sending the verification email failed: Greeting never received");
    expect(log.mock.calls.flat().join(" ")).not.toContain("secret-token");
  });
});
