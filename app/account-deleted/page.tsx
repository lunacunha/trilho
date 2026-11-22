import type { Metadata } from "next";
import Link from "next/link";
import { linkClass } from "@/components/form-field";

export const metadata: Metadata = { title: "Account deleted · Trilho" };

// US08-3: shown after the account is deleted and the user is logged out. Public on purpose.
export default function AccountDeletedPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Your account and data were deleted</h1>
      <p className="mb-6 text-zinc-700">
        Your applications, their history, your reminder reactions and your usage events are gone.
      </p>
      <p className="flex flex-wrap gap-4">
        <Link href="/register" className={linkClass}>
          Create a new account
        </Link>
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </main>
  );
}
