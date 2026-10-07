"use client";

import { useEffect, useState } from "react";
import TournamentCard from "@/components/TournamentCard";
import type { Locale, Messages } from "@/lib/i18n";
import { readSavedIds } from "@/lib/tournaments/saved";
import type { TournamentRecord } from "@/lib/tournaments/types";

export default function SavedTournaments({ locale, messages }: { locale: Locale; messages: Messages }) {
  const [tournaments, setTournaments] = useState<TournamentRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      const nextIds = readSavedIds();
      const request =
        nextIds.length === 0
          ? Promise.resolve([] as TournamentRecord[])
          : fetch(`/api/tournaments?ids=${encodeURIComponent(nextIds.join(","))}`)
              .then((response) => response.json())
              .then((body: { tournaments?: TournamentRecord[] }) => body.tournaments ?? [])
              .catch(() => [] as TournamentRecord[]);

      request.then((items) => {
        if (!cancelled) setTournaments(items);
      });
    };

    load();
    window.addEventListener("playtennis-saved", load);
    return () => {
      cancelled = true;
      window.removeEventListener("playtennis-saved", load);
    };
  }, []);

  if (tournaments === null) return null;
  if (tournaments.length === 0) {
    return <p className="text-sm text-foreground/70">{messages.discover.savedEmpty}</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} locale={locale} messages={messages} />
      ))}
    </div>
  );
}
