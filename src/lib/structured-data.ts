import { getMessages, localePath, type Locale } from "@/lib/i18n";
import { absoluteUrl, getSiteUrl, SITE_NAME } from "@/lib/seo";
import { tournamentDescription } from "@/lib/tournaments/seo-copy";
import type { TournamentRecord } from "@/lib/tournaments/types";

type Node = Record<string, unknown>;

export const ORGANIZATION_ID = () => `${getSiteUrl()}/#organization`;
export const WEBSITE_ID = () => `${getSiteUrl()}/#website`;

const LOGO_PATH = "/tennis-ball-sprite.png";

/** Wraps nodes in a single schema.org graph. */
export function graph(...nodes: (Node | null | undefined | false)[]): Node {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}

export function organizationNode(locale: Locale): Node {
  const m = getMessages(locale);
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID(),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(LOGO_PATH),
      width: 1024,
      height: 1024,
    },
    description: m.meta.description,
    slogan: m.discover.builtBy,
    areaServed: ["Lithuania", "Latvia", "Estonia"].map((name) => ({ "@type": "Country", name })),
    knowsAbout: ["Tennis", "Amateur tennis tournaments", "Masters tennis", "Tennis events"],
  };
}

export function websiteNode(locale: Locale): Node {
  const m = getMessages(locale);
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID(),
    name: m.meta.siteName,
    url: absoluteUrl(localePath(locale)),
    description: m.meta.description,
    inLanguage: ["lt", "en"],
    publisher: { "@id": ORGANIZATION_ID() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl(localePath(locale, "/tournaments"))}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Site-wide graph: organisation and website. Rendered once from the root layout. */
export function buildSiteGraph(locale: Locale): Node {
  return graph(organizationNode(locale), websiteNode(locale));
}

export function breadcrumbNode(items: { name: string; path: string }[], locale: Locale): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localePath(locale, item.path)),
    })),
  };
}

export function itemListNode(items: { name: string; url: string }[]): Node {
  return {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function collectionPageNode(input: {
  locale: Locale;
  path: string;
  name: string;
  description: string;
  items: { name: string; url: string }[];
  dateModified?: string | null;
}): Node {
  const url = absoluteUrl(localePath(input.locale, input.path));
  return {
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name: input.name,
    description: input.description,
    inLanguage: input.locale,
    isPartOf: { "@id": WEBSITE_ID() },
    publisher: { "@id": ORGANIZATION_ID() },
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
    mainEntity: itemListNode(input.items),
  };
}

export function aboutPageNode(input: { locale: Locale; path: string; name: string; description: string }): Node {
  const url = absoluteUrl(localePath(input.locale, input.path));
  return {
    "@type": "AboutPage",
    "@id": `${url}#page`,
    url,
    name: input.name,
    description: input.description,
    inLanguage: input.locale,
    isPartOf: { "@id": WEBSITE_ID() },
    about: { "@id": ORGANIZATION_ID() },
  };
}

export type FaqItem = { question: string; answer: string };

export function faqNode(items: FaqItem[], locale: Locale): Node | null {
  if (items.length === 0) return null;
  return {
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

function eventStatus(status: string): string {
  if (status === "cancelled") return "https://schema.org/EventCancelled";
  if (status === "postponed") return "https://schema.org/EventPostponed";
  return "https://schema.org/EventScheduled";
}

/** Rich `SportsEvent` for a tournament detail page. */
export function sportsEventNode(tournament: TournamentRecord, locale: Locale): Node {
  const url = absoluteUrl(localePath(locale, `/tournaments/${tournament.slug}`));
  const description = tournamentDescription(tournament, locale, getMessages(locale), 300);
  const offerUrl = tournament.registrationUrl || tournament.officialUrl || url;
  const startDate = tournament.startTime ? `${tournament.startsOn}T${tournament.startTime}` : tournament.startsOn;
  const endDate = tournament.endTime ? `${tournament.endsOn}T${tournament.endTime}` : tournament.endsOn;
  const hasGeo = tournament.latitude != null && tournament.longitude != null;

  return {
    "@type": "SportsEvent",
    "@id": `${url}#event`,
    name: tournament.name,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: locale,
    sport: "Tennis",
    startDate,
    endDate,
    eventStatus: eventStatus(tournament.lifecycleStatus),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: tournament.imageUrl || absoluteUrl("/tennis-ball-og.webp"),
    dateModified: tournament.updatedAt,
    isAccessibleForFree: tournament.priceAmount === 0 ? true : undefined,
    location: {
      "@type": "Place",
      name: tournament.venueName || tournament.city,
      address: {
        "@type": "PostalAddress",
        streetAddress: tournament.venueAddress || undefined,
        addressLocality: tournament.city,
        addressRegion: tournament.region || undefined,
        addressCountry: tournament.countryCode.toUpperCase(),
      },
      ...(hasGeo
        ? { geo: { "@type": "GeoCoordinates", latitude: tournament.latitude, longitude: tournament.longitude } }
        : {}),
    },
    organizer: tournament.organizerName
      ? {
          "@type": "Organization",
          name: tournament.organizerName,
          url: tournament.organizerWebsite || undefined,
        }
      : { "@id": ORGANIZATION_ID() },
    ...(tournament.priceAmount != null
      ? {
          offers: {
            "@type": "Offer",
            price: tournament.priceAmount,
            priceCurrency: tournament.priceCurrency || "EUR",
            url: offerUrl,
            availability:
              tournament.publicRegistration === "OPEN"
                ? "https://schema.org/InStock"
                : tournament.publicRegistration === "FULL"
                  ? "https://schema.org/SoldOut"
                  : undefined,
            validThrough: tournament.registrationDeadline || undefined,
          },
        }
      : {}),
  };
}
