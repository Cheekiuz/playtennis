import type { Metadata } from "next";
import { headers } from "next/headers";
import AdminShell from "@/components/admin/AdminShell";
import { getSessionUser } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/tournaments/admin";
import { getAdminTournamentStats } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | PlayTennis.lt",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [stats, user, headerStore] = await Promise.all([getAdminTournamentStats(), getSessionUser(), headers()]);
  const pathname = headerStore.get("x-pathname") || "/admin";
  const crumb = crumbForPath(pathname);

  return (
    <AdminShell
      counts={{ tournaments: stats.total, needsReview: stats.needsReview }}
      email={user?.email ?? null}
      crumb={crumb}
    >
      {children}
    </AdminShell>
  );
}

function crumbForPath(pathname: string): string {
  if (pathname.startsWith("/admin/review")) return "Review queue";
  if (pathname.startsWith("/admin/sources") || pathname.startsWith("/admin/facebook")) return "Sources";
  if (pathname.startsWith("/admin/activity")) return "Activity";
  if (pathname === "/admin/new") return "New tournament";
  if (/^\/admin\/[^/]+$/.test(pathname) && pathname !== "/admin") return "Edit tournament";
  return "Admin";
}
