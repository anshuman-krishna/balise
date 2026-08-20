import type { Confidence, MetricId } from '@balise/schemas';
import { classifyDelta, getAggregatedMetric } from '@balise/measure-core';
import { ecoIndexPercentile } from '@balise/carbon-models';
import { estimateMeasured } from './carbon-canon-source';
import { canonAggregate, canonFloor, canonMetric } from './measurement-canon-source';
import {
  CORPUS_SERVICES,
  TENANT_AGENCY,
  corpusPriorId,
  corpusScenarioId,
  type CorpusService,
} from './corpus-services';

/**
 * the corpus, as the fleet and the public index read it.
 *
 * both surfaces are comparisons, and almost every figure on them is a position
 * rather than a quantity. a position is computed here, from the corpus, or it
 * is not shown. what the version of this replaced held instead: a rank of 14
 * out of a total of 412, a percentile of 38 against an n of 112, and a
 * histogram whose bars were twelve x/y/height triples copied out of a mockup
 * with the marker at x=99. four claims about three distributions, none of
 * which existed, on the two surfaces whose whole purpose is comparison.
 *
 * the grades were the same kind of thing. every row carried a letter, and the
 * table carried no dom count and no request count, so no grade on it could
 * have come from the model that produces grades. the audited service was
 * printed at B on the public index while the model this build ships grades it
 * E, which is the sort of contradiction a buyer finds by opening two tabs.
 */

/** the metric the index is ordered on. */
const RANK_METRIC: MetricId = 'transferred_bytes';

/**
 * a declaration is republished once a year (RGESN, and the RGAA declaration it
 * is modelled on). so the state of one is its age against that year, computed,
 * and not a tone typed beside the age.
 */
const DECLARATION_DUE_DAYS = 270;
const DECLARATION_EXPIRED_DAYS = 365;

export type DeclarationState = 'current' | 'due' | 'expired' | 'none';

export type HostingState = 'verified' | 'standard' | 'unchecked';

/** the grade bands ecoindex publishes, read as severity. */
function gradeTone(grade: string): 'none' | 'caution' | 'breach' {
  if (grade === 'F' || grade === 'G') return 'breach';
  if (grade === 'D' || grade === 'E') return 'caution';
  return 'none';
}

/**
 * where a page sits in the distribution ecoindex publishes for that metric.
 * the same table the findings engine reads, so a page called heavy on the
 * public scan is called heavy here for the same reason.
 */
function weightTone(percentile: number): 'none' | 'caution' | 'breach' {
  if (percentile >= 75) return 'breach';
  if (percentile >= 50) return 'caution';
  return 'none';
}

function declarationState(service: CorpusService): DeclarationState {
  if (service.declaration === null) return 'none';
  if (service.declaration.ageDays > DECLARATION_EXPIRED_DAYS) return 'expired';
  if (service.declaration.ageDays > DECLARATION_DUE_DAYS) return 'due';
  return 'current';
}

function hostingState(service: CorpusService): HostingState {
  if (service.greenHosting === null) return 'unchecked';
  return service.greenHosting.verified ? 'verified' : 'standard';
}

