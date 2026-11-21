// Header navigation by role. Reads the session, so it renders inside <Suspense>.
import Link from "next/link";
import { signOut } from "@/app/actions";
import { getCurrentUser } from "@/lib/session";

const LINKS = {
  student: [
    { href: "/pipeline", label: "Pipeline" },
    { href: "/settings/privacy", label: "Privacy" },
  ],
  career_service: [{ href: "/admin/overview", label: "Dashboard" }],
} as const;

const itemClass = "rounded px-2 py-1 hover:bg-zinc-100 focus:outline-2 focus:outline-blue-600";

export async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-2 text-sm">
      {LINKS[user.role].map((l) => (
        <Link key={l.href} href={l.href} className={itemClass}>
          {l.label}
        </Link>
      ))}
      <form action={signOut}>
        <button type="submit" className={itemClass}>
          Sign out
        </button>
      </form>
    </nav>
  );
}
