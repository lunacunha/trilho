import type { Metadata } from "next";
import { Suspense } from "react";
import { requireArea } from "@/lib/session";

export const metadata: Metadata = { title: "Pipeline · Trilho" };

// Placeholder until US03: only the heading, so the redirects of US01 work.
export default function PipelinePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Suspense fallback={<p>Loading…</p>}>
        <PipelineContent />
      </Suspense>
    </main>
  );
}

async function PipelineContent() {
  await requireArea("student");
  return <h1 className="text-2xl font-semibold">Pipeline</h1>;
}
