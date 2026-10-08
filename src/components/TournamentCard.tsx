import Link from "next/link";
import OutboundLink from "@/components/OutboundLink";
import SaveButton from "@/components/SaveButton";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import {
  eventTypeLabel,
  formatClock,
  formatDateRange,
  formatLabel,
  lowestFee,
  placeLine,
  playLevelLabel,
  publicRegistrationLabel,
} from "@/lib/tournaments/present";
import type { TournamentRecord } from "@/lib/tournaments/types";

export default function TournamentCard({
  tournament,
  locale,
  messages,
}: {
  tournament: TournamentRecord;
  locale: Locale;
  messages: Messages;
}) {
  const href = localePath(locale, `/tournaments/${tournament.slug}`);
  const d = messages.discover;
  const fee = tournament.priceLabel || lowestFee(tournament.categories, locale, d.fromFee);
  const time = formatClock(tournament.startTime, tournament.endTime);
  const place = [tournament.city, tournament.venueName].filter(Boolean).join(" · ");
  const canRegister = Boolean(tournament.registrationUrl) && (tournament.publicRegistration === "OPEN" || tournament.publicRegistration === "NOT_STARTED");

  return (
    <article className="flex h-full flex-col gap-3 border border-border bg-card/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">
          {tournament.eventType === "PLAY_SESSION" ? "🎾" : "🏆"} {eventTypeLabel(tournament.eventType, messages)}
        </p>
        <SaveButton id={tournament.id} saveLabel={d.save} savedLabel={d.saved} unsaveLabel={d.unsave} />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground">
        <Link href={href} className="hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          {tournament.name}
        </Link>
      </h3>
      <p className="text-sm font-medium text-foreground">{formatDateRange(tournament.startsOn, tournament.endsOn, locale)}</p>
      {time ? <p className="text-sm text-foreground/80">{time}</p> : null}
      <p className="text-sm text-foreground/80">{place || placeLine(tournament, locale)}</p>
      {tournament.eventFormat !== "MULTIPLE" ? <p className="text-sm text-foreground/80">{formatLabel(tournament.eventFormat, messages)}</p> : null}
      {tournament.playLevel ? <p className="text-sm text-foreground/80">{playLevelLabel(tournament.playLevel, messages)}</p> : null}
      {fee ? <p className="text-sm text-foreground/80">{fee}</p> : null}
      <RegistrationStatus status={tournament.publicRegistration} messages={messages} />
      {canRegister ? (
        <OutboundLink
          href={tournament.registrationUrl!}
          event="registration_click"
          tournamentId={tournament.id}
          className="mt-auto inline-flex w-fit rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
        >
          {d.register}
        </OutboundLink>
      ) : (
        <Link href={href} className="mt-auto inline-flex w-fit text-sm font-semibold text-accent hover:underline">
          {d.view}
        </Link>
      )}
    </article>
  );
}

export function RegistrationStatus({ status, messages }: { status: string; messages: Messages }) {
  const tone =
    status === "OPEN" ? "text-emerald-700" : status === "NOT_STARTED" ? "text-amber-700" : status === "FULL" ? "text-foreground" : "text-red-700";
  const mark = status === "OPEN" ? "🟢" : status === "NOT_STARTED" ? "🟡" : "🔴";
  const label = status === "FULL" ? messages.discover.fullyBooked : `${mark} ${publicRegistrationLabel(status, messages)}`;
  return <p className={`text-sm font-semibold ${tone}`}>{label}</p>;
}
