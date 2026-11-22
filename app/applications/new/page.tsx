import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { randomUUID } from "node:crypto";
import { Suspense } from "react";
import { linkClass } from "@/components/form-field";
import { lisbonToday } from "@/lib/rules/dates";
import { requireArea } from "@/lib/session";
import { NewApplicationForm } from "./new-application-form";

export const metadata: Metadata = { title: "New application · Trilho" };

// S2 · US02
export default function NewApplicationPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <p className="mb-2 text-sm">
        <Link href="/pipeline" className={linkClass}>
          ← Pipeline
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-semibold">New application</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <NewApplicationContent />
      </Suspense>
    </main>
  );
}

async function NewApplicationContent() {
  await requireArea("student");
  await connection(); // per-request values below: today and the form session id
  return <NewApplicationForm today={lisbonToday(new Date())} formSessionId={randomUUID()} />;
}
