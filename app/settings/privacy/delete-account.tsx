"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { dangerButtonClass, secondaryButtonClass } from "@/components/form-field";
import { deleteMyAccount, type PrivacyActionState } from "./actions";

const initialState: PrivacyActionState = {};

/** US08-3: "Delete my account" opens a confirmation step that lists what will be deleted. */
export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(deleteMyAccount, initialState);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Move focus into the panel when it opens, and back to the button when it closes.
  useEffect(() => {
    if (confirming) headingRef.current?.focus();
    else if (wasConfirming.current) openButtonRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  if (!confirming) {
    return (
      <button ref={openButtonRef} type="button" className={dangerButtonClass} onClick={() => setConfirming(true)}>
        Delete my account
      </button>
    );
  }

  return (
    <div className="rounded border border-danger bg-danger-bg p-4">
      <h3 ref={headingRef} tabIndex={-1} className="mb-2 font-semibold focus:outline-2 focus:outline-danger">
        Delete your account?
      </h3>
      <p className="mb-2 text-sm">This permanently deletes:</p>
      <ul className="mb-3 list-disc pl-5 text-sm">
        <li>your account and login</li>
        <li>all your applications</li>
        <li>their status history</li>
        <li>your reactions to follow-up reminders</li>
        <li>your usage events</li>
      </ul>
      <p className="mb-4 text-sm">This cannot be undone. You will be logged out.</p>
      <form action={formAction} className="flex flex-wrap gap-3">
        <button type="submit" className={dangerButtonClass} disabled={pending}>
          {pending ? "Deleting…" : "Yes, delete my account"}
        </button>
        <button type="button" className={secondaryButtonClass} disabled={pending} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      )}
    </div>
  );
}
