"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { DeleteApplicationState } from "./actions";

type Props = { action: () => Promise<DeleteApplicationState> };

const dangerClass =
  "rounded bg-red-700 px-4 py-2 font-medium text-white hover:bg-red-800 focus:outline-2 focus:outline-offset-2 focus:outline-red-600 disabled:opacity-60";
const secondaryClass =
  "rounded border border-zinc-500 bg-white px-4 py-2 font-medium hover:bg-zinc-100 focus:outline-2 focus:outline-offset-2 focus:outline-blue-600";

/** US04-5: "Delete" asks for confirmation; Cancel changes nothing. */
export function DeleteApplication({ action }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);

  // Keyboard users land on the safe choice when the step opens, and back on "Delete" when it closes
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
    else if (opened.current) deleteRef.current?.focus();
    opened.current = confirming || opened.current;
  }, [confirming]);

  if (!confirming) {
    return (
      <button ref={deleteRef} type="button" className={dangerClass} onClick={() => setConfirming(true)}>
        Delete application
      </button>
    );
  }

  return (
    <form action={formAction} role="group" aria-labelledby="delete-question" className="flex flex-col gap-3">
      <p id="delete-question" className="font-medium">
        Delete this application and its history? This cannot be undone.
      </p>
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className={dangerClass} disabled={pending}>
          {pending ? "Deleting…" : "Yes, delete"}
        </button>
        <button ref={cancelRef} type="button" className={secondaryClass} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
