"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { importFacebookEventFromBrowser } from "@/app/admin/facebook/actions";

type Status =
  | { kind: "idle" }
  | { kind: "working"; title: string }
  | { kind: "done"; ok: boolean; title: string; created: number; updated: number; errors: string[] }
  | { kind: "error"; message: string };

export default function FacebookBookmarkletCatch() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash.startsWith("fb=")) {
      setStatus({ kind: "error", message: "No Facebook event data found. Use the bookmarklet from a Facebook event page." });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const encoded = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
        const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
        const json = decodeURIComponent(escape(atob(padded)));
        const payload = JSON.parse(json) as {
          title?: string;
          startDate?: string;
          endDate?: string;
          city?: string;
          venue?: string;
          description?: string;
          url?: string;
        };
        if (cancelled) return;
        setStatus({ kind: "working", title: payload.title ?? "Facebook event" });
        const result = await importFacebookEventFromBrowser(payload);
        if (cancelled) return;
        setStatus({
          kind: "done",
          ok: result.ok,
          title: result.title ?? payload.title ?? "Facebook event",
          created: result.created,
          updated: result.updated,
          errors: result.errors,
        });
        history.replaceState(null, "", window.location.pathname);
      } catch (error) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: error instanceof Error ? error.message : "Could not import this Facebook event.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-6 rounded-xl border border-border p-5 text-sm">
      {status.kind === "idle" || status.kind === "working" ? (
        <p>{status.kind === "working" ? `Importing “${status.title}”…` : "Reading Facebook event…"}</p>
      ) : null}
      {status.kind === "error" ? <p className="text-foreground/80">{status.message}</p> : null}
      {status.kind === "done" ? (
        <div className="space-y-2">
          <p className="font-semibold">
            {status.ok ? "Imported" : "Not imported"}: {status.title}
          </p>
          <p>
            created {status.created} · updated {status.updated}
          </p>
          {status.errors.length > 0 ? (
            <ul className="list-disc pl-5 text-foreground/80">
              {status.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <p className="mt-4">
        <Link href="/admin/facebook" className="font-semibold text-accent underline-offset-2 hover:underline">
          Back to Facebook import
        </Link>
        {" · "}
        <Link href="/lt/lietuva" className="font-semibold text-accent underline-offset-2 hover:underline">
          View Lithuania
        </Link>
      </p>
    </div>
  );
}
