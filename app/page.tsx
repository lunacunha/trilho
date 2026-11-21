import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser, homePathFor } from "@/lib/session";

/** "/" only routes: login, consent, pipeline or dashboard. */
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p className="px-4 py-10">Loading…</p>}>
      <HomeRedirect searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeRedirect({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  // Better Auth sends a failed verification link (expired or invalid token) back here with ?error=
  const { error } = await searchParams;
  if (typeof error === "string") redirect("/verify-email?error=invalid_link");
  redirect(homePathFor(await getCurrentUser()));
  return null;
}
