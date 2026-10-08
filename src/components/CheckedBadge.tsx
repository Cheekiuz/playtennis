"use client";

import { useId, useState } from "react";
import type { Locale, Messages } from "@/lib/i18n";
import { formatDay } from "@/lib/tournaments/present";

export default function CheckedBadge({
  verifiedAt,
  locale,
  messages,
  paper = false,
}: {
  verifiedAt: string | null;
  locale: Locale;
  messages: Messages;
  paper?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const d = messages.discover;
  const when = verifiedAt ? formatDay(verifiedAt, locale) : null;
  const label = when ? `${d.checked} ${when}` : d.checked;

  return (
    <span className="relative inline-flex max-w-full">
      <button
        type="button"
        className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-semibold ${
          paper
            ? "border-[#c3c8c3] bg-[#f3f4f3] text-[#1a1c1c]"
            : "border-border bg-surface text-foreground"
        }`}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 8.2 6.7 10.4 11.5 5.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="truncate">{label}</span>
      </button>
      <span
        id={id}
        role="tooltip"
        className={`z-20 mt-1 w-64 rounded-lg border px-3 py-2 text-xs leading-5 shadow-sm ${
          open ? "absolute left-0 top-full" : "sr-only"
        } ${paper ? "border-[#e2e2e2] bg-white text-[#1a1c1c]" : "border-border bg-card text-foreground"}`}
      >
        {d.checkedHint}
      </span>
    </span>
  );
}
