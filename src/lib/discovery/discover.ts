import { collectFromRegistrySource } from "@/lib/discovery/adapters";
import { runDiscoveryPipeline, type PipelineSummary } from "@/lib/discovery/discovery-pipeline";
import { ingestObservationsFromRegistry } from "@/lib/discovery/ingest";
import { loadActiveRegistrySources } from "@/lib/discovery/registry";
import type { RegistrySource } from "@/lib/discovery/registry-types";

export type DiscoveryRunReport = {
  activeSources: number;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    registrySourceType: string;
    scrapingMethod: string;
    discovered: number;
    ingested: { created: number; updated: number; attached: number; review: number; rejected: number };
    errors: string[];
    requiresManualHandling: boolean;
    verificationSamplesParsed: number;
  }>;
  pipeline: PipelineSummary;
  totals: {
    discovered: number;
    duplicatesDetected: number;
    excludedJunior: number;
    excludedClosedPrivate: number;
    excludedOther: number;
    published: number;
  };
  facebookManualHandling: string[];
  failedSources: Array<{ sourceName: string; reason: string }>;
};

export function discoveryIsEnabled(): boolean {
  return process.env.DISCOVERY_ENABLED === "true" || process.env.INGEST_ENABLED === "true";
}

export async function runRegistryDiscovery(options?: { dryRun?: boolean }): Promise<DiscoveryRunReport> {
  const sources = await loadActiveRegistrySources();
  const dryRun = options?.dryRun ?? process.env.INGEST_DRY_RUN === "true";

  const report: DiscoveryRunReport = {
    activeSources: sources.length,
    sources: [],
    pipeline: {
      discovered: 0,
      parsed: 0,
      deduplicated: 0,
      validated: 0,
      published: 0,
      excludedJunior: 0,
      excludedOther: 0,
      closedOrInvitation: 0,
      duplicatesDetected: 0,
      items: [],
    },
    totals: {
      discovered: 0,
      duplicatesDetected: 0,
      excludedJunior: 0,
      excludedClosedPrivate: 0,
      excludedOther: 0,
      published: 0,
    },
    facebookManualHandling: [],
    failedSources: [],
  };

  for (const source of sources) {
    const adapter = await collectFromRegistrySource(source);
    const pipeline = runDiscoveryPipeline(adapter.observations, []);
    report.pipeline.discovered += pipeline.discovered;
    report.pipeline.parsed += pipeline.parsed;
    report.pipeline.deduplicated += pipeline.deduplicated;
    report.pipeline.validated += pipeline.validated;
    report.pipeline.published += pipeline.published;
    report.pipeline.excludedJunior += pipeline.excludedJunior;
    report.pipeline.excludedOther += pipeline.excludedOther;
    report.pipeline.closedOrInvitation += pipeline.closedOrInvitation;
    report.pipeline.duplicatesDetected += pipeline.duplicatesDetected;
    report.pipeline.items.push(...pipeline.items);

    const ingest = await ingestObservationsFromRegistry(source, adapter.observations, { dryRun });

    report.sources.push({
      sourceId: source.id,
      sourceName: source.sourceName,
      registrySourceType: source.registrySourceType,
      scrapingMethod: source.scrapingMethod,
      discovered: adapter.observations.length,
      ingested: {
        created: ingest.created,
        updated: ingest.updated,
        attached: ingest.attached,
        review: ingest.review,
        rejected: ingest.rejected,
      },
      errors: [...adapter.errors, ...ingest.errors],
      requiresManualHandling: adapter.requiresManualHandling,
      verificationSamplesParsed: adapter.verificationSamplesParsed,
    });

    if (adapter.requiresManualHandling && source.scrapingMethod === "facebook_graph") {
      report.facebookManualHandling.push(source.sourceName);
    }
    if (adapter.errors.length > 0 && adapter.observations.length === 0) {
      report.failedSources.push({ sourceName: source.sourceName, reason: adapter.errors[0] ?? "unknown" });
    }
  }

  report.totals.discovered = report.pipeline.discovered;
  report.totals.duplicatesDetected = report.pipeline.duplicatesDetected;
  report.totals.excludedJunior = report.pipeline.excludedJunior;
  report.totals.excludedClosedPrivate = report.pipeline.closedOrInvitation;
  report.totals.excludedOther = report.pipeline.excludedOther;
  report.totals.published = report.pipeline.published;

  return report;
}

export async function runRegistryDiscoveryForSource(source: RegistrySource) {
  const adapter = await collectFromRegistrySource(source);
  const pipeline = runDiscoveryPipeline(adapter.observations, []);
  const ingest = await ingestObservationsFromRegistry(source, adapter.observations, { dryRun: true });
  return { adapter, pipeline, ingest };
}
