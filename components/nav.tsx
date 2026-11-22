// Header navigation by role. Reads the session, so it renders inside <Suspense>.
import { signOut } from "@/app/actions";
import { NavLinks, navItemClass } from "@/components/nav-links";
import { getCurrentUser } from "@/lib/session";

const LINKS = {
  student: [
    { href: "/pipeline", label: "Pipeline", also: ["/applications", "/companies"] },
    { href: "/settings/privacy", label: "Privacy" },
  ],
  career_service: [{ href: "/admin/overview", label: "Dashboard" }],
} as const;

export async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <nav aria-label="Main" className="flex flex-wrap items-center gap-2 text-sm">
      <NavLinks links={LINKS[user.role]} />
      <form action={signOut}>
        <button type="submit" className={navItemClass}>
          Sign out
        </button>
      </form>
    </nav>
  );
}
