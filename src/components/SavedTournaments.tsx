"use client";

import { useEffect, useState } from "react";
import TournamentCard from "@/components/TournamentCard";
import type { Locale, Messages } from "@/lib/i18n";
import { readSavedIds, reconcileSavedIds } from "@/lib/tournaments/saved";
import type { TournamentRecord } from "@/lib/tournaments/types";

type SavedState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "ready"; tournaments: TournamentRecord[] }
  | { status: "error" };

export default function SavedTournaments({ locale, messages }: { locale: Locale; messages: Messages }) {
  const [state, setState] = useState<SavedState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let reconciling = false;

    const load = async () => {
      const ids = readSavedIds();
      if (ids.length === 0) {
        if (!cancelled) setState({ status: "empty" });
        return;
      }

      try {
        const response = await fetch(`/api/tournaments?ids=${encodeURIComponent(ids.join(","))}`);
        const body = (await response.json()) as { tournaments?: TournamentRecord[]; ok?: boolean };
        if (!response.ok || body.ok === false) throw new Error(`HTTP ${response.status}`);
        const tournaments = body.tournaments ?? [];

        // Drop saves the API no longer returns so hearts and the badge stay truthful.
        const foundIds = tournaments.map((row) => row.id);
        if (foundIds.length !== ids.length) {
          reconciling = true;
          reconcileSavedIds(foundIds);
          reconciling = false;
        }

        if (!cancelled) {
          setState(tournaments.length === 0 ? { status: "empty" } : { status: "ready", tournaments });
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    };

    void load();
    const onSaved = () => {
      if (reconciling) return;
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
    return <p className="text-sm text-foreground/70">{messages.discover.savedLoadError}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {state.tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
      ))}
    </div>
  );
}
