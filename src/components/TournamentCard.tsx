import Link from "next/link";
import CheckedBadge from "@/components/CheckedBadge";
import SaveButton from "@/components/SaveButton";
import { isPubliclyChecked } from "@/lib/discovery/review";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import {
  environmentLabel,
  eventTypeLabel,
  formatCardDate,
  formatLabel,
  playLevelLabel,
  publicRegistrationLabel,
  surfaceLabel,
} from "@/lib/tournaments/present";
import type { PublicRegistration, TournamentRecord } from "@/lib/tournaments/types";

export default function TournamentCard({
  tournament,
  locale,
  messages,
  tone = "theme",
}: {
  tournament: TournamentRecord;
  locale: Locale;
  messages: Messages;
  tone?: "theme" | "paper";
}) {
  const href = localePath(locale, `/tournaments/${tournament.slug}`);
  const d = messages.discover;
  const paper = tone === "paper";
  const place = [tournament.city, tournament.venueName].filter(Boolean).join(" · ");
  const chips = [
    eventTypeLabel(tournament.eventType, messages),
    tournament.eventFormat !== "MULTIPLE" ? formatLabel(tournament.eventFormat, messages) : null,
    tournament.playLevel ? playLevelLabel(tournament.playLevel, messages) : null,
    surfaceLabel(tournament.surface, messages),
    environmentLabel(tournament.environment, messages),
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-xl border p-5 ${
        paper ? "border-[#e2e2e2] bg-white text-[#1a1c1c]" : "border-border bg-card text-foreground"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-sm font-bold uppercase tracking-wide ${paper ? "text-[#506600]" : "text-accent"}`}>
          {formatCardDate(tournament.startsOn, tournament.endsOn, locale)}
        </p>
        <SaveButton id={tournament.id} saveLabel={d.save} savedLabel={d.saved} unsaveLabel={d.unsave} paper={paper} />
      </div>
      <h3 className="text-xl font-bold tracking-tight">
        <Link href={href} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {tournament.name}
        </Link>
      </h3>
      {place ? <p className={`text-sm ${paper ? "text-[#434845]" : "text-foreground/80"}`}>{place}</p> : null}
      <ul className="flex flex-wrap gap-2" aria-label={d.categories}>
        {chips.map((chip) => (
          <li
            key={chip}
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
              paper ? "border-[#e2e2e2] bg-[#f3f4f3] text-[#1a1c1c]" : "border-border bg-surface text-foreground"
            }`}
          >
            {chip}
          </li>
        ))}
      </ul>
      {isPubliclyChecked(tournament) ? (
        <CheckedBadge verifiedAt={tournament.lastVerifiedAt} locale={locale} messages={messages} paper={paper} />
      ) : null}
      <RegistrationStatus status={tournament.publicRegistration} messages={messages} paper={paper} />
      <Link
        href={href}
        className={`mt-auto inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold ${
          paper ? "bg-[#151d19] text-[#c1f100] hover:bg-[#506600]" : "bg-accent text-[#0f172a] hover:opacity-90"
        }`}
      >
        {d.view}
      </Link>
    </article>
  );
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
  const label = publicRegistrationLabel(status, messages);
  const open = status === "OPEN";
  const mark = status === "CLOSED" || status === "FULL" ? "rounded-sm" : "rounded-full";
  const hollow = status === "NOT_STARTED" || status === "UNKNOWN" || status === "INVITATION_ONLY";

  return (
    <p
      className={`inline-flex w-fit max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
        open
          ? paper
            ? "bg-[#c1f100] text-[#151d19]"
            : "bg-accent text-[#0f172a]"
          : paper
            ? "border border-[#c3c8c3] text-[#1a1c1c]"
            : "border border-border text-foreground"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 ${mark} ${
          hollow ? "border-2 border-current bg-transparent" : "bg-current"
        } ${status === "UNKNOWN" ? "border-dashed" : ""}`}
      />
      <span>{label}</span>
    </p>
  );
}
