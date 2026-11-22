"use client";

import { useActionState } from "react";
import { buttonClass, FormField } from "@/components/form-field";
import { resendVerification, type ResendState } from "./actions";

export function ResendForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(resendVerification, { email } satisfies ResendState);
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormField id="email" label="University email" type="email" autoComplete="email" placeholder="up20XXXXXXX@up.pt" defaultValue={state.email} />
      <div aria-live="polite" className="text-sm">
        {state.message && <p className="text-success">{state.message}</p>}
        {state.error && <p className="text-danger">{state.error}</p>}
      </div>
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Sending…" : "Resend verification email"}
      </button>
    </form>
  );
}
