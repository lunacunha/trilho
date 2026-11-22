"use client";

import { useActionState } from "react";
import type { ReminderActionState } from "./actions";

type Props = {
  daysQuiet: number;
  /** Company and role, so each button has a unique accessible name. */
  context: string;
  action: (prev: ReminderActionState, formData: FormData) => Promise<ReminderActionState>;
};

const buttonClass =
  "rounded border border-zinc-500 bg-white px-2 py-1 text-sm font-medium hover:bg-zinc-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 disabled:opacity-60";

/** US05-1/5/6: "N days · Follow up?" with "Follow-up done" and "Dismiss". */
export function ReminderActions({ daysQuiet, context, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-2 border-t border-zinc-200 pt-2">
      <p className="text-sm font-medium text-amber-900">
        {daysQuiet} {daysQuiet === 1 ? "day" : "days"} · Follow up?
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="submit"
          name="outcome"
          value="followup_done"
          className={buttonClass}
          disabled={pending}
          aria-label={`Follow-up done: ${context}`}
        >
          Follow-up done
        </button>
        <button
          type="submit"
          name="outcome"
          value="dismissed"
          className={buttonClass}
          disabled={pending}
          aria-label={`Dismiss reminder: ${context}`}
        >
          Dismiss
        </button>
      </div>
      <p aria-live="polite" className="mt-1 text-sm text-red-700">
        {state.message}
      </p>
    </form>
  );
}
