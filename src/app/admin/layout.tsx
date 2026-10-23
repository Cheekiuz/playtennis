import type { Metadata } from "next";
import { Suspense } from "react";
import AdminNav from "@/components/admin/AdminNav";
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
      <Suspense fallback={<AdminNavFallback />}>
        <AdminNav />
      </Suspense>
      <main className="mx-auto max-w-5xl px-6 py-8 pb-16">{children}</main>
    </div>
  );
}

function AdminNavFallback() {
  return (
    <div className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-lg font-bold">PlayTennis admin</span>
      </div>
    </div>
  );
}
