"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { bulkArchiveTournaments, setTournamentStatus } from "@/app/admin/actions";

export type AdminTournamentRow = {
  id: string;
  name: string;
  city: string;
  startsOn: string;
  catalogSection: string | null;
  sourceKind: string | null;
  lifecycleStatus: string;
  verificationStatus: string;
  published: boolean;
};

export default function AdminTournamentList({
  tournaments,
  section,
}: {
  tournaments: AdminTournamentRow[];
  section: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const allIds = useMemo(() => tournaments.map((row) => row.id), [tournaments]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function archiveSelected() {
    if (selected.size === 0) return;
    if (!window.confirm(`Archive ${selected.size} selected event${selected.size === 1 ? "" : "s"}?`)) return;

    const formData = new FormData();
    formData.set("section", section);
    for (const id of selected) formData.append("ids", id);
    startTransition(() => {
      void bulkArchiveTournaments(formData);
    });
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Select all
        </label>
        <button
          type="button"
          disabled={selected.size === 0 || pending}
          onClick={archiveSelected}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Archiving…" : `Archive selected (${selected.size})`}
        </button>
        <p className="text-xs text-foreground/60">Open Edit to change title, dates, city, and publish state.</p>
      </div>

      <ul className="grid gap-3">
        {tournaments.map((tournament) => (
          <li key={tournament.id} className="flex flex-wrap items-start justify-between gap-3 border border-border px-4 py-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={selected.has(tournament.id)}
                onChange={() => toggleOne(tournament.id)}
                aria-label={`Select ${tournament.name}`}
              />
              <div className="min-w-0">
                <Link href={`/admin/${tournament.id}`} className="font-semibold hover:text-accent">
                  {tournament.name}
                </Link>
                <p className="text-sm text-foreground/70">
                  {tournament.city} · {tournament.startsOn} · {tournament.catalogSection ?? "—"} ·{" "}
                  {tournament.sourceKind ?? "—"} · {tournament.lifecycleStatus} · {tournament.verificationStatus}
                  {tournament.published ? " · published" : " · draft"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/${tournament.id}`}
                className="rounded-md border border-border bg-accent px-3 py-1.5 text-xs font-semibold text-[#0f172a]"
              >
                Edit
              </Link>
              <QuickAction id={tournament.id} section={section} status="unpublish" label="Unpublish" hidden={!tournament.published} />
              <QuickAction id={tournament.id} section={section} status="publish" label="Publish" hidden={tournament.published} />
              <QuickAction id={tournament.id} section={section} status="archive" label="Archive" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickAction({
  id,
  section,
  status,
  label,
  hidden,
}: {
  id: string;
  section: string;
  status: string;
  label: string;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <form action={setTournamentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="section" value={section} />
      <button
        type="submit"
        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:border-accent hover:text-accent"
      >
        {label}
      </button>
    </form>
  );
}
