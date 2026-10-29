"use client";

import { useSiteModals } from "@/components/SiteModals";
import type { Messages } from "@/lib/i18n";

export default function PlayerFirstBand({ messages }: { messages: Messages }) {
  const modals = useSiteModals();
  const copy = messages.playerFirst;

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 lg:px-12">
      <div className="grid gap-6 rounded-[28px] bg-[#e8f5c8] px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:px-10 lg:py-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3c4d00]">{copy.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111915] sm:text-4xl">{copy.title}</h2>
        </div>
        <div>
          <p className="text-sm leading-7 text-[#434845] sm:text-base">{copy.body}</p>
          <button
            type="button"
            onClick={() => modals.open("story")}
            className="mt-4 text-sm font-bold text-[#111915] hover:underline"
          >
            {copy.cta} ↗
          </button>
        </div>
      </div>
    </section>
  );
}
