"use client";

import { cycleCourtSurface } from "@/lib/court-controls";

export default function SurfaceButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => cycleCourtSurface()}
      className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:hidden"
    >
      {label}
    </button>
  );
}
