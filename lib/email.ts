// Outgoing email (decision 007: Gmail SMTP through Nodemailer).
import nodemailer from "nodemailer";

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

  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  await transporter.sendMail({
    from: `Trilho <${user}>`,
    to,
    subject: "Verify your email for Trilho",
    text: `Open this link to verify your email and start using Trilho:\n\n${url}\n\nIf you did not create a Trilho account, ignore this email.`,
    html: `<p>Open this link to verify your email and start using Trilho:</p><p><a href="${url}">Verify my email</a></p><p>If you did not create a Trilho account, ignore this email.</p>`,
  });
}
