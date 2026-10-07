import Link from "next/link";
import SaveButton from "@/components/SaveButton";
import type { Locale, Messages } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import {
  categorySummary,
  formatDateRange,
  formatDay,
  lifecycleLabel,
  lowestFee,
  placeLine,
  registrationLabel,
  surfaceLine,
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
  const fee = lowestFee(tournament.categories, locale, messages.discover.fromFee);
  const summary = categorySummary(tournament.categories, messages);
  const deadline = tournament.registrationDeadline
    ? formatDay(tournament.registrationDeadline, locale)
    : null;
  const registration =
    tournament.registrationStatus === "open" && deadline
      ? `${registrationLabel("open", messages)} ${messages.discover.until} ${deadline}`
      : tournament.lifecycleStatus === "registration_open" && deadline
        ? `${lifecycleLabel("registration_open", messages)} ${messages.discover.until} ${deadline}`
        : lifecycleLabel(tournament.lifecycleStatus, messages);

  return (
    <article className="flex h-full flex-col gap-3 border border-border bg-card/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold tracking-tight text-foreground">
          <Link href={href} className="hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {tournament.name}
          </Link>
        </h3>
        <SaveButton
          id={tournament.id}
          saveLabel={messages.discover.save}
          savedLabel={messages.discover.saved}
          unsaveLabel={messages.discover.unsave}
        />
      </div>
      <p className="text-sm text-foreground/80">{placeLine(tournament, locale)}</p>
      <p className="text-sm font-medium text-foreground">{formatDateRange(tournament.startsOn, tournament.endsOn, locale)}</p>
      <p className="text-sm text-foreground/80">{surfaceLine(tournament, messages)}</p>
      {summary ? <p className="text-sm text-foreground/80">{summary}</p> : null}
      <p className="text-sm text-foreground">{registration}</p>
      {fee ? <p className="text-sm text-foreground/80">{fee}</p> : null}
      <Link
        href={href}
        className="mt-auto inline-flex w-fit text-sm font-semibold text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {messages.discover.view}
      </Link>
    </article>
  );
}
