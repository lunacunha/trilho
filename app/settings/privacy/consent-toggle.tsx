"use client";

import { useActionState } from "react";
import { buttonClass } from "@/components/form-field";
import { changeConsent, type PrivacyActionState } from "./actions";

const initialState: PrivacyActionState = {};

export function ConsentToggle({ sharing }: { sharing: boolean }) {
  const [state, formAction, pending] = useActionState(changeConsent, initialState);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="consent" value={sharing ? "dont_share" : "share"} />
      <p id="consent-change-help" className="text-sm text-zinc-700">
        {sharing
          ? "Your applications will stop counting in company response times and Career Service statistics right away."
          : "Your applications will count, without your name, in company response times and Career Service statistics."}
      </p>
      <button type="submit" className={buttonClass} disabled={pending} aria-describedby="consent-change-help">
        {pending ? "Saving…" : sharing ? "Withdraw consent" : "Share anonymously"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
