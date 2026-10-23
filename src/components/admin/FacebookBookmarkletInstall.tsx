"use client";

import { facebookEventBookmarklet } from "@/lib/discovery/facebook/bookmarklet";

export default function FacebookBookmarkletInstall({ siteUrl }: { siteUrl: string }) {
  const href = facebookEventBookmarklet(`${siteUrl.replace(/\/$/, "")}/admin/facebook-catch`);

  return (
    <div className="mt-8 rounded-xl border border-border p-5">
      <h2 className="text-xl font-bold">One-click Facebook helper</h2>
      <p className="mt-2 text-sm text-foreground/80">
        Install this bookmark once. Then, while logged into Facebook, open an event and click the bookmark. It sends
        the title, dates, and link to PlayTennis.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground/80">
        <li>Show your bookmarks bar (Chrome: View → Always Show Bookmarks Bar).</li>
        <li>
          Drag this button onto the bookmarks bar:{" "}
          <a
            href={href}
            className="inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-[#0f172a]"
            onClick={(event) => {
              event.preventDefault();
              alert("Drag this button to your bookmarks bar instead of clicking it.");
            }}
          >
            Save to PlayTennis
          </a>
        </li>
        <li>Stay signed in to PlayTennis admin in this browser.</li>
        <li>Open a Facebook event page.</li>
        <li>Click the “Save to PlayTennis” bookmark.</li>
        <li>Confirm the import result on PlayTennis.</li>
      </ol>
      <p className="mt-3 text-xs text-foreground/60">
        Works on event pages whose URL contains <code>/events/123...</code>. If the date is missing, wait for the page
        to finish loading and try again.
      </p>
    </div>
  );
}
