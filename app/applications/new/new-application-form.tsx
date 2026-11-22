"use client";

import { useActionState, useEffect, useRef } from "react";
import { ApplicationFields } from "@/components/application-fields";
import { buttonClass } from "@/components/form-field";
import { createApplicationAction, formOpenedAction, type NewApplicationState } from "./actions";

const initialState: NewApplicationState = {};

type Props = { today: string; formSessionId: string };

export function NewApplicationForm({ today, formSessionId }: Props) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialState);

  // SPEC §9: record application_form_opened once, when the form is actually shown
  // (not during a prefetch). The ref guards against React Strict Mode's double effect.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void formOpenedAction(formSessionId).catch(() => {});
  }, [formSessionId]);

  return (
    // The key remounts the fields after a failed submit, so they show the values typed (US02-2)
    <form key={state.submitId ?? 0} action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="form_session_id" value={formSessionId} />
      <ApplicationFields today={today} values={state.values} errors={state.fieldErrors} />
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : "Save application"}
      </button>
    </form>
  );
}
