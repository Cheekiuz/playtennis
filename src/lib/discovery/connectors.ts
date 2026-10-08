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
