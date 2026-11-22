"use client";

import { useActionState } from "react";
import { buttonClass, FormField, SelectField } from "@/components/form-field";
import { MANUAL_STATUSES, STATUS_LABELS } from "@/lib/fixed-lists";
import type { ApplicationStatus } from "@/db/schema";
import type { StatusChangeState } from "./actions";

type Props = {
  today: string;
  currentStatus: ApplicationStatus;
  action: (prev: StatusChangeState, formData: FormData) => Promise<StatusChangeState>;
};

/** US04-2: manual statuses only (never "No response"). The current one is marked; choosing it is rejected (R6). */
export function StatusChangeForm({ today, currentStatus, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const options = MANUAL_STATUSES.map((value) => ({
    value,
    label: value === currentStatus ? `${STATUS_LABELS[value]} (current)` : STATUS_LABELS[value],
  }));

  return (
    <form key={state.submitId ?? 0} action={formAction} className="flex flex-col gap-4" noValidate>
      <SelectField
        id="status"
        label="New status"
        options={options}
        placeholder="Choose a status"
        defaultValue={state.values?.status}
        errors={state.fieldErrors?.status}
      />
      <FormField
        id="changedOn"
        label="Date of the change"
        type="date"
        max={today}
        hint="Change it only if the reply came on another day."
        defaultValue={state.values?.changedOn ?? today}
        errors={state.fieldErrors?.changedOn}
      />
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-green-800">
          Status updated.
        </p>
      )}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : "Change status"}
      </button>
    </form>
  );
}
