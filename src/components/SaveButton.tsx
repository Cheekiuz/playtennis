"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { readSavedIds, toggleSavedId } from "@/lib/tournaments/saved";

export default function SaveButton({
  id,
  saveLabel,
  savedLabel,
  unsaveLabel,
  paper = false,
  variant = "text",
}: {
  id: string;
  saveLabel: string;
  savedLabel: string;
  unsaveLabel: string;
  paper?: boolean;
  variant?: "text" | "heart";
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
      title={saved ? savedLabel : saveLabel}
      onClick={() => {
        const next = toggleSavedId(id);
        setSaved(next);
        track("save_tournament", { tournament_id: id, saved: next });
      }}
      className={
        variant === "heart"
          ? `inline-flex h-9 w-9 items-center justify-center rounded-full border ${
              saved
                ? "border-[#0d2818] bg-[#0d2818] text-[#c8ff00]"
                : "border-[#e7e7e2] bg-white text-[#0d2818] hover:border-[#0d2818]"
            }`
          : paper
            ? "rounded-full border border-[#e2e2e2] bg-white px-3 py-1.5 text-sm font-semibold text-[#1a1c1c] hover:border-[#111915]"
            : "rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      }
    >
      {variant === "heart" ? <HeartIcon filled={saved} /> : saved ? savedLabel : saveLabel}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 3.3C19 15.6 12 20 12 20Z" />
    </svg>
  );
}
