"use server";

import { z } from "zod";
import { AFTER_VERIFICATION_URL, auth } from "@/lib/auth";

export type ResendState = { message?: string; error?: string; email?: string };

/** Same answer whether or not the email has an unverified account (no account enumeration). */
export async function resendVerification(_prev: ResendState, formData: FormData): Promise<ResendState> {
  const raw = String(formData.get("email") ?? "");
  const parsed = z.string().trim().pipe(z.email()).safeParse(raw);
  if (!parsed.success) return { error: "Enter a valid email.", email: raw };

  try {
    // No session headers: Better Auth then answers the same for unknown, verified and unverified emails.
    await auth.api.sendVerificationEmail({ body: { email: parsed.data, callbackURL: AFTER_VERIFICATION_URL } });
  } catch (error) {
    console.error("Resending the verification email failed", error);
    return { error: "We could not send the email. Try again in a moment.", email: raw };
  }
  return { message: "If that email has an account waiting for verification, we sent a new link.", email: raw };
}
