"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavCounts = {
  tournaments: number;
  needsReview: number;
};

type NavItem = {
  href: string;
  label: string;
  match: "tournaments" | "review" | "sources" | "activity";
  countKey?: keyof AdminNavCounts;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Tournaments", match: "tournaments", countKey: "tournaments" },
  { href: "/admin/review", label: "Review queue", match: "review", countKey: "needsReview" },
  { href: "/admin/sources", label: "Sources", match: "sources" },
  { href: "/admin/activity", label: "Activity", match: "activity" },
];

export default function AdminSidebar({ counts }: { counts: AdminNavCounts }) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar flex w-full flex-col border-b border-white/10 bg-[#0d2818] text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:border-b-0 lg:border-r lg:border-white/10">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c8ff00] text-sm font-black text-[#0d2818]">
          ●
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight">playtennis.lt</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Owner workspace</p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
        {NAV.map((item) => {
          const active = isActive(pathname, item.match);
          const count = item.countKey ? counts[item.countKey] : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center justify-between gap-2 rounded-md bg-[#c8ff00] px-3 py-2 text-sm font-semibold text-[#0d2818]"
                  : "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/8 hover:text-white"
              }
            >
              <span>{item.label}</span>
              {count != null ? (
                <span
                  className={
                    active
                      ? "rounded-full bg-[#0d2818]/15 px-2 py-0.5 text-[11px] font-bold tabular-nums"
                      : "rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/80"
                  }
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-3 border-t border-white/10 px-5 py-5 lg:block">
        <p className="text-xs leading-relaxed text-white/55">Built by a tennis player, for tennis players.</p>
        <Link href="/lt" className="inline-flex items-center gap-1 text-sm font-semibold text-[#c8ff00] hover:underline">
          ← Back to calendar
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">Private · owner access</p>
      </div>
    </aside>
  );
}

function isActive(pathname: string, match: NavItem["match"]) {
  if (match === "tournaments") {
    return (
      pathname === "/admin" ||
      pathname === "/admin/new" ||
      (/^\/admin\/[^/]+$/.test(pathname) &&
        pathname !== "/admin/review" &&
        pathname !== "/admin/sources" &&
        pathname !== "/admin/activity" &&
        pathname !== "/admin/facebook" &&
        pathname !== "/admin/facebook-catch")
    );
  }
  if (match === "review") return pathname.startsWith("/admin/review");
  if (match === "sources") {
    return pathname.startsWith("/admin/sources") || pathname.startsWith("/admin/facebook");
  }
  if (match === "activity") return pathname.startsWith("/admin/activity");
  return false;
}
