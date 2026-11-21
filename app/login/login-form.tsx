"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass, FormField, linkClass } from "@/components/form-field";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormField id="email" label="University email" type="email" autoComplete="email" defaultValue={state.email} />
      <FormField id="password" label="Password" type="password" autoComplete="current-password" />
      {state.message && (
        <div role="alert" className="text-sm text-red-700">
          <p>{state.message}</p>
          {state.unverifiedEmail && (
            <p className="mt-1">
              <Link
                href={`/verify-email?email=${encodeURIComponent(state.unverifiedEmail)}`}
                className={linkClass}
              >
                Resend the verification email
              </Link>
            </p>
          )}
        </div>
      )}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-sm">
        New to Trilho?{" "}
        <Link href="/register" className={linkClass}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
