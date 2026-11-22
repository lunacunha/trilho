import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { buttonClass } from "@/components/form-field";
import { PIPELINE_COLUMNS, type PipelineColumn } from "@/lib/fixed-lists";
import { lisbonToday } from "@/lib/rules/dates";
import { getPipeline } from "@/lib/services/applications";
import type { PipelineCard } from "@/lib/services/types";
import { requireArea } from "@/lib/session";
import { reminderAction } from "./actions";
import { ReminderActions } from "./reminder-actions";

export const metadata: Metadata = { title: "Pipeline · Trilho" };

const COLUMN_LABELS: Record<PipelineColumn, string> = {
  sent: "Sent",
  in_process: "In process",
  interview: "Interview",
  offer: "Offer",
  closed: "Closed",
};

// S1 · US03, US05
export default function PipelinePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <Suspense fallback={<p>Loading…</p>}>
        <PipelineContent />
      </Suspense>
    </main>
  );
}

async function PipelineContent() {
  const user = await requireArea("student");
  await connection(); // "today" is per request; R5 runs on every load
  const { columns } = await getPipeline(user, lisbonToday(new Date()));
  const total = PIPELINE_COLUMNS.reduce((sum, c) => sum + columns[c].length, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        {total > 0 && (
          <Link href="/applications/new" className={buttonClass}>
            + New application
          </Link>
        )}
      </div>

      {total === 0 ? (
        <section className="rounded border border-zinc-300 p-6 text-center">
          <p className="mb-4 text-zinc-700">You have not logged any applications yet.</p>
          <Link href="/applications/new" className={buttonClass}>
            Log your first application
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PIPELINE_COLUMNS.map((column) => (
            <section key={column} aria-labelledby={`column-${column}`} className="rounded bg-zinc-100 p-3">
              <h2 id={`column-${column}`} className="mb-3 font-semibold">
                {COLUMN_LABELS[column]} ({columns[column].length})
              </h2>
              {columns[column].length > 0 && (
                <ul className="flex flex-col gap-2">
                  {columns[column].map((card) => (
                    <li key={card.id}>
                      <ApplicationCard card={card} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}

function ApplicationCard({ card }: { card: PipelineCard }) {
  // A div, not a link: the reminder buttons cannot sit inside a link
  return (
    <div className="rounded border border-zinc-300 bg-white p-3 focus-within:border-blue-700 hover:border-blue-700">
      <Link
        href={`/applications/${card.id}`}
        className="block rounded focus:outline-2 focus:outline-offset-2 focus:outline-blue-600"
      >
        <p className="font-medium">{card.companyName}</p>
        <p className="text-sm text-zinc-700">{card.roleTitle}</p>
        <p className="mt-1 text-sm text-zinc-600">
          {card.daysSinceSent} {card.daysSinceSent === 1 ? "day" : "days"}
        </p>
        {card.status === "rejected" && <p className="mt-1 text-sm font-medium text-red-800">Rejected</p>}
        {card.status === "no_response" && <p className="mt-1 text-sm font-medium text-zinc-700">No response</p>}
      </Link>
      {card.reminder && (
        <ReminderActions
          daysQuiet={card.reminder.daysQuiet}
          context={`${card.companyName}, ${card.roleTitle}`}
          action={reminderAction.bind(null, card.id)}
        />
      )}
    </div>
  );
}
