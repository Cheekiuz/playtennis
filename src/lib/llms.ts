import { MIN_INDEXABLE_PLACE_EVENTS, placeSlug } from "@/lib/discovery/places";
import { getMessages, localePath } from "@/lib/i18n";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { regionName } from "@/lib/tournaments/countries";
import { formatDateRange, registrationLabel } from "@/lib/tournaments/present";
import { listEventPlaces, listSectionTournaments } from "@/lib/tournaments/queries";
import { tournamentFacts, tournamentPlace } from "@/lib/tournaments/seo-copy";

export const LLMS_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

const FULL_LIMIT_PER_SECTION = 150;

/** Short, citation-friendly site summary for AI agents (llms.txt convention). */
export async function buildLlmsTxt(): Promise<string> {
  const en = getMessages("en");
  const site = getSiteUrl();
  const places = await listEventPlaces("en");

  const countries = places.countries
    .filter((country) => country.count >= MIN_INDEXABLE_PLACE_EVENTS)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((country) => {
      const slug = placeSlug(regionName(country.code, "en"));
      return slug ? `- [Tennis events in ${country.name}](${absoluteUrl(localePath("en", `/events/${slug}`))}): ${country.count} upcoming events` : null;
    })
    .filter((line): line is string => Boolean(line));

  const countrySlugs = new Set(places.countries.map((country) => placeSlug(regionName(country.code, "en"))));
  const cities = places.cityPlaces
    .filter((city) => city.count >= MIN_INDEXABLE_PLACE_EVENTS)
    .map((city) => ({ slug: placeSlug(city.city), city }))
    .filter((item) => item.slug && !countrySlugs.has(item.slug))
    .slice(0, 12)
    .map(({ slug, city }) => `- [Tennis events in ${city.city}](${absoluteUrl(localePath("en", `/events/${slug}`))}): ${city.count} upcoming events`);

  const lines = [
    "# PlayTennis.lt",
    "",
    `> ${en.meta.description} PlayTennis.lt is an independent calendar. It does not organise tournaments, sell memberships or take entry fees. Registration and payment always happen with the official organiser.`,
    "",
    "## What this site is",
    "",
    "- An independent calendar of adult amateur and masters tennis tournaments and organised play.",
    "- Coverage: Lithuania first, then Latvia and Estonia, plus the ITF World Tennis Masters Tour worldwide.",
    "- Languages: Lithuanian (/lt) and English (/en). Every page exists in both languages.",
    "- Every event page links to the official organiser or original source. Events marked Checked were reviewed against the organiser's official source.",
    "",
    "## Key pages",
    "",
    `- [Tournament calendar](${absoluteUrl(localePath("en", "/tournaments"))}): all upcoming events with filters for date, city, format, surface and level`,
    `- [Lithuania](${absoluteUrl(localePath("en", "/lithuania"))}): adult amateur tournaments in Lithuania`,
    `- [Baltic States](${absoluteUrl(localePath("en", "/baltics"))}): tournaments in Latvia and Estonia`,
    `- [ITF Masters](${absoluteUrl(localePath("en", "/itf"))}): ITF World Tennis Masters Tour calendar (ages 30+)`,
    `- [About and how we verify events](${absoluteUrl(localePath("en", "/about"))})`,
    `- [Submit an event](${absoluteUrl(localePath("en", "/submit"))})`,
    "",
  ];

  if (countries.length > 0 || cities.length > 0) {
    lines.push("## Places", "", ...countries, ...cities, "");
  }

  lines.push(
    "## Machine-readable resources",
    "",
    `- [Full list of upcoming tournaments](${site}/llms-full.txt): plain text, refreshed hourly`,
    `- [Sitemap](${site}/sitemap.xml)`,
    "- Structured data: every tournament page publishes schema.org SportsEvent JSON-LD with dates, venue, coordinates, organiser, fee and status.",
    "",
    "## Citation guidance",
    "",
    "- Cite the specific event or place page URL and mention the date shown on it. Tournament dates, fees and registration status can change.",
    "- Tell users to confirm details with the official organiser before travelling or paying.",
    "- Sample or illustrative records are never listed on public pages.",
    "",
  );

  return lines.join("\n");
}

/** Plain-text list of upcoming tournaments for AI agents and retrieval pipelines. */
export async function buildLlmsFullTxt(): Promise<string> {
  const en = getMessages("en");
  const sections = ["lithuania", "baltics", "itf"] as const;
  const results = await Promise.all(sections.map((section) => listSectionTournaments(section, "upcoming", FULL_LIMIT_PER_SECTION, 1)));

  const seen = new Set<string>();
  const lines = [
    "# PlayTennis.lt: upcoming tennis tournaments",
    "",
    `> Generated ${new Date().toISOString().slice(0, 10)}. Source: ${getSiteUrl()}. Dates, fees and registration status can change, so confirm with the official organiser.`,
    "",
  ];

  sections.forEach((section, index) => {
    const items = results[index].items.filter((tournament) => {
      if (tournament.isTest || seen.has(tournament.id)) return false;
      seen.add(tournament.id);
      return true;
    });
    if (items.length === 0) return;
    lines.push(`## ${en.catalog.sections[section]}`, "");
    for (const tournament of items) {
      const url = absoluteUrl(localePath("en", `/tournaments/${tournament.slug}`));
      const facts = tournamentFacts(tournament, "en", en);
      const parts = [
        `${tournamentPlace(tournament, "en")}.`,
        `${formatDateRange(tournament.startsOn, tournament.endsOn, "en")}.`,
        facts.length > 0 ? `${facts.join(", ")}.` : null,
        tournament.venueName ? `Venue: ${tournament.venueName}.` : null,
        tournament.organizerName ? `Organiser: ${tournament.organizerName}.` : null,
        tournament.registrationStatus ? `${registrationLabel(tournament.registrationStatus, en)}.` : null,
      ].filter(Boolean);
      lines.push(`- [${tournament.name}](${url}): ${parts.join(" ")}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}
