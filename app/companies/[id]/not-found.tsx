import Link from "next/link";
import { linkClass } from "@/components/form-field";

// §10: shown for a company that does not exist.
export default function CompanyNotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Not found</h1>
      <p className="mb-4 text-fg-muted">We could not find this company.</p>
      <Link href="/pipeline" className={linkClass}>
        Back to your pipeline
      </Link>
    </main>
  );
}
