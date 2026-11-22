import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { linkClass } from "@/components/form-field";
import { STATUS_LABELS } from "@/lib/fixed-lists";
import { formatDisplayDate, lisbonToday } from "@/lib/rules/dates";
import { getApplication } from "@/lib/services/applications";
import { NotFoundError } from "@/lib/services/errors";
import type { ApplicationDetail } from "@/lib/services/types";
import { requireArea } from "@/lib/session";
import { changeStatusAction, deleteApplicationAction, updateApplicationAction } from "./actions";
import { DeleteApplication } from "./delete-application";
import { EditApplicationForm } from "./edit-application-form";
import { StatusChangeForm } from "./status-change-form";

export const metadata: Metadata = { title: "Application · Trilho" };

type Props = { params: Promise<{ id: string }> };

// S3 · US04
export default function ApplicationPage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="mb-2 text-sm">
        <Link href="/pipeline" className={linkClass}>
          ← Pipeline
        </Link>
      </p>
      <Suspense fallback={<p>Loading…</p>}>
        <ApplicationContent params={params} />
      </Suspense>
    </main>
  );
}

async function ApplicationContent({ params }: Props) {
  const user = await requireArea("student");
  await connection(); // "today" is per request
  const { id } = await params;
  const today = lisbonToday(new Date());

  let detail: ApplicationDetail;
  try {
    detail = await getApplication(user, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound(); // US03-3: same page for missing and foreign ids
    throw error;
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">
          <Link href={`/companies/${detail.company.id}`} className={linkClass}>
            {detail.company.name}
          </Link>
        </h1>
        <p className="text-lg">{detail.roleTitle}</p>
        {/* T3 (docs/ux-review.md): say where the response time is, not only link the name */}
        <p className="mt-1 text-sm">
          <Link href={`/companies/${detail.company.id}`} className={linkClass}>
            How long does {detail.company.name} usually take to reply?
          </Link>
        </p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-600">Status</dt>
          <dd className="font-medium">{STATUS_LABELS[detail.currentStatus]}</dd>
          <dt className="text-zinc-600">Sector</dt>
          <dd>{detail.sector}</dd>
          <dt className="text-zinc-600">Channel</dt>
          <dd>{detail.channel}</dd>
          <dt className="text-zinc-600">Job type</dt>
          <dd>{detail.jobType}</dd>
          <dt className="text-zinc-600">Date sent</dt>
          <dd>{formatDisplayDate(detail.dateSent)}</dd>
        </dl>
      </header>

      <section aria-labelledby="change-status" className="mb-8">
        <h2 id="change-status" className="mb-3 text-lg font-semibold">
          Change status
        </h2>
        <StatusChangeForm
          today={today}
          currentStatus={detail.currentStatus}
          action={changeStatusAction.bind(null, detail.id)}
        />
      </section>

      <section aria-labelledby="history" className="mb-8">
        <h2 id="history" className="mb-3 text-lg font-semibold">
          History
        </h2>
        <ol className="flex flex-col gap-2">
          {detail.history.map((entry, i) => (
            <li key={i} className="rounded border border-zinc-300 p-3">
              <p className="font-medium">
                {STATUS_LABELS[entry.status]}
                {entry.isAutomatic && <span className="ml-2 text-sm font-normal text-zinc-600">(automatic)</span>}
              </p>
              <p className="text-sm text-zinc-700">
                {formatDisplayDate(entry.changedOn)} · after {entry.daysAfterSent}{" "}
                {entry.daysAfterSent === 1 ? "day" : "days"}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="edit" className="mb-8">
        <details>
          <summary id="edit" className="cursor-pointer text-lg font-semibold">
            Edit application
          </summary>
          <div className="mt-4">
            <EditApplicationForm
              today={today}
              initialValues={{
                company: detail.company.name,
                roleTitle: detail.roleTitle,
                sector: detail.sector,
                channel: detail.channel,
                jobType: detail.jobType,
                dateSent: detail.dateSent,
              }}
              action={updateApplicationAction.bind(null, detail.id)}
            />
          </div>
        </details>
      </section>

      <section aria-labelledby="delete">
        <h2 id="delete" className="sr-only">
          Delete
        </h2>
        <DeleteApplication action={deleteApplicationAction.bind(null, detail.id)} />
      </section>
    </>
  );
}
