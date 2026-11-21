"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass, FormField, linkClass } from "@/components/form-field";
import { register, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <FormField id="name" label="Name" autoComplete="name" defaultValue={state.values?.name} errors={state.fieldErrors?.name} />
      <FormField
        id="email"
        label="University email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        hint="@up.pt or @fe.up.pt"
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        errors={state.fieldErrors?.password}
        hint="At least 8 characters"
      />
      {state.message && (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      )}
      <button type="submit" className={buttonClass} disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </form>
  );
}
