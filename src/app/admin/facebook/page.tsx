import { FacebookEventImportForm } from "@/components/admin/FacebookEventImportForm";
import FacebookBookmarkletInstall from "@/components/admin/FacebookBookmarkletInstall";

export const dynamic = "force-dynamic";

export default function AdminFacebookImportPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.playtennis.lt";

  return (
    <div>
      <h1 className="text-3xl font-bold">Facebook events</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/70">
        Meta does not allow automatic group-event import for normal apps. Use the one-click bookmark helper while you
        browse Facebook, or paste event URLs below as a backup.
      </p>

      <FacebookBookmarkletInstall siteUrl={siteUrl} />

      <div className="mt-10 border-t border-border pt-8">
        <h2 className="text-xl font-bold">Backup: paste event URLs</h2>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Server-side reading of Facebook pages often hits a login wall. Prefer the bookmark helper above.
        </p>
        <FacebookEventImportForm />
      </div>
    </div>
  );
}
