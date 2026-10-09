import { shouldExcludeRaw } from "@/lib/discovery/adult-filter";
import { CONFLICTING_SOURCE, DISCOVERY_FIXTURES, DUPLICATE_SOURCE } from "@/lib/discovery/fixtures";
import { normalizeObservation, registrationFromSource, standardiseLevel } from "@/lib/discovery/normalize";
import { isPubliclyChecked } from "@/lib/discovery/review";
import type { RawObservation } from "@/lib/discovery/types";
import { applyDecision, isUpcoming, preparePublication } from "@/lib/discovery/workflow";

const TODAY = "2026-10-08";

export function runDiscoveryChecks(): string[] {
  const failures: string[] = [];
  const check = (name: string, ok: boolean) => {
    if (!ok) failures.push(name);
  };

  check("every fixture is isolated test data", DISCOVERY_FIXTURES.every((item) => item.isTest === true));
  check("duplicate and conflict samples are test data", DUPLICATE_SOURCE.isTest === true && CONFLICTING_SOURCE.isTest === true);

  const countries = new Set(DISCOVERY_FIXTURES.map((item) => item.countryCode));
  for (const code of ["lt", "lv", "es", "se", "de", "gb", "us", "au", "jp"]) {
    check(`fixture country ${code}`, countries.has(code));
  }

  const normalized = DISCOVERY_FIXTURES.map(normalizeObservation);
  const byCity = (city: string) => normalized.find((item) => item.city === city);

  const vilnius = byCity("Vilnius");
  const barcelona = normalized.find((item) => item.city === "Barcelona");
  const austin = byCity("Austin");
  const tokyo = byCity("Tokyo");
  const melbourne = byCity("Melbourne");
  const london = byCity("London");
  const stockholm = byCity("Stockholm");
  const social = normalized.find((item) => item.sourceType === "social_media");
  const official = DISCOVERY_FIXTURES[0];

  check("one-day event keeps a single date", vilnius?.startDate === "2026-10-17" && vilnius.endDate === "2026-10-17");
  check("multi-day event keeps both dates", barcelona?.startDate === "2026-11-07" && barcelona.endDate === "2026-11-08");
  check("intermediate wording is kept and standardised", vilnius?.originalLevel === "Intermediate" && vilnius.standardisedLevel === "intermediate");
  check("NTRP wording is kept without a conversion", austin?.originalLevel === "NTRP 3.5" && austin.standardisedLevel == null);
  check("ITN wording is kept without a conversion", tokyo?.originalLevel === "ITN 6" && tokyo.standardisedLevel == null);
  check("D-level wording is kept without a conversion", normalized.find((item) => item.city === "Berlin")?.standardisedLevel == null);
  check("amateur wording is kept without a conversion", standardiseLevel("Amateur").standardisedLevel == null);
  check("timezones stay local", barcelona?.timezone === "Europe/Madrid" && tokyo?.timezone === "Asia/Tokyo" && austin?.timezone === "America/Chicago");
  check("a missing timezone is not filled with Vilnius", normalizeObservation(withoutTimezone()).timezone == null);
  check("currencies stay original", stockholm?.currency === "SEK" && london?.currency === "GBP" && austin?.currency === "USD" && tokyo?.currency === "JPY" && tokyo.priceAmount === 3000);
  check("surface and indoor stay separate", vilnius?.surface === "hard" && vilnius.indoorOutdoor === "indoor" && london?.surface === "grass");
  check("unknown surface stays unknown", tokyo?.surface === "unknown");
  check("future event without a status is not marked open", registrationFromSource(null) === "UNKNOWN" && melbourne?.registrationStatus === "UNKNOWN");
  check("coming soon, full, and closed stay as stated", barcelona?.registrationStatus === "NOT_STARTED" && normalized.find((item) => item.city === "Berlin")?.registrationStatus === "FULL" && london?.registrationStatus === "CLOSED");
  check("women, boys, and senior age labels are kept", stockholm?.gender === "women" && melbourne?.gender === "boys" && melbourne.ageGroup === "U12" && london?.ageGroup === "40+");
  const melbourneRaw = DISCOVERY_FIXTURES.find((item) => item.city === "Melbourne");
  const vilniusRaw = DISCOVERY_FIXTURES.find((item) => item.city === "Vilnius");
  check(
    "under-18 tournaments are not ingested",
    melbourneRaw != null && shouldExcludeRaw(melbourneRaw) === "junior_only",
  );
  check(
    "adult open tournaments are not treated as junior",
    vilniusRaw != null && shouldExcludeRaw(vilniusRaw) === null,
  );
  const past = normalizeObservation({ ...(DISCOVERY_FIXTURES.find((item) => item.city === "Hamburg") as RawObservation), isTest: false });
  const future = normalizeObservation({ ...official, isTest: false });
  check("past events stay addressable but leave the upcoming set", past.endDate < TODAY && isUpcoming(past, TODAY) === false);
  check("a future event stays in the upcoming set", isUpcoming(future, TODAY));
  check("test rows never count as upcoming", normalized.every((item) => isUpcoming(item, TODAY) === false));

  const created = preparePublication([], official);
  check("official club event is created", created.action === "create");
  check("test events are not published", created.action === "create" && created.publish === false);

  const catalog = applyDecision([], official, created);
  const merged = preparePublication(catalog, DUPLICATE_SOURCE);
  check("same URL and place attach to one event", merged.action === "attach_source");
  const withSource = applyDecision(catalog, DUPLICATE_SOURCE, merged);
  check("two sources, one public event", withSource.length === 1 && withSource[0].sources.length === 2);

  const conflict = preparePublication(catalog, CONFLICTING_SOURCE);
  check("date disagreement is flagged", conflict.action === "review" && conflict.reviewStatus === "conflicting");
  const afterConflict = applyDecision(catalog, CONFLICTING_SOURCE, conflict);
  check("conflicting date is not overwritten", afterConflict[0].startDate === "2026-10-17" && afterConflict[0].reviewStatus === "conflicting");

  const elsewhere = preparePublication(catalog, {
    ...official,
    title: "Saturday Amateur Open",
    city: "Barcelona",
    countryCode: "es",
    timezone: "Europe/Madrid",
    officialEventUrl: "https://example.com/es/other-open",
    registrationUrl: "https://example.com/es/other-open/register",
    sourceUrl: "https://example.com/es/other-open",
  });
  check("the same title in another city stays a separate event", elsewhere.action === "create");

  const socialDecision = preparePublication([], DISCOVERY_FIXTURES.find((item) => item.sourceType === "social_media") as RawObservation);
  check(
    "social media lists when parsed but stays unverified",
    socialDecision.action === "create" && socialDecision.publish === true && socialDecision.reviewStatus === "needs_review",
  );
  check("social media event was normalised", social?.sourceConfidence === "low");

  const live = preparePublication([], { ...official, isTest: false });
  check("a complete official event can publish without claiming it was checked", live.action === "create" && live.publish === true && live.reviewStatus === "unknown");

  check(
    "checked badge needs a real review",
    isPubliclyChecked({ verificationStatus: "verified", reviewStatus: "checked", lastVerifiedAt: "2026-10-08" }) &&
      isPubliclyChecked({ verificationStatus: "verified", reviewStatus: "unknown", lastVerifiedAt: "2026-10-08" }) &&
      !isPubliclyChecked({ verificationStatus: "verified", reviewStatus: "needs_review", lastVerifiedAt: "2026-10-08" }) &&
      !isPubliclyChecked({ verificationStatus: "needs_verification", reviewStatus: "unknown", lastVerifiedAt: null }),
  );

  return failures;
}

function withoutTimezone(): RawObservation {
  return {
    ...DISCOVERY_FIXTURES[0],
    timezone: null,
    sourceUrl: "https://example.com/missing-timezone",
  };
}
