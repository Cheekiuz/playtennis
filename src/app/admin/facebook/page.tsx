import Link from "next/link";
import { FacebookEventImportForm } from "@/components/admin/FacebookEventImportForm";
import FacebookBookmarkletInstall from "@/components/admin/FacebookBookmarkletInstall";

export const dynamic = "force-dynamic";

export default function AdminFacebookImportPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.playtennis.lt";

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#747874]">Sources</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111915] sm:text-3xl">Facebook events</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#747874]">
        Meta does not allow automatic group-event import for normal apps. Use the one-click bookmark helper while you
        browse Facebook, or paste event URLs below as a backup.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/admin/sources" className="font-semibold text-[#111915] underline-offset-2 hover:underline">
          ← Back to sources
        </Link>
      </p>

      <FacebookBookmarkletInstall siteUrl={siteUrl} />

      <div className="mt-10 border-t border-[#e7e7e2] pt-8">
        <h2 className="text-xl font-bold text-[#111915]">Backup: paste event URLs</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#747874]">
          Server-side reading of Facebook pages often hits a login wall. Prefer the bookmark helper above.
        </p>
        <FacebookEventImportForm />
      </div>
    </div>
  );
}
