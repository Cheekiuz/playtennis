import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import OutboundLink from "@/components/OutboundLink";
import SaveButton from "@/components/SaveButton";
import SiteFrame from "@/components/SiteFrame";
import { getMessages, isValidLocale, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, routeAlternates } from "@/lib/seo";
import {
  categorySummary,
  disciplineLabel,
  environmentLabel,
  eventTypeLabel,
  formatClock,
  formatDateRange,
  formatDay,
  formatLabel,
  formatMoney,
  genderLabel,
  levelLabel,
  placeLine,
  playLevelLabel,
  surfaceLabel,
  translationFor,
} from "@/lib/tournaments/present";
import CheckedBadge from "@/components/CheckedBadge";
import { RegistrationStatus } from "@/components/TournamentCard";
import { getTournament } from "@/lib/tournaments/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const tournament = await getTournament(slug);
  if (!tournament) return {};
  const translation = translationFor(tournament, locale);
  const title = translation?.seoTitle || `${tournament.name} | PlayTennis.lt`;
  const description =
    translation?.seoDescription ||
    `${tournament.name}, ${placeLine(tournament, locale)}. ${formatDateRange(tournament.startsOn, tournament.endsOn, locale)}.`;
  const path = `/tournaments/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(localePath(locale, path)),
      languages: routeAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(localePath(locale, path)),
      type: "website",
    },
  };
}

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  if (!isValidLocale(raw)) notFound();
  const locale: Locale = raw;
  const messages = getMessages(locale);
  const tournament = await getTournament(slug);
  if (!tournament) notFound();

  const d = messages.discover;
  const translation = translationFor(tournament, locale);
  const sourceHref = tournament.officialUrl || tournament.sourceUrl || null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: tournament.name,
    startDate: tournament.startsOn,
    endDate: tournament.endsOn,
    eventStatus: schemaStatus(tournament.lifecycleStatus),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    sport: "Tennis",
    url: tournament.officialUrl || absoluteUrl(localePath(locale, `/tournaments/${tournament.slug}`)),
    location: {
      "@type": "Place",
      name: tournament.venueName || tournament.city,
      address: {
        "@type": "PostalAddress",
        streetAddress: tournament.venueAddress || undefined,
        addressLocality: tournament.city,
        addressCountry: tournament.countryCode.toUpperCase(),
      },
    },
  };

  return (
    <SiteFrame locale={locale} messages={messages}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-sm text-foreground/70">
        <Link href={localePath(locale, "/tournaments")} className="hover:text-foreground">
          {messages.nav.tournaments}
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight">{tournament.name}</h1>
        <SaveButton id={tournament.id} saveLabel={d.save} savedLabel={d.saved} unsaveLabel={d.unsave} />
      </div>
      <p className="mt-3 text-sm font-bold uppercase tracking-wide text-accent">{eventTypeLabel(tournament.eventType, messages)}</p>
      <p className="mt-3 text-lg text-foreground/80">{placeLine(tournament, locale)}</p>
      <p className="mt-2 text-lg font-medium">
        {formatDateRange(tournament.startsOn, tournament.endsOn, locale)}
        {formatClock(tournament.startTime, tournament.endTime) ? ` · ${formatClock(tournament.startTime, tournament.endTime)}` : ""}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <RegistrationStatus status={tournament.publicRegistration} messages={messages} />
        {tournament.verificationStatus === "verified" ? (
          <CheckedBadge verifiedAt={tournament.lastVerifiedAt} locale={locale} messages={messages} />
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-start gap-3">
        {tournament.organizerName ? (
          <p className="text-sm text-foreground/80">
            {d.organizer}: {tournament.organizerName}
          </p>
        ) : null}
        {tournament.registrationUrl ? (
          <OutboundLink
            href={tournament.registrationUrl}
            event="registration_click"
            tournamentId={tournament.id}
            className="btn-primary inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold"
          >
            {d.register}
          </OutboundLink>
        ) : null}
        {sourceHref ? (
          <OutboundLink
            href={sourceHref}
            event="official_click"
            tournamentId={tournament.id}
            className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
          >
            {tournament.officialUrl ? d.official : d.officialSource} →
          </OutboundLink>
        ) : null}
      </div>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <Fact label={d.location} value={`${surfaceLabel(tournament.surface, messages)} · ${environmentLabel(tournament.environment, messages)}`} />
        {tournament.eventFormat !== "MULTIPLE" ? <Fact label={d.format} value={formatLabel(tournament.eventFormat, messages)} /> : null}
        {tournament.playLevel ? <Fact label={d.playLevel} value={playLevelLabel(tournament.playLevel, messages)} /> : null}
        {tournament.priceLabel ? <Fact label={d.fromFee} value={tournament.priceLabel} /> : null}
        {tournament.venueName ? <Fact label={d.venue} value={[tournament.venueName, tournament.venueAddress].filter(Boolean).join(", ")} /> : null}
        {tournament.originalSourceUrl && tournament.originalSourceUrl !== tournament.sourceUrl ? (
          <Fact label={d.source} value={tournament.sourceName || tournament.sourceUrl} />
        ) : null}
        {tournament.registrationDeadline ? (
          <Fact label={d.deadline} value={formatDay(tournament.registrationDeadline, locale)} />
        ) : null}
        {categorySummary(tournament.categories, messages) ? (
          <Fact label={d.categories} value={categorySummary(tournament.categories, messages)} />
        ) : null}
      </dl>

      {tournament.categories.length > 0 ? (
      <>
      <h2 className="mt-10 text-2xl font-bold">{d.categories}</h2>
      <ul className="mt-4 grid gap-3">
        {tournament.categories.map((category) => (
          <li key={category.id} className="border border-border px-4 py-3 text-sm">
            <p className="font-semibold">
              {genderLabel(category.gender, messages)}
              {category.ageLabel ? ` ${category.ageLabel}` : ""} · {disciplineLabel(category.discipline, messages)}
            </p>
            <p className="mt-1 text-foreground/70">
              {levelLabel(category.level, messages)}
              {category.entryFeeAmount != null && category.currency
                ? ` · ${formatMoney(category.entryFeeAmount, category.currency, locale)}`
                : ""}
            </p>
            {category.rankingRequirement ? <p className="mt-1 text-foreground/70">{category.rankingRequirement}</p> : null}
          </li>
        ))}
      </ul>
      </>
      ) : null}

      {translation?.description ? <p className="mt-8 max-w-2xl leading-relaxed text-foreground/80">{translation.description}</p> : null}
      {tournament.prizeSummary ? <p className="mt-4 text-sm text-foreground/80">{tournament.prizeSummary}</p> : null}

      {tournament.latitude != null && tournament.longitude != null ? (
        <p className="mt-6">
          <a
            className="text-sm font-semibold text-accent hover:underline"
            href={`https://www.openstreetmap.org/?mlat=${tournament.latitude}&mlon=${tournament.longitude}#map=14/${tournament.latitude}/${tournament.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            {d.mapLink}
          </a>
        </p>
      ) : null}

      {tournament.contactEmail ? (
        <p className="mt-8 text-sm">
          <a className="font-semibold text-foreground/80 hover:text-foreground" href={`mailto:${tournament.contactEmail}`}>
            {d.contact}
          </a>
        </p>
      ) : null}
      {tournament.sourceName ? <p className="mt-4 text-sm text-foreground/60">{d.source}: {tournament.sourceName}</p> : null}
    </SiteFrame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-foreground/50 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function schemaStatus(status: string): string {
  if (status === "cancelled") return "https://schema.org/EventCancelled";
  if (status === "postponed") return "https://schema.org/EventPostponed";
  return "https://schema.org/EventScheduled";
}
