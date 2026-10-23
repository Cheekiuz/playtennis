"use client";

import { useEffect, useState, useTransition } from "react";
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
  | { kind: "loading" }
  | { kind: "review"; payload: Payload }
  | { kind: "done"; ok: boolean; title: string; created: number; updated: number; errors: string[]; startDate: string }
  | { kind: "error"; message: string };

function readPayloadFromHash(): { payload: Payload | null; error: string | null } {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash.startsWith("fb=")) {
    return {
      payload: null,
      error: "No Facebook event data found. Use Save to PlayTennis from a Facebook event page.",
    };
  }

  try {
    const encoded = hash.slice(3).replace(/-/g, "+").replace(/_/g, "/");
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(padded)));
    return { payload: JSON.parse(json) as Payload, error: null };
  } catch {
    return { payload: null, error: "Could not read Facebook event data from the helper." };
  }
}

export default function FacebookBookmarkletCatch() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [city, setCity] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      const { payload, error } = readPayloadFromHash();
      if (!payload) {
        setStatus({ kind: "error", message: error ?? "No Facebook event data found." });
        return;
      }
      setTitle(payload.title ?? "");
      setStartDate((payload.startDate ?? "").slice(0, 10));
      setEndDate((payload.endDate ?? payload.startDate ?? "").slice(0, 10));
      setCity(payload.city ?? "");
      setStatus({ kind: "review", payload });
      history.replaceState(null, "", window.location.pathname);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function onImport() {
    if (status.kind !== "review") return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setStatus({ kind: "error", message: "Start date must be YYYY-MM-DD." });
      return;
    }
    const resolvedEnd = /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? endDate : startDate;
    const payload: Payload = {
      ...status.payload,
      title: title.trim() || status.payload.title,
      startDate,
      endDate: resolvedEnd < startDate ? startDate : resolvedEnd,
      city: city.trim(),
    };

    startTransition(async () => {
      try {
        const result = await importFacebookEventFromBrowser(payload);
        setStatus({
          kind: "done",
          ok: result.ok,
          title: result.title ?? payload.title ?? "Facebook event",
          created: result.created,
          updated: result.updated,
          errors: result.errors,
          startDate,
        });
      } catch (err) {
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Could not import this Facebook event.",
        });
      }
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-border p-5 text-sm">
      {status.kind === "loading" ? <p>Reading Facebook event…</p> : null}
      {status.kind === "error" ? <p className="text-foreground/80">{status.message}</p> : null}

      {status.kind === "review" ? (
        <div className="grid max-w-xl gap-3">
          <p className="font-semibold">Check the date before saving</p>
          <p className="text-foreground/70">
            Facebook often exposes the wrong date automatically. Fix the start date here, then import.
          </p>
          {status.payload.url ? (
            <p className="break-all text-xs text-foreground/60">
              <a href={status.payload.url} className="text-accent underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                {status.payload.url}
              </a>
            </p>
          ) : null}
          <label className="grid gap-1">
            <span className="font-semibold">Title</span>
            <input className="border border-border bg-input-bg px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="font-semibold">Start date</span>
              <input
                className="border border-border bg-input-bg px-3 py-2"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="font-semibold">End date</span>
              <input className="border border-border bg-input-bg px-3 py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="font-semibold">City</span>
            <input className="border border-border bg-input-bg px-3 py-2" value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={onImport}
            className="w-fit rounded-full bg-accent px-5 py-2 text-sm font-semibold text-[#0f172a] disabled:opacity-60"
          >
            {pending ? "Importing…" : "Import event"}
          </button>
        </div>
      ) : null}

      {status.kind === "done" ? (
        <div className="space-y-2">
          <p className="font-semibold">
            {status.ok ? "Imported" : "Not imported"}: {status.title}
          </p>
          <p>
            date {status.startDate} · created {status.created} · updated {status.updated}
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
        <Link href="/admin?section=local" className="font-semibold text-accent underline-offset-2 hover:underline">
          Local tournaments
        </Link>
      </p>
    </div>
  );
}
