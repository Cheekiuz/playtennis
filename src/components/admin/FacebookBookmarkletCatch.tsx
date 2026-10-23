"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { importFacebookEventFromBrowser } from "@/app/admin/facebook/actions";

type Payload = {
  title?: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  venue?: string;
  description?: string;
  url?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "working"; title: string }
  | { kind: "done"; ok: boolean; title: string; created: number; updated: number; errors: string[] }
  | { kind: "error"; message: string };

function readPayloadFromHash(): { payload: Payload | null; error: string | null } {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("fb=")) {
    return {
      payload: null,
      error: "No Facebook event data found. Use the bookmarklet from a Facebook event page.",
    };
  }

  try {
    const encoded = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    return { payload: JSON.parse(json) as Payload, error: null };
  } catch {
    return { payload: null, error: "Could not read Facebook event data from the bookmarklet." };
  }
}

export default function FacebookBookmarkletCatch() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Defer so setState is not synchronous inside the effect body (eslint react-hooks/set-state-in-effect).
      await Promise.resolve();
      if (cancelled) return;

      const { payload, error } = readPayloadFromHash();
      if (!payload) {
        setStatus({
          kind: "error",
          message: error ?? "No Facebook event data found. Use the bookmarklet from a Facebook event page.",
        });
        return;
      }

      setStatus({ kind: "working", title: payload.title ?? "Facebook event" });
      try {
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
      } catch (err) {
        if (cancelled) return;
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Could not import this Facebook event.",
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
              {status.errors.map((item) => (
                <li key={item}>{item}</li>
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
