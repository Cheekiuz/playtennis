"use client";

import { facebookEventBookmarklet } from "@/lib/discovery/facebook/bookmarklet";

export default function FacebookBookmarkletInstall({ siteUrl }: { siteUrl: string }) {
  const base = siteUrl.replace(/\/$/, "");
  const href = facebookEventBookmarklet(`${base}/admin/facebook-catch`);
  const userscriptUrl = `${base}/playtennis-facebook.user.js`;

  return (
    <div className="mt-8 rounded-xl border border-border p-5">
      <h2 className="text-xl font-bold">One-click Facebook helper</h2>
      <p className="mt-2 text-sm text-foreground/80">
        Facebook blocks normal browser bookmarks on event pages, so nothing happens when you click them there. Use the
        userscript below instead. It adds a green <strong>Save to PlayTennis</strong> button on Facebook event pages.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground/80">
        <li>
          Install{" "}
          <a
            className="font-semibold text-accent underline-offset-2 hover:underline"
            href="https://www.tampermonkey.net/"
            target="_blank"
            rel="noreferrer"
          >
            Tampermonkey
          </a>{" "}
          (Chrome / Edge / Firefox) or{" "}
          <a
            className="font-semibold text-accent underline-offset-2 hover:underline"
            href="https://violentmonkey.github.io/"
            target="_blank"
            rel="noreferrer"
          >
            Violentmonkey
          </a>
          .
        </li>
        <li>
          Open this script and click Install:{" "}
          <a className="font-semibold text-accent underline-offset-2 hover:underline" href={userscriptUrl}>
            playtennis-facebook.user.js
          </a>
        </li>
        <li>Stay signed in to PlayTennis admin in this browser.</li>
        <li>Open a Facebook event page (URL contains <code>/events/123…</code>).</li>
        <li>Click the green <strong>Save to PlayTennis</strong> button at the bottom right.</li>
        <li>Confirm the import result on PlayTennis.</li>
      </ol>

      <details className="mt-5 text-sm text-foreground/70">
        <summary className="cursor-pointer font-semibold text-foreground">Bookmark fallback (usually blocked by Facebook)</summary>
        <p className="mt-2">
          Drag this onto your bookmarks bar only if you want a backup. On Facebook it often does nothing because of
          their security policy:
        </p>
        <p className="mt-2">
          <a
            href={href}
            className="inline-flex items-center rounded-full bg-foreground/10 px-3 py-1.5 text-sm font-semibold"
            onClick={(event) => {
              event.preventDefault();
              alert("Prefer the Tampermonkey userscript above. Facebook usually blocks this bookmark.");
            }}
          >
            Save to PlayTennis (bookmark)
          </a>
        </p>
      </details>
    </div>
  );
}
