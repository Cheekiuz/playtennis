import { classifyAdultEvent, shouldExcludeRaw } from "@/lib/discovery/adult-filter";
import { normalizeObservation } from "@/lib/discovery/normalize";
import { preparePublication } from "@/lib/discovery/workflow";
import type { DiscoveryStage } from "@/lib/discovery/registry-types";
import type { Decision, DuplicateCandidate, RawObservation } from "@/lib/discovery/types";

export type PipelineItem = {
  raw: RawObservation;
  stage: DiscoveryStage;
  decision: Decision | null;
  excludedReason: string | null;
  visibility: "public" | "closed" | "invitation" | null;
};

export type PipelineSummary = {
  discovered: number;
  parsed: number;
  deduplicated: number;
  validated: number;
  published: number;
  excludedJunior: number;
  excludedOther: number;
  closedOrInvitation: number;
  duplicatesDetected: number;
  items: PipelineItem[];
};

export function runDiscoveryPipeline(
  raws: RawObservation[],
  existing: DuplicateCandidate[],
): PipelineSummary {
  const summary: PipelineSummary = {
    discovered: raws.length,
    parsed: 0,
    deduplicated: 0,
    validated: 0,
    published: 0,
    excludedJunior: 0,
    excludedOther: 0,
    closedOrInvitation: 0,
    duplicatesDetected: 0,
    items: [],
  };

  for (const raw of raws) {
    const junior = shouldExcludeRaw(raw);
    if (junior) {
      summary.excludedJunior += 1;
      summary.items.push({ raw, stage: "DISCOVERED", decision: null, excludedReason: junior, visibility: null });
      continue;
    }

    const event = normalizeObservation(raw);
    if (!event.title || !event.startDate) {
      summary.excludedOther += 1;
      summary.items.push({ raw, stage: "DISCOVERED", decision: null, excludedReason: "missing_title_or_date", visibility: null });
      continue;
    }
    summary.parsed += 1;

    const adult = classifyAdultEvent(event);
    if (adult.action === "exclude") {
      if (adult.reason === "junior_only") summary.excludedJunior += 1;
      else summary.excludedOther += 1;
      summary.items.push({ raw, stage: "PARSED", decision: null, excludedReason: adult.reason, visibility: null });
      continue;
    }
    if (adult.visibility !== "public") summary.closedOrInvitation += 1;

    const decision = preparePublication(existing, {
      ...raw,
      discoveryStage: "DEDUPLICATED",
      visibility: adult.visibility,
    });
    summary.deduplicated += 1;

    if (decision.action === "attach_source" || decision.action === "review") {
      if (decision.action === "attach_source") summary.duplicatesDetected += 1;
      summary.items.push({
        raw: { ...raw, discoveryStage: "DEDUPLICATED", visibility: adult.visibility },
        stage: "DEDUPLICATED",
        decision,
        excludedReason: null,
        visibility: adult.visibility,
      });
      continue;
    }

    if (decision.action === "reject") {
      summary.excludedOther += 1;
      summary.items.push({ raw, stage: "PARSED", decision, excludedReason: decision.reason, visibility: null });
      continue;
    }

    summary.validated += 1;
    if (decision.publish) summary.published += 1;
    summary.items.push({
      raw: {
        ...raw,
        discoveryStage: decision.publish ? "PUBLISHED" : "VALIDATED",
        visibility: adult.visibility,
      },
      stage: decision.publish ? "PUBLISHED" : "VALIDATED",
      decision,
      excludedReason: null,
      visibility: adult.visibility,
    });
  }

  return summary;
}