function buildService(service: CorpusService) {
  const id = corpusScenarioId(service.domain);
  const measured = {
    transferredBytes: canonMetric(id, 'transferred_bytes').median,
    requestCount: canonMetric(id, 'request_count').median,
    domNodeCount: canonMetric(id, 'dom_node_count').median,
    thirdPartySharePct: canonMetric(id, 'third_party_share_pct').median,
  };
  const confidence: Confidence = canonMetric(id, 'transferred_bytes').confidence;
  const floorBytes = canonFloor(id, 'transferred_bytes');

  const hosting = hostingState(service);
  const estimate = estimateMeasured(measured, {
    // an unchecked host gets no credit. see EstimateOptions.
    greenHostingFactor: hosting === 'verified' ? 1 : 0,
    ...(floorBytes === undefined ? {} : { floorBytes }),
  });

  const ecoindex = estimate.aside.find((output) => output.id === 'ecoindex');
  if (ecoindex?.grade == null || ecoindex.score == null) {
    throw new Error(`no ecoindex grade for ${service.domain}`);
  }

  // ninety days apart, one scenario, one floor. the classification is the
  // kernel's, so a movement inside the floor is not a change here either.
  const delta = classifyDelta(
    getAggregatedMetric(canonAggregate(corpusPriorId(service.domain)), RANK_METRIC)!,
    getAggregatedMetric(canonAggregate(id), RANK_METRIC)!,
    canonMetric(id, RANK_METRIC).floor,
  );

  const weightPercentile = ecoIndexPercentile(RANK_METRIC, measured.transferredBytes);
  if (weightPercentile === null) {
    throw new Error(`ecoindex publishes no distribution for ${RANK_METRIC}`);
  }

  return {
    domain: service.domain,
    organisme: service.organisme,
    sector: service.sector,
    agency: service.agency,
    inFleet: service.agency === TENANT_AGENCY,
    contract: service.contract,
    rgesnPct: service.rgesnPct,
    scenarioId: id,
    measured,
    confidence,
    sampleCount: canonMetric(id, 'transferred_bytes').sampleCount,
    carbon: {
      reference: estimate.band.reference,
      low: estimate.band.low,
      high: estimate.band.high,
      modelCount: estimate.band.modelCount,
      noise: estimate.noise === null ? null : { low: estimate.noise.low, high: estimate.noise.high },
      score: ecoindex.score,
      grade: ecoindex.grade,
      gradeTone: gradeTone(ecoindex.grade),
    },
    weight: { percentile: weightPercentile, tone: weightTone(weightPercentile) },
    trend: {
      before: delta.before,
      after: delta.after,
      /** the movement as a share of what it moved from. */
      pct: ((delta.after - delta.before) / delta.before) * 100,
      classification: delta.classification,
    },
    declaration:
      service.declaration === null
        ? { state: 'none' as DeclarationState, version: null, ageDays: null }
        : {
            state: declarationState(service),
            version: service.declaration.version,
            ageDays: service.declaration.ageDays,
          },
    hosting: {
      state: hosting,
      checkedAt: service.greenHosting?.checkedAt ?? null,
    },
  };
}

export type CorpusRow = ReturnType<typeof buildService>;

/** how many bars the distribution is drawn in. */
const BUCKETS = 8;

/**
 * the corpus's own distribution of measured page weight, in buckets.
 *
 * a distribution of the measurement and not of the estimate: the bands in the
 * table overlap each other, so ordering services by them would state a
 * precision the bands themselves deny. what a histogram of twelve services can
 * carry is where one page sits among twelve pages, which is why the caption
 * says twelve rather than implying a population.
 */
function buildBenchmark(rows: readonly CorpusRow[]) {
  const values = rows.map((row) => row.measured.transferredBytes).sort((a, b) => a - b);
  const max = values[values.length - 1]!;
  const width = max / BUCKETS;

  const buckets = Array.from({ length: BUCKETS }, (_, index) => ({
    from: index * width,
    to: (index + 1) * width,
    count: values.filter(
      (value) => value >= index * width && (index === BUCKETS - 1 ? true : value < (index + 1) * width),
    ).length,
  }));

  const middle = values.length / 2;
  const median =
    values.length % 2 === 0
      ? (values[middle - 1]! + values[middle]!) / 2
      : values[Math.floor(middle)]!;

  return { min: 0, max, buckets, median, serviceCount: values.length };
}

export function buildCorpusCanon() {
  // the rank is a position in the corpus, ordered on a measured quantity. the
  // reference model's output would order the same rows most of the time and
  // would be an ordering of estimates, which is a different claim.
  const ordered = [...CORPUS_SERVICES]
    .map(buildService)
    .sort((a, b) => a.measured.transferredBytes - b.measured.transferredBytes)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const scaleMax = Math.max(...ordered.map((row) => row.carbon.high));

  return {
    rankMetric: RANK_METRIC,
    declarationDueDays: DECLARATION_DUE_DAYS,
    declarationExpiredDays: DECLARATION_EXPIRED_DAYS,
    /** the shared axis every band in both tables is drawn on. */
    scale: { min: 0, max: scaleMax },
    size: ordered.length,
    withoutDeclaration: ordered.filter((row) => row.declaration.state === 'none').length,
    hostingVerified: ordered.filter((row) => row.hosting.state === 'verified').length,
    hostingUnchecked: ordered.filter((row) => row.hosting.state === 'unchecked').length,
    benchmark: buildBenchmark(ordered),
    rows: ordered,
  };
}

export type CorpusCanon = ReturnType<typeof buildCorpusCanon>;
