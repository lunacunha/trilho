"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setConsent } from "@/lib/services/consent";
import { AccessDeniedError } from "@/lib/services/errors";
import { getCurrentUser } from "@/lib/session";

export type ConsentState = { error?: string };

const choiceSchema = z.enum(["share", "dont_share"]);

export async function chooseConsent(_prev: ConsentState, formData: FormData): Promise<ConsentState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = choiceSchema.safeParse(formData.get("consent"));
  if (!parsed.success) return { error: "Choose one option to continue." };

  try {
    await setConsent(user, parsed.data === "share");
  } catch (error) {
    if (error instanceof AccessDeniedError) redirect("/access-denied");
    console.error("Saving consent failed", error);
    return { error: "We could not save your choice. Try again in a moment." };
  }
  redirect("/pipeline");
}
