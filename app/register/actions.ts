"use server";

import { APIError } from "better-auth";
import { redirect } from "next/navigation";
import { AFTER_VERIFICATION_URL, auth } from "@/lib/auth";
import { registrationSchema } from "@/lib/validation";

export type RegisterState = {
  fieldErrors?: Partial<Record<"name" | "email" | "password", string[]>>;
  message?: string;
  values?: { name: string; email: string };
};

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { name: raw.name, email: raw.email };

  const parsed = registrationSchema().safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: RegisterState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<RegisterState["fieldErrors"]>;
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { fieldErrors, values };
  }

  try {
    // An existing email gets the same response as a new one (see onExistingUserSignUp).
    await auth.api.signUpEmail({ body: { ...parsed.data, callbackURL: AFTER_VERIFICATION_URL } });
  } catch (error) {
    if (error instanceof APIError && error.status === "BAD_REQUEST") {
      // e.g. the server-side domain check
      return { message: error.message, values };
    }
    console.error("Registration failed", error);
    return { message: "We could not create your account. Try again in a moment.", values };
  }

  redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
}
