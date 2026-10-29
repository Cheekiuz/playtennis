import AdminSidebar, { type AdminNavCounts } from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export default function AdminShell({
  children,
  counts,
  email,
  crumb,
}: {
  children: React.ReactNode;
  counts: AdminNavCounts;
  email: string | null;
  crumb: string;
}) {
  return (
    <div className="admin-workspace min-h-screen bg-[#fbfbfa] text-[#111915]">
      <AdminSidebar counts={counts} />
      <div className="lg:pl-60">
        <AdminTopBar email={email} crumb={crumb} />
        <main className="mx-auto max-w-6xl px-4 py-6 pb-16 sm:px-6">{children}</main>
        <footer className="border-t border-[#e7e7e2] px-4 py-4 text-[11px] text-[#747874] sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <span>PlayTennis.lt / Admin workspace</span>
            <span>Independent. Non-commercial. Here for the game.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
