import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/tournaments/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | PlayTennis.lt",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/admin" className="text-lg font-bold">
          PlayTennis admin
        </Link>
        <nav className="flex gap-4 text-sm font-semibold">
          <Link href="/admin/new">New tournament</Link>
          <Link href="/lt">View site</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-16">{children}</main>
    </div>
  );
}
