import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, homePathFor } from "@/lib/session";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "Your privacy · Trilho" };

export default function ConsentPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Your privacy</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <ConsentGate />
      </Suspense>
    </main>
  );
}

/** Only students who have not answered yet see the question (US01-4, US01-7). */
async function ConsentGate() {
  const user = await getCurrentUser();
  if (!user || user.role !== "student" || user.consent !== null) redirect(homePathFor(user));
  return (
    <>
      <p className="mb-6 text-fg-muted">
        Trilho shows students how long companies take to reply, using anonymous data from students who agree to
        share. Your name and individual applications are never shown to anyone.
      </p>
      <ConsentForm />
    </>
  );
}
