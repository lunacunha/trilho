"use server";

import { redirect } from "next/navigation";
import { lisbonToday } from "@/lib/rules/dates";
import { createApplication, recordFormOpened } from "@/lib/services/applications";
import { requireArea } from "@/lib/session";
import { formSessionIdSchema } from "@/lib/validation";
import { parseApplicationForm, type ApplicationFieldErrors, type ApplicationFormValues } from "../application-form";

export type NewApplicationState = {
  fieldErrors?: ApplicationFieldErrors;
  message?: string;
  values?: ApplicationFormValues;
  /** Changes on every failed submit, so the form remounts with `values` (selects included). */
  submitId?: number;
};

/** US02: validates on the server, creates the application, returns to the pipeline. */
export async function createApplicationAction(
  prev: NewApplicationState,
  formData: FormData,
): Promise<NewApplicationState> {
  const user = await requireArea("student");
  const today = lisbonToday(new Date());

  const submitId = (prev.submitId ?? 0) + 1;

  const parsed = parseApplicationForm(formData, today);
  const { values } = parsed;
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values, submitId };

  const formSession = formSessionIdSchema.safeParse(formData.get("form_session_id"));
  try {
    await createApplication(user, parsed.data, {
      today,
      formSessionId: formSession.success ? formSession.data : undefined,
    });
  } catch (error) {
    console.error("Create application failed", error);
    return { message: "We could not save your application. Try again in a moment.", values, submitId };
  }

  redirect("/pipeline");
}

/** SPEC §9: application_form_opened. Called once when the form is shown; never blocks the student. */
export async function formOpenedAction(formSessionId: string): Promise<void> {
  const user = await requireArea("student");
  const parsed = formSessionIdSchema.safeParse(formSessionId);
  if (!parsed.success) {
    console.error("application_form_opened: invalid form_session_id");
    return;
  }
  try {
    await recordFormOpened(user, parsed.data);
  } catch (error) {
    console.error("Recording application_form_opened failed", error);
  }
}
