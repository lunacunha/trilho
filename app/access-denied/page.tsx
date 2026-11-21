import type { Metadata } from "next";
import Link from "next/link";
import { linkClass } from "@/components/form-field";

export const metadata: Metadata = { title: "Access denied · Trilho" };

export default function AccessDeniedPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <h1 className="mb-4 text-2xl font-semibold">Access denied</h1>
      <p className="mb-6 text-zinc-700">Your account cannot open this page.</p>
      <Link href="/" className={linkClass}>
        Go to your home page
      </Link>
    </main>
  );
}
