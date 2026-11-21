import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard · Trilho" };

// Placeholder until US07: only the heading, so the redirects of US01 work.
export default function AdminOverviewPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Career Service dashboard</h1>
    </main>
  );
}
