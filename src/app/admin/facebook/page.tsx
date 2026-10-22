import { FacebookEventImportForm } from "@/components/admin/FacebookEventImportForm";

export const dynamic = "force-dynamic";

export default function AdminFacebookImportPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Facebook events (no API token)</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/70">
        PlayTennis cannot open Facebook search while you are logged in. You browse Facebook, copy event links, paste them here.
        We save them on the import source and fetch public event metadata (title, date, city), then ingest. Table tennis and under-18
        events are filtered out automatically.
      </p>
      <ol className="mt-4 max-w-2xl list-decimal space-y-2 pl-5 text-sm text-foreground/80">
        <li>
          Open{" "}
          <a className="font-semibold text-accent underline-offset-2 hover:underline" href="https://www.facebook.com/events/search?q=teniso" target="_blank" rel="noreferrer">
            Facebook event search: teniso
          </a>{" "}
          or the Tenisininkai group.
        </li>
        <li>Open each lawn tennis event and copy the URL from the address bar.</li>
        <li>Paste URLs below and click Save URLs and ingest.</li>
      </ol>
      <FacebookEventImportForm />
    </div>
  );
}
