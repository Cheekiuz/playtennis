import {
  fetchTournatedUpcoming,
  mapTournatedItem,
  TOURNATED_LT,
  TOURNATED_LV,
} from "@/lib/discovery/tournated-public";
import type { RawObservation, SourceType } from "@/lib/discovery/types";

/**
 * Each source is its own connector. Collect only returns observations the
 * connector is allowed to read: official APIs, public feeds, structured data,
 * public event pages, or permitted integrations.
 * Do not log in, open private groups, solve CAPTCHA, or bypass access controls.
 * Respect robots.txt, site terms, API policies, rate limits, copyright, and privacy.
 */
export type SourceConnector = {
  id: string;
  name: string;
  sourceType: SourceType;
  countryCode: string | null;
  listUrl?: string;
  collect: () => Promise<RawObservation[]>;
};

/** Player submissions enter through the review queue, not a scraper. */
export const userSubmissionConnector: SourceConnector = {
  id: "user_submission",
  name: "Player submission",
  sourceType: "user_submission",
  countryCode: null,
  async collect() {
    return [];
  },
};

/** Official LTS calendar via Tournated public GraphQL (play.tennis.lt). */
export const ltsPlayTennisConnector: SourceConnector = {
  id: "tournated_lt",
  name: TOURNATED_LT.sourceName,
  sourceType: "federation",
  countryCode: "lt",
  listUrl: `${TOURNATED_LT.siteOrigin}/tournaments`,
  async collect() {
    const items = await fetchTournatedUpcoming(TOURNATED_LT);
    return items.map((item) => mapTournatedItem(item, TOURNATED_LT));
  },
};

/** Official LTS calendar via Tournated public GraphQL (play.teniss.lat). */
export const lvPlayTennisConnector: SourceConnector = {
  id: "tournated_lv",
  name: TOURNATED_LV.sourceName,
  sourceType: "federation",
  countryCode: "lv",
  listUrl: `${TOURNATED_LV.siteOrigin}/tournaments`,
  async collect() {
    const items = await fetchTournatedUpcoming(TOURNATED_LV);
    return items.map((item) => mapTournatedItem(item, TOURNATED_LV));
  },
};

export const federationConnectors = [ltsPlayTennisConnector, lvPlayTennisConnector] as const;

export function manualConnector(observations: RawObservation[]): SourceConnector {
  return {
    id: "manual",
    name: "Manual curation",
    sourceType: "other",
    countryCode: null,
    async collect() {
      return observations;
    },
  };
}
