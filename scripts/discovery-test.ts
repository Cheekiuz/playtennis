import { collectFromRegistrySource } from "../src/lib/discovery/adapters";
import { extractFromFacebookText } from "../src/lib/discovery/facebook/extract";
import { FACEBOOK_SAMPLE_POSTS } from "../src/lib/discovery/facebook/samples";
import { runDiscoveryPipeline } from "../src/lib/discovery/discovery-pipeline";
import { REGISTRY_SEEDS } from "../src/lib/discovery/registry-seeds";

async function main() {
  process.env.DISCOVERY_VERIFY_FACEBOOK_SAMPLES = "true";

  const sources = REGISTRY_SEEDS.filter((source) => source.active);
  const report = {
    activeSourcesConfigured: sources.length,
    sourceResults: [] as Array<Record<string, unknown>>,
    facebookParserVerification: [] as Array<Record<string, unknown>>,
    totals: {
      discovered: 0,
      duplicatesDetected: 0,
      excludedJunior: 0,
      excludedClosedPrivate: 0,
      excludedOther: 0,
      published: 0,
    },
    facebookManualHandling: [] as string[],
    failedSources: [] as Array<{ sourceName: string; reason: string }>,
    missingSourcesToAdd: [
      "TenisoNamai Facebook page",
      "Topspin Facebook page",
      "iMatch Facebook page",
      "Palanga / Druskininkai / Birštonas venue calendars",
    ],
  };

  for (const [key, sample] of Object.entries({
    Tenisininkai: { source: sources.find((s) => s.sourceName === "Tenisininkai"), post: FACEBOOK_SAMPLE_POSTS.tenisininkai },
    "TENISO TURNYRAI": { source: sources.find((s) => s.sourceName === "TENISO TURNYRAI"), post: FACEBOOK_SAMPLE_POSTS.tenisoTurnyrai },
  })) {
    if (!key || !sample.source) continue;
    const parsed = extractFromFacebookText(sample.source, sample.post);
    report.facebookParserVerification.push({
      source: key,
      ok: Boolean(parsed),
      title: parsed?.title ?? null,
      startDate: parsed?.startDate ?? null,
      city: parsed?.city ?? null,
      venue: parsed?.venue ?? null,
      organiser: parsed?.organiser ?? null,
      sourceUrl: parsed?.sourceUrl ?? null,
    });
  }

  for (const source of sources) {
    const adapter = await collectFromRegistrySource(source);
    const pipeline = runDiscoveryPipeline(adapter.observations, []);
    report.totals.discovered += pipeline.discovered;
    report.totals.duplicatesDetected += pipeline.duplicatesDetected;
    report.totals.excludedJunior += pipeline.excludedJunior;
    report.totals.excludedClosedPrivate += pipeline.closedOrInvitation;
    report.totals.excludedOther += pipeline.excludedOther;
    report.totals.published += pipeline.published;

    if (adapter.requiresManualHandling) report.facebookManualHandling.push(source.sourceName);
    if (adapter.errors.length > 0 && adapter.observations.length === 0) {
      report.failedSources.push({ sourceName: source.sourceName, reason: adapter.errors[0] ?? "unknown" });
    }

    report.sourceResults.push({
      sourceName: source.sourceName,
      registrySourceType: source.registrySourceType,
      scrapingMethod: source.scrapingMethod,
      discovered: adapter.observations.length,
      verificationSamplesParsed: adapter.verificationSamplesParsed,
      sampleTitles: adapter.observations.slice(0, 3).map((row) => row.title),
      errors: adapter.errors,
      requiresManualHandling: adapter.requiresManualHandling,
    });
  }

  console.log(JSON.stringify(report, null, 2));

  const parserOk = report.facebookParserVerification.every((row) => row.ok === true);
  if (!parserOk) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
