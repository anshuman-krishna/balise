import type { MetricId } from '@balise/schemas';
import {
  findings,
  PROVISIONAL_FINDING_THRESHOLDS,
  type FindingsResult,
  type ReferencePosition,
} from '@balise/measure-core';
import { ecoIndexPercentile, ecoindexModel } from '@balise/carbon-models';
import { canonCapture, canonMetric } from './measurement-canon-source';

/**
 * what each measured page shows about itself, from @balise/measure-core.
 *
 * the free scan used to carry three sentences and three savings, all authored:
 * "−214 KB, four unresized png images", "−96 KB, two font families, six
 * weights, none subset". two of them claimed knowledge no capture holds, and
 * all three stated a saving, which is a counterfactual about a page nobody
 * measured. on the one public surface the product has, that is the whole claim
 * to measure rather than to estimate, spent for three lines of copy.
 *
 * everything here is now read off the capture the same run publishes, so a
 * finding and the weight above it cannot describe different pages, and the
 * only comparison to other services is a position in the reference
 * distribution ecoindex publishes.
 */

/** the metrics ecoindex publishes a quantile table for. */
const REFERENCE_METRICS: readonly MetricId[] = [
  'dom_node_count',
  'request_count',
  'transferred_bytes',
];

/**
 * where the measured medians sit in ecoindex's published distribution. read
 * from the aggregation rather than from the capture so the percentile belongs
 * to the number the screen prints beside it.
 */
function reference(aggregationId: string): ReferencePosition[] {
  const positions: ReferencePosition[] = [];
  for (const metricId of REFERENCE_METRICS) {
    const value = canonMetric(aggregationId, metricId).median;
    const percentile = ecoIndexPercentile(metricId, value);
    if (percentile === null) continue;
    positions.push({
      metricId,
      source: ecoindexModel.id,
      sourceVersion: ecoindexModel.specVersion,
      percentile,
      value,
    });
  }
  return positions;
}

export interface FindingsPage {
  /** the aggregation whose capture and medians these findings are. */
  aggregationId: string;
  result: FindingsResult;
  reference: readonly ReferencePosition[];
}

/** the pages a surface shows findings for. */
const PAGES = ['scan', 'candidate'] as const;

export type FindingsPageId = (typeof PAGES)[number];

export function buildFindingsCanon() {
  const pages: Record<string, FindingsPage> = {};
  for (const aggregationId of PAGES) {
    const positions = reference(aggregationId);
    pages[aggregationId] = {
      aggregationId,
      reference: positions,
      result: findings({ capture: canonCapture(aggregationId), reference: positions }),
    };
  }
  return {
    thresholds: PROVISIONAL_FINDING_THRESHOLDS,
    referenceSource: { id: ecoindexModel.id, specVersion: ecoindexModel.specVersion },
    pages,
  };
}

export type FindingsCanon = ReturnType<typeof buildFindingsCanon>;
