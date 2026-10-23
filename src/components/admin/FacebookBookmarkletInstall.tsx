"use client";

import { useState } from "react";

export default function FacebookBookmarkletInstall({ siteUrl }: { siteUrl: string }) {
  const base = siteUrl.replace(/\/$/, "");
  const userscriptUrl = `${base}/playtennis-facebook.user.js`;
  const [copied, setCopied] = useState(false);

  async function copyInstallLink() {
    await navigator.clipboard.writeText(userscriptUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-8 rounded-xl border border-border p-5">
      <h2 className="text-xl font-bold">One-click Facebook helper</h2>
      <p className="mt-2 text-sm text-foreground/80">
        Facebook blocks normal bookmarks. Install Tampermonkey, then install our script (version 1.3.0 or newer). On
        Facebook you should see a small green <strong>PT</strong> badge (top right). On an event page you also get a
        green <strong>Save to PlayTennis</strong> button (bottom right). The save dialog shows the date before import.
        Re-open the script link after updates to upgrade.
      </p>

      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-foreground/80">
        <li>
          Install{" "}
          <a
            className="font-semibold text-accent underline-offset-2 hover:underline"
            href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"
            target="_blank"
            rel="noreferrer"
          >
            Tampermonkey for Chrome
          </a>
          .
        </li>
        <li>
          Enable user scripts in Chrome:
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              Open <code>chrome://extensions</code>
            </li>
            <li>Turn on <strong>Developer mode</strong> (top right)</li>
            <li>Open Tampermonkey → Details</li>
            <li>
              Turn on <strong>Allow User Scripts</strong> (required on newer Chrome)
            </li>
          </ul>
        </li>
        <li>
          Install the PlayTennis script:{" "}
          <a className="font-semibold text-accent underline-offset-2 hover:underline" href={userscriptUrl}>
            {userscriptUrl}
          </a>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={userscriptUrl}
              className="inline-flex items-center rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-[#0f172a]"
            >
              Open script install page
            </a>
            <button
              type="button"
              onClick={() => void copyInstallLink()}
              className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-sm font-semibold"
            >
              {copied ? "Copied" : "Copy script link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-foreground/60">
            Tampermonkey should show an Install button. If the page is blank text, click the Tampermonkey icon →
            Dashboard → Utilities → Install from URL, paste the link, Install.
          </p>
        </li>
        <li>Confirm the script is ON in Tampermonkey Dashboard (toggle enabled).</li>
        <li>Open a Facebook event whose address bar contains <code>/events/123…</code> and refresh.</li>
        <li>
          Look for green <strong>PT</strong> (top right). On the event page, click{" "}
          <strong>Save to PlayTennis</strong> (bottom right).
        </li>
      </ol>

      <p className="mt-4 text-xs text-foreground/60">
        If there is no PT badge, the script is not running yet (extension off, user scripts disabled, or script not
        installed). Stay signed in to PlayTennis admin in this browser before saving.
      </p>
    </div>
  );
}
