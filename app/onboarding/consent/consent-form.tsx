"use client";

import { useActionState } from "react";
import { buttonClass } from "@/components/form-field";
import { chooseConsent, type ConsentState } from "./actions";

const initialState: ConsentState = {};

const OPTIONS = [
  {
    value: "share",
    label: "Share anonymously",
    description:
      "Your applications count, without your name, in company response times and the Career Service statistics.",
  },
  {
    value: "dont_share",
    label: "Don't share",
    description: "Your applications are only visible to you and never enter any statistic.",
  },
] as const;

export function ConsentForm() {
  const [state, formAction, pending] = useActionState(chooseConsent, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3" aria-describedby={state.error ? "consent-error" : undefined}>
        <legend className="mb-2 font-medium">Do you want to share your data anonymously?</legend>
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer gap-3 rounded border border-border-subtle p-3 has-[:checked]:border-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
          >
            {/* No defaultChecked: neither option is pre-selected (US01-4) */}
            <input type="radio" name="consent" value={o.value} required className="mt-1" />
            <span>
              <span className="block font-medium">{o.label}</span>
              <span className="block text-sm text-fg-muted">{o.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {state.error && (
        <p id="consent-error" role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <p className="text-sm text-fg-muted">You can change this later in Privacy settings.</p>
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
