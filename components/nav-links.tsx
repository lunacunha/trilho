"use client";
// Header links with the current page highlighted in green (mockup S1).
import Link from "next/link";
import { usePathname } from "next/navigation";

export const navItemClass =
  "rounded px-2 py-1 font-medium text-fg-muted hover:bg-surface-muted hover:text-fg focus:outline-2 focus:outline-focus";

type NavLink = { href: string; label: string; /** Other sections that belong to this item. */ also?: readonly string[] };

const within = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

export function NavLinks({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname();
  return links.map((l) => {
    const active = [l.href, ...(l.also ?? [])].some((base) => within(pathname, base));
    return (
      <Link
        key={l.href}
        href={l.href}
        aria-current={active ? "page" : undefined}
        className={`${navItemClass} aria-[current=page]:font-semibold aria-[current=page]:text-primary`}
      >
        {l.label}
      </Link>
    );
  });
}
