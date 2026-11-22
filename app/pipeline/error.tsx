"use client"; // Error boundaries must be Client Components

import { buttonClass } from "@/components/form-field";

// Technical details are logged on the server; the student only sees what to do next.
export default function PipelineError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Pipeline</h1>
      <p role="alert" className="mb-4 text-fg-muted">
        We could not load your pipeline. Check your connection and try again.
      </p>
      <button type="button" className={buttonClass} onClick={() => retry()}>
        Try again
      </button>
    </main>
  );
}
