// Outgoing email (decision 007: Gmail SMTP through Nodemailer).
import nodemailer from "nodemailer";

/** Short SMTP timeouts (ms) so a stalled connection fails within seconds on Vercel. */
export const SMTP_TIMEOUTS = {
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
} as const;

/**
 * Sends the verification link. In development only, when SMTP_USER is not set,
 * the link is printed to the server log instead (prompt 03). Never in production.
 */
export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[dev] SMTP_USER is not set. Verification link for ${to}: ${url}`);
      return;
    }
    throw new Error("SMTP_USER is not set; cannot send the verification email.");
  }
  if (!pass) throw new Error("SMTP_PASSWORD is not set; cannot send the verification email.");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    // Fail fast instead of Nodemailer's 2-minute default, so a stalled SMTP server
    // cannot hold a serverless function (and the sign-up request) open.
    ...SMTP_TIMEOUTS,
  });
  try {
    await transporter.sendMail({
      from: `Trilho <${user}>`,
      to,
      subject: "Verify your email for Trilho",
      text: `Open this link to verify your email and start using Trilho:\n\n${url}\n\nIf you did not create a Trilho account, ignore this email.`,
      html: `<p>Open this link to verify your email and start using Trilho:</p><p><a href="${url}">Verify my email</a></p><p>If you did not create a Trilho account, ignore this email.</p>`,
    });
  } catch (error) {
    // Better Auth catches this and only logs it, so the user is not told; they can use "resend".
    // Log the reason only: never the link (it contains the token) or the credentials.
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Sending the verification email failed: ${reason}`);
    throw error;
  }
}
