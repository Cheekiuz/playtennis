"use client";

import { useActionState } from "react";
import { importFacebookEventUrls, type FacebookImportState } from "@/app/admin/facebook/actions";

const TENISININKAI_SOURCE_ID = "00000000-0000-4000-8000-000000000020";

const initial: FacebookImportState = {
  savedUrls: 0,
  fetched: 0,
  created: 0,
  updated: 0,
  rejected: 0,
  errors: [],
};

export function FacebookEventImportForm() {
  const [state, action, pending] = useActionState(importFacebookEventUrls, initial);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Registry source</span>
        <select name="source_id" defaultValue={TENISININKAI_SOURCE_ID} className="border border-border px-3 py-2">
          <option value={TENISININKAI_SOURCE_ID}>Tenisininkai (Facebook group)</option>
          <option value="00000000-0000-4000-8000-000000000024">Facebook event search (tennis)</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm">
        <span className="font-semibold">Facebook event URLs</span>
        <span className="text-foreground/70">
          One link per line from your browser (logged into Facebook). Skip stalo tenis / table tennis. No Meta developer account needed.
        </span>
        <textarea
          name="urls"
          rows={12}
          required
          placeholder={"https://www.facebook.com/events/123456789012345\nhttps://www.facebook.com/events/823720397466259"}
          className="border border-border px-3 py-2 font-mono text-xs"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-fit border border-border bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60"
      >
        {pending ? "Saving and ingesting…" : "Save URLs and ingest"}
      </button>

      {(state.created > 0 || state.updated > 0 || state.fetched > 0 || state.errors.length > 0) && (
        <div className="border border-border px-4 py-3 text-sm">
          <p>
            Stored {state.savedUrls} URL(s) on source · parsed {state.fetched} · created {state.created} · updated{" "}
            {state.updated} · rejected {state.rejected}
          </p>
          {state.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-foreground/80">
              {state.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </form>
  );
}
