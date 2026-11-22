"use server";

import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { lisbonToday } from "@/lib/rules/dates";
import { changeStatus, deleteApplication, updateApplication } from "@/lib/services/applications";
import { NotFoundError, ValidationError } from "@/lib/services/errors";
import { requireArea } from "@/lib/session";
import { parseApplicationForm, type ApplicationFieldErrors, type ApplicationFormValues } from "../application-form";

// Each action is bound to the application id by the page. The services check ownership
// and R6; these actions only read the form, call one service and map its errors.

export type StatusChangeField = "status" | "changedOn";

export type StatusChangeState = {
  fieldErrors?: Partial<Record<StatusChangeField, string[]>>;
  message?: string;
  values?: Record<StatusChangeField, string>;
  /** Changes on every submit, so the form remounts with `values` (or fresh defaults). */
  submitId?: number;
  saved?: boolean;
};

/** US04-1/2/3/8: records a status change; R6 is checked by the service. */
export async function changeStatusAction(
  id: string,
  prev: StatusChangeState,
  formData: FormData,
): Promise<StatusChangeState> {
  const user = await requireArea("student");
  const values = {
    status: String(formData.get("status") ?? ""),
    changedOn: String(formData.get("changedOn") ?? ""),
  };
  const submitId = (prev.submitId ?? 0) + 1;

  try {
    // The service validates the input with statusChangeInputSchema (R6) against fresh data
    await changeStatus(user, id, values as Parameters<typeof changeStatus>[2], lisbonToday(new Date()));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ValidationError) {
      const field: StatusChangeField = error.field === "changedOn" ? "changedOn" : "status";
      return { fieldErrors: { [field]: [error.message] }, values, submitId };
    }
    console.error("Change status failed", error);
    return { message: "We could not save the status change. Try again in a moment.", values, submitId };
  }

  refresh();
  return { submitId, saved: true };
}

export type EditApplicationState = {
  fieldErrors?: ApplicationFieldErrors;
  message?: string;
  values?: ApplicationFormValues;
  submitId?: number;
  saved?: boolean;
};

/** US04-4: edits the six fields with the same validation as US02. */
export async function updateApplicationAction(
  id: string,
  prev: EditApplicationState,
  formData: FormData,
): Promise<EditApplicationState> {
  const user = await requireArea("student");
  const today = lisbonToday(new Date());
  const submitId = (prev.submitId ?? 0) + 1;

  const parsed = parseApplicationForm(formData, today);
  const { values } = parsed;
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values, submitId };

  try {
    await updateApplication(user, id, parsed.data, today);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    if (error instanceof ValidationError && error.field === "dateSent") {
      return { fieldErrors: { dateSent: [error.message] }, values, submitId };
    }
    console.error("Update application failed", error);
    return { message: "We could not save your changes. Try again in a moment.", values, submitId };
  }

  refresh();
  return { values, submitId, saved: true };
}

export type DeleteApplicationState = { message?: string };

/** US04-5: deletes the application (after the confirmation step) and returns to the pipeline. */
export async function deleteApplicationAction(id: string): Promise<DeleteApplicationState> {
  const user = await requireArea("student");
  try {
    await deleteApplication(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    console.error("Delete application failed", error);
    return { message: "We could not delete the application. Try again in a moment." };
  }
  redirect("/pipeline");
}
