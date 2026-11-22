"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteAccount } from "@/lib/services/accounts";
import { setConsent } from "@/lib/services/consent";
import { AccessDeniedError } from "@/lib/services/errors";
import { requireArea } from "@/lib/session";

export type PrivacyActionState = { error?: string };

const choiceSchema = z.enum(["share", "dont_share"]);

/** US08-1 / US08-2: withdraw or give consent. Statistics are never cached, so it applies at once. */
export async function changeConsent(_prev: PrivacyActionState, formData: FormData): Promise<PrivacyActionState> {
  const user = await requireArea("student");

  const parsed = choiceSchema.safeParse(formData.get("consent"));
  if (!parsed.success) return { error: "Something went wrong. Reload the page and try again." };

  try {
    await setConsent(user, parsed.data === "share");
  } catch (error) {
    if (error instanceof AccessDeniedError) redirect("/access-denied");
    console.error("Changing consent failed", error);
    return { error: "We could not save your choice. Try again in a moment." };
  }
  refresh();
  return {};
}

/** US08-3: delete the account (cascades to all the student's data), log out, confirm. */
export async function deleteMyAccount(): Promise<PrivacyActionState> {
  const user = await requireArea("student");

  try {
    await deleteAccount(user);
  } catch (error) {
    if (error instanceof AccessDeniedError) redirect("/access-denied");
    console.error("Deleting account failed", error);
    return { error: "We could not delete your account. Try again in a moment." };
  }

  // The session row is already gone (cascade); signOut still clears the cookie.
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (error) {
    console.error("Sign out after account deletion failed", error);
  }
  redirect("/account-deleted");
}
