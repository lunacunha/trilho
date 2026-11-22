import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChannelChart } from "@/components/channel-chart";
import { lisbonToday } from "@/lib/rules/dates";
import { getDashboard } from "@/lib/services/dashboard";
import { AccessDeniedError } from "@/lib/services/errors";
import type { Dashboard, DashboardRow } from "@/lib/services/types";
import { requireArea } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard · Trilho" };

// S5 · US07. Aggregated, anonymous data only: no names, emails or per-student rows (US07-4).
export default function AdminOverviewPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Career Service dashboard</h1>
      <p className="mb-8 text-sm text-zinc-700">
        Only students who consented are counted. Companies and channels with fewer than 5 applications are hidden.
      </p>
      <Suspense fallback={<p>Loading…</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

const percent = (rate: number) => `${Math.round(rate * 100)}%`;
const days = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)} days`;

async function DashboardContent() {
  const user = await requireArea("career_service");
  await connection(); // calculated on every request; consent changes apply immediately

  let dashboard: Dashboard;
  try {
    dashboard = await getDashboard(user, lisbonToday(new Date()));
  } catch (error) {
    if (error instanceof AccessDeniedError) redirect("/access-denied");
    throw error;
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="indicators">
        <h2 id="indicators" className="sr-only">
          Indicators
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Indicator label="Active students" value={String(dashboard.activeStudents)} hint="Last 30 days" />
          <Indicator
            label="Median time to first reply"
            value={dashboard.medianDaysToFirstReply === null ? "Not enough data yet" : days(dashboard.medianDaysToFirstReply)}
          />
        </dl>
      </section>

      <section aria-labelledby="companies">
        <h2 id="companies" className="mb-3 text-xl font-semibold">
          Companies
        </h2>
        <RateTable
          caption="Applications and reply rate per company, by number of applications"
          firstColumn="Company"
          rows={dashboard.companies}
          empty="No company has 5 or more applications yet."
        />
      </section>

      <section aria-labelledby="channels">
        <h2 id="channels" className="mb-3 text-xl font-semibold">
          Channel comparison
        </h2>
        {dashboard.channels.length > 0 && (
          <div className="mb-4">
            <ChannelChart rows={dashboard.channels} />
          </div>
        )}
        <RateTable
          caption="Applications and reply rate per channel"
          firstColumn="Channel"
          rows={dashboard.channels}
          empty="No channel has 5 or more applications yet."
        />
      </section>
    </div>
  );
}

function Indicator({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded border border-zinc-300 p-4">
      <dt className="text-sm text-zinc-700">{label}</dt>
      <dd className="mt-1 text-3xl font-semibold">{value}</dd>
      {hint && <dd className="text-sm text-zinc-700">{hint}</dd>}
    </div>
  );
}

function RateTable({
  caption,
  firstColumn,
  rows,
  empty,
}: {
  caption: string;
  firstColumn: string;
  rows: DashboardRow[];
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-zinc-700">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-zinc-300">
            <th scope="col" className="py-2 pr-4">
              {firstColumn}
            </th>
            <th scope="col" className="py-2 pr-4 text-right">
              Applications
            </th>
            <th scope="col" className="py-2 text-right">
              Reply rate
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-zinc-200">
              <th scope="row" className="py-2 pr-4 font-normal">
                {row.name}
              </th>
              <td className="py-2 pr-4 text-right">{row.applications}</td>
              <td className="py-2 text-right">{percent(row.replyRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
