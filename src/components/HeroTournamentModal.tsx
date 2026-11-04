"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SaveButton from "@/components/SaveButton";
import { useLocale } from "@/context/LocaleContext";
import type { Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { flagEmoji } from "@/lib/tournaments/countries";
import type { HeroPick } from "@/lib/tournaments/hero-pick";
import {
  countryLabel,
  environmentLabel,
  formatDateRange,
  formatDay,
  formatLabel,
  formatMoney,
  playLevelLabel,
  surfaceLabel,
} from "@/lib/tournaments/present";

export type HeroModalPick = HeroPick & { sample?: boolean };

function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Illustrative record, only used when there are no real upcoming tournaments to pick from. */
export function makeSamplePick(messages: Messages): HeroModalPick {
  const p = messages.home.popup;
  return {
    sample: true,
    id: "sample-hero",
    slug: "",
    name: p.sampleName,
    city: p.sampleCity,
    countryCode: "lt",
    countryNameEn: p.sampleCountry,
    countryNameLt: p.sampleCountry,
    startsOn: isoDay(3),
    endsOn: isoDay(3),
    venueName: p.sampleVenue,
    eventFormat: "SAMPLE",
    surface: "carpet",
    environment: "indoor",
    playLevel: null,
    ageGroup: "18+",
    priceAmount: 35,
    priceCurrency: "EUR",
    priceLabel: null,
    registrationDeadline: isoDay(0),
    organizerName: null,
    checked: false,
    description: p.sampleAbout,
    catalogSection: null,
  };
}

export default function HeroTournamentModal({
  pick,
  canReroll,
  onReroll,
  onClose,
}: {
  pick: HeroModalPick;
  canReroll: boolean;
  onReroll: () => void;
  onClose: () => void;
}) {
  const { locale, messages } = useLocale();
  const p = messages.home.popup;
  const d = messages.discover;
  const dialogRef = useRef<HTMLDivElement>(null);
  const sample = pick.sample === true;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [onClose]);

  const flag = flagEmoji(pick.countryCode);
  const place = [`${pick.city}, ${countryLabel(pick, locale)}`, pick.ageGroup].filter(Boolean).join(" · ");

  const format = sample
    ? p.sampleFormat
    : pick.eventFormat
      ? formatLabel(pick.eventFormat, messages)
      : p.notProvided;
  const surface =
    pick.surface && pick.surface !== "unknown"
      ? [surfaceLabel(pick.surface, messages), pick.environment ? environmentLabel(pick.environment, messages) : null]
          .filter(Boolean)
          .join(" · ")
      : p.notProvided;
  const level = pick.playLevel ? playLevelLabel(pick.playLevel, messages) : sample ? p.sampleLevel : p.notProvided;
  const fee =
    pick.priceAmount != null && pick.priceCurrency
      ? `${formatMoney(pick.priceAmount, pick.priceCurrency, locale)}`
      : pick.priceLabel;

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: p.dates, value: formatDateRange(pick.startsOn, pick.endsOn, locale) },
    { label: p.venue, value: pick.venueName || p.notProvided },
    { label: p.format, value: format },
    { label: p.surface, value: surface },
    { label: p.playerLevel, value: level },
    { label: p.ageGroup, value: pick.ageGroup || p.notProvided },
    {
      label: p.entryFee,
      value: fee ? (
        <>
          {fee}
          {pick.priceAmount != null ? (
            <span className="ml-1 text-xs text-[#434845]">
              {p.perPlayer}
              {sample ? ` · ${p.sampleWord}` : ""}
            </span>
          ) : null}
        </>
      ) : (
        p.notProvided
      ),
    },
    {
      label: p.entryDeadline,
      value: pick.registrationDeadline ? formatDay(pick.registrationDeadline, locale) : p.notProvided,
    },
    { label: p.organiser, value: pick.organizerName || p.notProvided },
    {
      label: p.verification,
      value: sample ? p.notVerifiedSample : pick.checked ? d.checked : p.notVerified,
    },
  ];

  const detailsHref = sample ? `${localePath(locale, "/")}#play-next` : localePath(locale, `/tournaments/${pick.slug}`);

  return createPortal(
    <div className="home-editorial">
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0d2818]/55 p-3 backdrop-blur-[2px] sm:p-6"
        role="presentation"
      >
        <button type="button" className="absolute inset-0 cursor-default" aria-label={p.close} onClick={onClose} tabIndex={-1} />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hero-tournament-title"
          tabIndex={-1}
          className="relative z-[71] flex max-h-[min(92dvh,760px)] w-full max-w-[34rem] flex-col overflow-hidden rounded-[22px] bg-white text-[#111915] shadow-[0_24px_80px_rgba(13,40,24,0.4)] outline-none"
        >
          <header className="flex shrink-0 items-start justify-between gap-4 bg-[#eef1e6] px-6 pt-6 pb-5 sm:px-7">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.16em] text-[#6f7f5e] uppercase">
                {p.eyebrow}
                {sample ? ` · ${p.sampleTag}` : ""}
              </p>
              <h2 id="hero-tournament-title" className="mt-3 text-[26px] leading-[1.1] font-bold tracking-tight text-[#111915] sm:text-3xl">
                {pick.name}
              </h2>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-[#3f4a3a]">
                {flag ? <span aria-hidden="true">{flag}</span> : null}
                <span>{place}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={p.close}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dfe3d6] bg-white text-lg leading-none font-bold text-[#111915] hover:border-[#111915]"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
            {sample ? (
              <p className="rounded-lg border border-[#f0e2c6] bg-[#fdf5e6] px-4 py-3 text-xs leading-5 text-[#8a5a1c]">
                {p.sampleNotice}
              </p>
            ) : null}

            <dl className={`grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 ${sample ? "mt-6" : ""}`}>
              {rows.map((row) => (
                <div key={row.label}>
                  <dt className="text-[10px] font-medium tracking-[0.12em] text-[#7a8077] uppercase">{row.label}</dt>
                  <dd className="mt-1.5 text-sm text-[#111915]">{row.value}</dd>
                </div>
              ))}
            </dl>

            {pick.description ? (
              <section className="mt-7">
                <h3 className="text-sm font-bold text-[#111915]">{p.aboutTitle}</h3>
                <p className="mt-3 text-[13px] leading-6 text-[#4a5149]">{pick.description}</p>
              </section>
            ) : null}
            <p className="mt-4 text-[11px] leading-4 text-[#7a8077]">{sample ? p.sampleNote : p.realNote}</p>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[#e7e7e2] bg-white px-6 py-4 sm:px-7">
            <Link
              href={detailsHref}
              onClick={onClose}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#0d2818] px-5 text-sm font-bold text-white hover:bg-[#111915]"
            >
              {sample ? p.browseAll : p.viewFull} <span aria-hidden="true">↗</span>
            </Link>
            {!sample ? (
              <SaveButton
                id={pick.id}
                snapshot={{
                  id: pick.id,
                  slug: pick.slug,
                  name: pick.name,
                  city: pick.city,
                  countryCode: pick.countryCode,
                  startsOn: pick.startsOn,
                  endsOn: pick.endsOn,
                  catalogSection: pick.catalogSection,
                }}
                saveLabel={d.save}
                savedLabel={d.saved}
                unsaveLabel={d.unsave}
                paper
              />
            ) : null}
            {canReroll ? (
              <button
                type="button"
                onClick={onReroll}
                className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-4 text-sm font-semibold text-[#1a1c1c] hover:border-[#111915]"
              >
                <span aria-hidden="true">↻</span> {p.showAnother}
              </button>
            ) : null}
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
