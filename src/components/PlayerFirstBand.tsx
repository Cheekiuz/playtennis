"use client";

import { useSiteModals } from "@/components/SiteModals";
import type { Messages } from "@/lib/i18n";

export default function PlayerFirstBand({ messages }: { messages: Messages }) {
  const modals = useSiteModals();
  const copy = messages.playerFirst;

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 lg:px-12">
      <div className="player-first-band grid gap-6 rounded-[28px] px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-10 lg:py-10">
        <div>
          <p className="player-first-band-eyebrow text-[11px] font-bold uppercase tracking-[0.14em]">{copy.eyebrow}</p>
          <h2 className="player-first-band-title mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h2>
        </div>
        <div>
          <p className="player-first-band-body text-sm leading-7 sm:text-base">{copy.body}</p>
          <button
            type="button"
            onClick={() => modals.open("story")}
            className="player-first-band-cta mt-4 text-sm font-bold hover:underline"
          >
            {copy.cta} ↗
          </button>
        </div>
      </div>
    </section>
  );
}
