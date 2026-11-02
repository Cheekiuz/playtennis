"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TournamentCard from "@/components/TournamentCard";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { readSavedIds, readSavedSnapshots, type SavedSnapshot } from "@/lib/tournaments/saved";
import type { TournamentRecord } from "@/lib/tournaments/types";

type SavedState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; tournaments: TournamentRecord[]; missing: SavedSnapshot[] }
  | { status: "error"; missing: SavedSnapshot[] };

export default function SavedTournaments({ locale, messages }: { locale: Locale; messages: Messages }) {
  const [state, setState] = useState<SavedState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const ids = readSavedIds();
      const snapshots = readSavedSnapshots();
      if (ids.length === 0) {
        if (!cancelled) setState({ status: "empty" });
        return;
      }

      try {
        const response = await fetch(`/api/tournaments?ids=${encodeURIComponent(ids.join(","))}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = (await response.json()) as { tournaments?: TournamentRecord[] };
        const tournaments = body.tournaments ?? [];
        const found = new Set(tournaments.map((row) => row.id));
        const missing = ids
          .filter((id) => !found.has(id))
          .map((id) => snapshots[id] ?? null)
          .filter((row): row is SavedSnapshot => Boolean(row));

        if (!cancelled) setState({ status: "ready", tournaments, missing });
      } catch {
        const missing = ids.map((id) => snapshots[id] ?? null).filter((row): row is SavedSnapshot => Boolean(row));
        if (!cancelled) setState({ status: "error", missing });
      }
    };

    void load();
    const onSaved = () => {
      void load();
    };
    window.addEventListener("playtennis-saved", onSaved);
    return () => {
      cancelled = true;
      window.removeEventListener("playtennis-saved", onSaved);
    };
  }, []);

  if (state.status === "loading") {
    return <p className="text-sm text-foreground/70">{messages.discover.loading}</p>;
  }

  if (state.status === "empty") {
    return <p className="text-sm text-foreground/70">{messages.discover.savedEmpty}</p>;
  }

  if (state.status === "error") {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-foreground/70">{messages.discover.savedLoadError}</p>
        {state.missing.length > 0 ? <SnapshotList locale={locale} messages={messages} items={state.missing} /> : null}
      </div>
    );
  }

  if (state.tournaments.length === 0 && state.missing.length === 0) {
    return <p className="text-sm text-foreground/70">{messages.discover.savedUnavailable}</p>;
  }

  return (
    <div className="grid gap-4">
      {state.tournaments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {state.tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
          ))}
        </div>
      ) : null}
      {state.missing.length > 0 ? (
        <div className="grid gap-3">
          <p className="text-sm text-foreground/70">{messages.discover.savedUnavailable}</p>
          <SnapshotList locale={locale} messages={messages} items={state.missing} />
        </div>
      ) : null}
    </div>
  );
}

function SnapshotList({
  locale,
  messages,
  items,
}: {
  locale: Locale;
  messages: Messages;
  items: SavedSnapshot[];
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-[#e7e7e2] bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#747874]">{item.city}</p>
          <Link
            href={localePath(locale, `/tournaments/${item.slug}`)}
            className="mt-2 block text-lg font-bold text-[#111915] hover:underline"
          >
            {item.name}
          </Link>
          <p className="mt-2 text-sm text-[#747874]">
            {item.startsOn.slice(0, 10)}
            {item.endsOn !== item.startsOn ? ` to ${item.endsOn.slice(0, 10)}` : ""}
          </p>
          <p className="mt-3 text-sm font-semibold text-[#111915]">{messages.desk.viewDetails} ↗</p>
        </li>
      ))}
    </ul>
  );
}
