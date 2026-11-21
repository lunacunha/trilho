import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { linkClass } from "@/components/form-field";
import { ResendForm } from "./resend-form";

export const metadata: Metadata = { title: "Verify your email · Trilho" };

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-10">
      <Suspense fallback={<h1 className="mb-4 text-2xl font-semibold">Check your inbox to verify your email</h1>}>
        <VerifyEmailContent searchParams={searchParams} />
      </Suspense>
      <p className="mt-6 text-sm">
        Already verified?{" "}
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
      </p>
    </main>
  );
}

async function VerifyEmailContent({ searchParams }: Pick<PageProps<"/verify-email">, "searchParams">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const linkFailed = typeof params.error === "string";
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">
        {linkFailed ? "This verification link is invalid or has expired" : "Check your inbox to verify your email"}
      </h1>
      <p className="mb-6 text-zinc-700">
        {linkFailed
          ? "Enter your university email to get a new link."
          : "We sent you a link. Open it to verify your email, then you can start using Trilho. Didn't get it? Check your spam folder or send it again."}
      </p>
      <ResendForm email={email} />
    </>
  );
}
