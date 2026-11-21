"use server";

import { APIError } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";

const VERIFY_FIRST_MESSAGE = "Verify your email first";

export type LoginState = {
  message?: string;
  /** Set when the account exists but is not verified (US01-3): offer to resend. */
  unverifiedEmail?: string;
  email?: string;
};

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { message: "Enter your email and password.", email };

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "EMAIL_NOT_VERIFIED") {
        return { message: VERIFY_FIRST_MESSAGE, unverifiedEmail: parsed.data.email, email };
      }
      if (error.status === "UNAUTHORIZED" || error.status === "BAD_REQUEST") {
        return { message: "Invalid email or password.", email };
      }
    }
    console.error("Login failed", error);
    return { message: "We could not log you in. Try again in a moment.", email };
  }

  // "/" sends the user to consent, the pipeline or the dashboard
  redirect("/");
}
