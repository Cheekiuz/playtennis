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
  formatDateRange,
  formatDay,
  formatMoney,
  genderLabel,
  levelLabel,
  lifecycleLabel,
  placeLine,
  surfaceLabel,
  translationFor,
} from "@/lib/tournaments/present";
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
  const primaryHref = tournament.registrationUrl || tournament.officialUrl;
  const primaryLabel = tournament.registrationUrl ? d.register : d.official;
  const checked = tournament.lastVerifiedAt ? formatDay(tournament.lastVerifiedAt, locale) : null;
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
      <p className="mt-3 text-lg text-foreground/80">{placeLine(tournament, locale)}</p>
      <p className="mt-2 text-lg font-medium">{formatDateRange(tournament.startsOn, tournament.endsOn, locale)}</p>
      <p className="mt-4 text-sm font-semibold text-accent">{lifecycleLabel(tournament.lifecycleStatus, messages)}</p>

      {primaryHref ? (
        <OutboundLink
          href={primaryHref}
          event={tournament.registrationUrl ? "registration_click" : "official_click"}
          tournamentId={tournament.id}
          className="btn-primary btn-glow mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold"
        >
          {primaryLabel}
        </OutboundLink>
      ) : null}

      <dl className="mt-10 grid gap-4 sm:grid-cols-2">
        <Fact label={d.location} value={`${surfaceLabel(tournament.surface, messages)} · ${environmentLabel(tournament.environment, messages)}`} />
        {tournament.venueName ? <Fact label={d.venue} value={[tournament.venueName, tournament.venueAddress].filter(Boolean).join(", ")} /> : null}
        {tournament.registrationDeadline ? (
          <Fact label={d.deadline} value={formatDay(tournament.registrationDeadline, locale)} />
        ) : null}
        {categorySummary(tournament.categories, messages) ? (
          <Fact label={d.categories} value={categorySummary(tournament.categories, messages)} />
        ) : null}
      </dl>

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

      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        {tournament.officialUrl && tournament.registrationUrl ? (
          <OutboundLink href={tournament.officialUrl} event="official_click" tournamentId={tournament.id} className="font-semibold text-accent hover:underline">
            {d.official}
          </OutboundLink>
        ) : null}
        {tournament.contactEmail ? (
          <a className="text-foreground/80 hover:text-foreground" href={`mailto:${tournament.contactEmail}`}>
            {d.contact}
          </a>
        ) : null}
      </div>

      <p className="mt-8 text-sm text-foreground/60">
        {d.source}: {tournament.sourceName || tournament.sourceUrl}
        {checked ? ` · ${d.checked} ${checked}` : ""}
        {tournament.sourceUrl ? (
          <>
            {" · "}
            <a href={tournament.sourceUrl} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
              {tournament.sourceUrl}
            </a>
          </>
        ) : null}
      </p>
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
