import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { linkClass } from "@/components/form-field";
import { getCompanyPage } from "@/lib/services/companies";
import { NotFoundError } from "@/lib/services/errors";
import type { CompanyPage } from "@/lib/services/types";
import { requireArea } from "@/lib/session";

export const metadata: Metadata = { title: "Company · Trilho" };

type Props = { params: Promise<{ id: string }> };

// S4 · US06. Only the name and the typical response time: no rates, rankings,
// comparisons or individual data (US06-5).
export default function CompanyPageRoute({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="mb-2 text-sm">
        <Link href="/pipeline" className={linkClass}>
          ← Pipeline
        </Link>
      </p>
      <Suspense fallback={<p>Loading…</p>}>
        <CompanyContent params={params} />
      </Suspense>
    </main>
  );
}

async function CompanyContent({ params }: Props) {
  const user = await requireArea("student");
  await connection(); // statistics are calculated on every request (decision 026)
  const { id } = await params;

  let page: CompanyPage;
  try {
    page = await getCompanyPage(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">{page.name}</h1>
      <section aria-labelledby="response-time" className="rounded border border-zinc-300 p-4">
        <h2 id="response-time" className="sr-only">
          Response time
        </h2>
        {page.statistic ? (
          <>
            <p className="text-lg">
              Typical response time: <strong>{page.statistic.label}</strong>
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              Median-based range · based on {page.statistic.basedOn} student applications
            </p>
          </>
        ) : (
          <p className="text-lg">Not enough data yet</p>
        )}
      </section>
    </>
  );
}
