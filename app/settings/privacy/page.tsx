import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { formatDisplayDate, lisbonToday } from "@/lib/rules/dates";
import { getConsent } from "@/lib/services/consent";
import { requireArea } from "@/lib/session";
import { ConsentToggle } from "./consent-toggle";
import { DeleteAccount } from "./delete-account";

export const metadata: Metadata = { title: "Privacy settings · Trilho" };

// US08
export default function PrivacySettingsPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Privacy settings</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <PrivacyContent />
      </Suspense>
    </main>
  );
}

async function PrivacyContent() {
  const user = await requireArea("student");
  await connection(); // the current choice is read on every request
  const { consent, updatedAt } = await getConsent(user);
  const sharing = consent === true;

  return (
    <>
      <section aria-labelledby="consent-heading" className="mb-10">
        <h2 id="consent-heading" className="mb-2 text-lg font-semibold">
          Anonymous sharing
        </h2>
        <p className="mb-4">
          <span className="font-medium">{sharing ? "Sharing anonymously" : "Not sharing"}</span>
          {updatedAt && <span className="text-fg-muted"> · since {formatDisplayDate(lisbonToday(updatedAt))}</span>}
        </p>
        <ConsentToggle sharing={sharing} />
      </section>

      <section aria-labelledby="delete-heading">
        <h2 id="delete-heading" className="mb-2 text-lg font-semibold">
          Delete my account
        </h2>
        <p className="mb-4 text-sm text-fg-muted">Removes your account and all your data from Trilho.</p>
        <DeleteAccount />
      </section>
    </>
  );
}
