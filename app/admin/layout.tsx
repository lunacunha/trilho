import { Suspense } from "react";
import { requireArea } from "@/lib/session";

/** Every /admin page is for career_service only (US07-1). Services check the role again. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="px-4 py-10">Loading…</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireArea("career_service");
  return <>{children}</>;
}
