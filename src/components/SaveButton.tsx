"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { readSavedIds, toggleSavedId } from "@/lib/tournaments/saved";

export default function SaveButton({
  id,
  saveLabel,
  savedLabel,
  unsaveLabel,
}: {
  id: string;
  saveLabel: string;
  savedLabel: string;
  unsaveLabel: string;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(readSavedIds().includes(id));
    sync();
    window.addEventListener("playtennis-saved", sync);
    return () => window.removeEventListener("playtennis-saved", sync);
  }, [id]);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? unsaveLabel : saveLabel}
      onClick={() => {
        const next = toggleSavedId(id);
        setSaved(next);
        track("save_tournament", { tournament_id: id, saved: next });
      }}
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {saved ? savedLabel : saveLabel}
    </button>
  );
}
