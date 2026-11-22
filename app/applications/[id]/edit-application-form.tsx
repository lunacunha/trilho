"use client";

import { useActionState } from "react";
import { ApplicationFields } from "@/components/application-fields";
import { buttonClass } from "@/components/form-field";
import type { ApplicationFormValues } from "../application-form";
import type { EditApplicationState } from "./actions";

type Props = {
  today: string;
  initialValues: ApplicationFormValues;
  action: (prev: EditApplicationState, formData: FormData) => Promise<EditApplicationState>;
};

/** US04-4: the same six fields and validation as /applications/new. */
export function EditApplicationForm({ today, initialValues, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form key={state.submitId ?? 0} action={formAction} className="flex flex-col gap-4" noValidate>
      <ApplicationFields today={today} values={state.values ?? initialValues} errors={state.fieldErrors} />
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-success">
          Changes saved.
        </p>
      )}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
