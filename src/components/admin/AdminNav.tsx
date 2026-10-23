"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TOURNAMENT_SECTIONS = [
  { href: "/admin?section=local", section: "local", label: "Local" },
  { href: "/admin?section=lithuania", section: "lithuania", label: "Lithuania" },
  { href: "/admin?section=baltics", section: "baltics", label: "Baltics" },
  { href: "/admin?section=itf", section: "itf", label: "ITF" },
  { href: "/admin?section=all", section: "all", label: "All" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onTournamentList = pathname === "/admin";
  const section = searchParams.get("section") || "local";
  const onEditOrNew = pathname.startsWith("/admin/") && pathname !== "/admin/facebook" && pathname !== "/admin/facebook-catch";

  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/admin?section=local" className="text-lg font-bold">
          PlayTennis admin
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/admin/new" className={linkClass(pathname === "/admin/new")}>
            New tournament
          </Link>
          <Link href="/admin/facebook" className={linkClass(pathname.startsWith("/admin/facebook"))}>
            Facebook import
          </Link>
          <Link href="/lt" className="text-foreground/70 hover:text-accent">
            View site
          </Link>
        </nav>
      </div>

      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-6 pb-4">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-foreground/50">Tournaments</span>
        {TOURNAMENT_SECTIONS.map((item) => {
          const active = onTournamentList && section === item.section;
          return (
            <Link
              key={item.section}
              href={item.href}
              className={
                active
                  ? "rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[#0f172a]"
                  : "rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground/75 hover:border-accent"
              }
            >
              {item.label}
            </Link>
          );
        })}
        {onEditOrNew ? (
          <span className="ml-1 text-xs text-foreground/50">{pathname === "/admin/new" ? "Creating" : "Editing"}</span>
        ) : null}
      </div>
    </div>
  );
}

function linkClass(active: boolean) {
  return active ? "text-accent" : "text-foreground/80 hover:text-accent";
}
