import Link from "next/link";
import SaveButton from "@/components/SaveButton";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { flagEmoji } from "@/lib/tournaments/countries";
import {
  countryLabel,
  environmentLabel,
  formatCardDate,
  formatDateBlock,
  formatLabel,
  formatMoney,
  playLevelLabel,
  surfaceLabel,
} from "@/lib/tournaments/present";
import type { PublicRegistration, TournamentRecord } from "@/lib/tournaments/types";

export default function TournamentCard({
  tournament,
  locale,
  messages,
  tone = "paper",
  layout = "grid",
}: {
  tournament: TournamentRecord;
  locale: Locale;
  messages: Messages;
  tone?: "theme" | "paper";
  layout?: "grid" | "list";
}) {
  const href = localePath(locale, `/tournaments/${tournament.slug}`);
  const d = messages.discover;
  const desk = messages.desk;
  const paper = tone === "paper";
  const block = formatDateBlock(tournament.startsOn, locale);
  const place = [tournament.city, tournament.venueName || environmentLabel(tournament.environment, messages)]
    .filter(Boolean)
    .join(" · ");
  const sectionLabel =
    tournament.catalogSection === "itf"
      ? messages.catalog.sections.itf
      : tournament.catalogSection === "baltics"
        ? messages.catalog.sections.baltics
        : tournament.catalogSection === "lithuania"
          ? messages.catalog.sections.lithuania
          : countryLabel(tournament, locale);
  const chips = [
    tournament.eventFormat !== "MULTIPLE" ? formatLabel(tournament.eventFormat, messages) : null,
    tournament.surface !== "unknown" ? surfaceLabel(tournament.surface, messages) : null,
    tournament.ageGroup || tournament.categories[0]?.ageLabel || null,
    tournament.playLevel ? playLevelLabel(tournament.playLevel, messages) : null,
  ].filter((chip): chip is string => Boolean(chip));
  const fee =
    tournament.priceAmount != null && tournament.priceCurrency
      ? `${formatMoney(tournament.priceAmount, tournament.priceCurrency, locale)} ${desk.feePlayer}`
      : tournament.priceLabel;
  const ended = tournament.endsOn < new Date().toISOString().slice(0, 10) || tournament.lifecycleStatus === "completed";
  const flag = flagEmoji(tournament.countryCode);

  return (
    <article
      className={`overflow-hidden rounded-2xl border ${
        paper ? "border-[#e7e7e2] bg-white text-[#111915]" : "border-border bg-card text-foreground"
      } ${layout === "list" ? "flex flex-col sm:flex-row" : "flex h-full flex-col"}`}
    >
      <div className={`court-card-header relative flex items-start justify-between gap-3 px-4 py-4 ${layout === "list" ? "sm:w-40 sm:shrink-0 sm:flex-col" : ""}`}>
        <div className="rounded-xl bg-white/90 px-3 py-2 text-center shadow-sm">
          <p className="text-2xl font-bold leading-none tabular-nums text-[#111915]">{block.day}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#747874]">{block.month}</p>
        </div>
        <SaveButton
          id={tournament.id}
          saveLabel={d.save}
          savedLabel={d.saved}
          unsaveLabel={d.unsave}
          paper={paper}
          variant="heart"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#747874]">
          {flag ? <span aria-hidden="true">{flag}</span> : null}
          <span>{sectionLabel}</span>
          {tournament.isTest ? (
            <span className="rounded bg-[#e2e2e2] px-1.5 py-0.5 text-[10px] font-bold text-[#434845]">{desk.sample}</span>
          ) : null}
        </p>
        <h3 className="text-xl font-bold tracking-tight">
          <Link href={href} className="hover:underline">
            {tournament.name}
          </Link>
        </h3>
        {place ? <p className="text-sm text-[#747874]">{place}</p> : null}
        {chips.length > 0 ? (
          <ul className="flex flex-wrap gap-2" aria-label={d.categories}>
            {chips.map((chip) => (
              <li key={chip} className="rounded-full border border-[#e7e7e2] bg-[#f3f4f3] px-2.5 py-1 text-xs font-semibold">
                {chip}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1 text-sm">
          <p className="font-semibold tabular-nums">{formatCardDate(tournament.startsOn, tournament.endsOn, locale)}</p>
          {fee ? <p className="font-semibold text-[#434845]">{fee}</p> : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#e7e7e2] pt-3">
          <StatusDot ended={ended} status={tournament.publicRegistration} messages={messages} deskEnded={desk.ended} />
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-[#111915] hover:underline">
            {desk.viewDetails} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatusDot({
  ended,
  status,
  messages,
  deskEnded,
}: {
  ended: boolean;
  status: PublicRegistration | string;
  messages: Messages;
  deskEnded: string;
}) {
  if (ended) {
    return (
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#747874]">
        <span className="h-2 w-2 rounded-full bg-[#747874]" aria-hidden="true" />
        {deskEnded}
      </p>
    );
  }
  return <RegistrationStatus status={status} messages={messages} paper />;
}

export function RegistrationStatus({
  status,
  messages,
  paper = false,
}: {
  status: PublicRegistration | string;
  messages: Messages;
  paper?: boolean;
}) {
  const labels = messages.discover.publicRegistration as Record<string, string>;
  const label = labels[String(status)] ?? String(status);
  const open = status === "OPEN";
  const mark = status === "CLOSED" || status === "FULL" ? "rounded-sm" : "rounded-full";
  const hollow = status === "NOT_STARTED" || status === "UNKNOWN" || status === "INVITATION_ONLY";

  return (
    <p
      className={`inline-flex w-fit max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
        open
          ? paper
            ? "bg-[#c8ff00] text-[#151d19]"
            : "bg-accent text-[#0f172a]"
          : paper
            ? "border border-[#c3c8c3] text-[#1a1c1c]"
            : "border border-border text-foreground"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 ${mark} ${hollow ? "border-2 border-current bg-transparent" : "bg-current"} ${
          status === "UNKNOWN" ? "border-dashed" : ""
        }`}
      />
      <span>{label}</span>
    </p>
  );
}
