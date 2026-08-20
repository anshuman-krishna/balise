import type {
  AggregatedMetrics,
  CachePass,
  MetricId,
  MetricSet,
  NoiseFloor,
  RawCapture,
} from '@balise/schemas';
import { METRIC_UNIT } from '@balise/schemas';
import type { CanonMetric } from '../src/fixtures/measurement-types';
import {
  aggregateRuns,
  computeNoiseFloor,
  extractMetrics,
  gradeConfidence,
  NOISE_FLOOR_MIN_HISTORY,
  PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR,
} from '@balise/measure-core';
import { BASELINE_CAPTURE, CANDIDATE_CAPTURE, SCAN_CAPTURE } from './capture-canon-source';
import { CORPUS_SERVICES, corpusPriorId, corpusScenarioId, type CorpusService } from './corpus-services';

/**
 * every median, dispersion, noise floor and confidence grade the application
 * prints, computed by @balise/measure-core from runs.
 *
 * the only thing authored here is a distribution: what a scenario settles at,
 * how far its runs spread, how many of them there were, and how much history
 * sits behind it. the median is then the median of those runs, the mad is
 * their mad, the floor is the scaled median of the historical mads, and the
 * grade is what `gradeConfidence` returns. no surface downstream may state a
 * statistic the runs beside it do not produce, which is the reason this file
 * exists: the fixtures it replaces drew five run dots and printed a mad of 9
 * where those five runs give 4, and marked a row low confidence where the
 * kernel grades it high.
 *
 * where a scenario is one page there is a capture, and then even the centre is
 * not authored: the resource list is, and `extractMetrics` says what it weighs.
 * an aggregate over several pages (the service median, a journey) has no single
 * capture and states a centre, which is the honest difference between the two.
 *
 * the runs are synthetic. they stand in for repeated captures until the runner
 * measures a real service, and they are shaped rather than random so the file
 * regenerates identically.
 */

/**
 * the runs of one aggregation, as multiples of the scenario's stated spread.
 *
 * five of them, in the order they were measured rather than sorted, and one
 * sitting exactly on the centre: the middle run is the capture the run detail
 * and the resource inventory hold, and a median falling between two runs would
 * describe a page no capture recorded.
 */
const RUN_OFFSETS = [-0.45, 1, 0, -1, 0.5] as const;

/** a page measured once has no dispersion to report and no floor to stand on. */
const SINGLE_RUN_OFFSETS = [0] as const;

/**
 * how much each past aggregation spread, as a multiple of the scenario's own.
 * the floor is the median of the historical mads, so a history that never
 * varied would make it an assertion wearing a computation's clothes.
 */
const HISTORY_SPREAD_FACTORS = [0.8, 1.1, 0.9, 1.3, 1.0, 0.7, 1.2, 0.95, 1.05, 1.15] as const;

export interface Spread {
  /** what the runs are drawn around, in the metric's own unit. */
  centre: number;
  /** half the run-to-run range. the mad comes out at half of this. */
  spread: number;
  /** counts are whole numbers; bytes and milliseconds are not rounded. */
  integral?: boolean;
}

type Spreads = Partial<Record<MetricId, Spread>>;

/** how far the runs of one aggregation move, per metric, in the metric's unit. */
type SpreadWidths = Partial<Record<MetricId, number>>;

/** counts are whole numbers between runs; bytes and milliseconds are not. */
const INTEGRAL: ReadonlySet<MetricId> = new Set(['request_count', 'dom_node_count']);

/**
 * the metrics of a scenario that is one page, drawn around what its capture
 * actually weighs. the caller names the metrics and how far they move; the
 * centre is never a number typed beside a resource list that adds to something
 * else, which is what the two lists for run #4812 used to be.
 */
function fromCapture(capture: RawCapture, widths: SpreadWidths): Spreads {
  const measured = extractMetrics(capture);
  const metrics: Spreads = {};
  for (const [metricId, spread] of Object.entries(widths) as Array<[MetricId, number]>) {
    const found = measured.values.find((value) => value.metricId === metricId);
    if (found === undefined) {
      throw new Error(`the capture yields no ${metricId}`);
    }
    metrics[metricId] = {
      centre: found.value,
      spread,
      ...(INTEGRAL.has(metricId) ? { integral: true } : {}),
    };
  }
  return metrics;
}

/** one measured point in time: n runs of a scenario at one commit. */
export interface AggregationSpec {
  id: string;
  label: string;
  runCount: 1 | 5;
  /** false when the runs behind the aggregate carry differing fingerprints. */
  fingerprintStable: boolean;
  /** absent for the aggregation that sits where the scenario settled. */
  metrics?: Spreads;
  /**
   * the median run's capture, where a surface renders one. it is published
   * with the aggregation so the inventory and the figures above it are the
   * same measurement; an aggregation nothing shows an inventory for carries
   * none rather than a copy nobody reads.
   */
  capture?: RawCapture;
}

export interface ScenarioSpec {
  id: string;
  label: string;
  pass: CachePass;
  /** what the scenario settles at. the history is drawn from this. */
  metrics: Spreads;
  /** aggregations before the ones published here. below the minimum there is no floor. */
  historyCount: number;
  /** what past aggregations measured around, oldest first, where the history is a story. */
  historyCentres?: Partial<Record<MetricId, readonly number[]>>;
  /** the metrics whose history is kept in the written canon rather than discarded. */
  keepHistoryFor?: readonly MetricId[];
  /**
   * what this scenario publishes. a comparison holds two aggregations of one
   * scenario, and both are measured against the single floor its history
   * establishes: a floor belongs to a scenario, never to a run.
   */
  aggregations: readonly AggregationSpec[];
}

function drawRuns(spec: Spread, offsets: readonly number[]): number[] {
  return offsets.map((offset) => {
    const value = spec.centre + offset * spec.spread;
    return spec.integral === true ? Math.round(value) : value;
  });
}

/**
 * one aggregation's runs, built rather than declared. the third-party share is
 * computed per run from that run's own bytes, never drawn on its own: a share
 * that did not divide the two figures beside it would be a third measurement
 * of the same page.
 */
export function buildMetricSets(
  metrics: Spreads,
  pass: CachePass,
  offsets: readonly number[],
  factor = 1,
): MetricSet[] {
  const scaled: Spreads = {};
  for (const [metricId, spec] of Object.entries(metrics) as Array<[MetricId, Spread]>) {
    scaled[metricId] = { ...spec, spread: spec.spread * factor };
  }

  // a third party's bytes do not move with the service's own. drawing both from
  // the same offset would make every run's share identical and hand the share
  // metric a dispersion no page has, so the third-party draw runs backwards
  // through the same offsets.
  //
  // reversed rather than rotated: the offsets are symmetric about the middle
  // run, so reversing gives every other run a different share while leaving the
  // middle one exactly on the centre. rotating moved it, and then the share the
  // aggregation reported was not the share of the capture it publishes.
  const reversed = [...offsets].reverse();

  const drawn = new Map<MetricId, number[]>();
  for (const [metricId, spec] of Object.entries(scaled) as Array<[MetricId, Spread]>) {
    drawn.set(metricId, drawRuns(spec, metricId === 'third_party_bytes' ? reversed : offsets));
  }

  const transferred = drawn.get('transferred_bytes');
  const thirdParty = drawn.get('third_party_bytes');
  if (transferred !== undefined && thirdParty !== undefined) {
    drawn.set(
      'third_party_share_pct',
      transferred.map((bytes, index) => (thirdParty[index]! / bytes) * 100),
    );
  }

  return offsets.map((_, index) => ({
    pass,
    values: [...drawn].map(([metricId, values]) => ({
      metricId,
      value: values[index]!,
      unit: METRIC_UNIT[metricId],
    })),
  }));
}

function offsetsFor(runCount: 1 | 5): readonly number[] {
  return runCount === 1 ? SINGLE_RUN_OFFSETS : RUN_OFFSETS;
}

/**
 * an aggregation of n synthetic runs through the kernel's own aggregator, for
 * the generators that need one and do not publish it as a scenario.
 */
export function aggregateFrom(metrics: Spreads, pass: CachePass, runCount: 1 | 5): AggregatedMetrics {
  return aggregateRuns(buildMetricSets(metrics, pass, offsetsFor(runCount)));
}

function buildHistory(spec: ScenarioSpec): AggregatedMetrics[] {
  const offsets = offsetsFor(spec.aggregations[0]!.runCount);
  return Array.from({ length: spec.historyCount }, (_, index) => {
    const at: Spreads = {};
    for (const [metricId, metric] of Object.entries(spec.metrics) as Array<[MetricId, Spread]>) {
      const centres = spec.historyCentres?.[metricId];
      const centre = centres === undefined ? metric.centre : (centres[index] ?? metric.centre);
      at[metricId] = { ...metric, centre };
    }
    const factor = HISTORY_SPREAD_FACTORS[index % HISTORY_SPREAD_FACTORS.length]!;
    return aggregateRuns(buildMetricSets(at, spec.pass, offsets, factor));
  });
}

function buildScenario(spec: ScenarioSpec) {
  const history = buildHistory(spec);

  // one floor per metric, from the scenario's history. every aggregation the
  // scenario publishes is read against it.
  const floors = new Map<MetricId, NoiseFloor>();
  for (const metricId of Object.keys(spec.metrics) as MetricId[]) {
    floors.set(metricId, computeNoiseFloor(history, metricId));
  }
  const shareId: MetricId = 'third_party_share_pct';
  if (spec.metrics.third_party_bytes !== undefined) {
    floors.set(shareId, computeNoiseFloor(history, shareId));
  }

  const aggregations = spec.aggregations.map((aggregation) => {
    const runs = buildMetricSets(
      aggregation.metrics ?? spec.metrics,
      spec.pass,
      offsetsFor(aggregation.runCount),
    );
    const aggregate = aggregateRuns(runs);

    const metrics: CanonMetric[] = aggregate.metrics.map((metric) => {
      const kept = spec.keepHistoryFor?.includes(metric.metricId) === true;
      return {
        metricId: metric.metricId,
        unit: metric.unit,
        median: metric.median,
        mad: metric.mad,
        min: metric.min,
        max: metric.max,
        sampleCount: metric.sampleCount,
        runValues: runs.map(
          (run) => run.values.find((value) => value.metricId === metric.metricId)!.value,
        ),
        floor: floors.get(metric.metricId) ?? computeNoiseFloor(history, metric.metricId),
        confidence: gradeConfidence(metric, {
          fingerprintStable: aggregation.fingerprintStable,
          noiseFloor: floors.get(metric.metricId) ?? null,
        }),
        ...(kept
          ? {
              history: history.map((past) => {
                const at = past.metrics.find((candidate) => candidate.metricId === metric.metricId)!;
                return { median: at.median, low: at.min, high: at.max, mad: at.mad };
              }),
            }
          : {}),
      };
    });

    return {
      id: aggregation.id,
      scenarioId: spec.id,
      label: aggregation.label,
      pass: spec.pass,
      sampleCount: aggregate.sampleCount,
      fingerprintStable: aggregation.fingerprintStable,
      metrics,
      ...(aggregation.capture === undefined ? {} : { capture: aggregation.capture }),
    };
  });

  return {
    scenario: {
      id: spec.id,
      label: spec.label,
      pass: spec.pass,
      historyCount: spec.historyCount,
      aggregationIds: spec.aggregations.map((aggregation) => aggregation.id),
    },
    aggregations,
  };
}

// ---------------------------------------------------------------------------
// the scenarios
// ---------------------------------------------------------------------------

/**
 * what the journey measured around, aggregation by aggregation, oldest first.
 * this is the story the dashboard trend tells: a plateau, the step deploy #412
 * introduced, and the return after it was reverted. the envelope drawn around
 * each point is that aggregation's own run spread, never a smoothing.
 */
const JOURNEY_HISTORY_BYTES = [
  1_236_000, 1_229_000, 1_241_000, 1_233_000, 1_246_000, 1_238_000, 1_252_000, 1_244_000,
  1_237_000, 1_250_000, 1_243_000, 1_242_000, 1_238_000, 1_251_000, 1_247_000, 1_244_000,
  1_258_000, 1_262_000, 1_255_000, 1_249_000, 1_421_000, 1_418_000, 1_424_000, 1_263_000,
] as const;

const SCENARIOS: readonly ScenarioSpec[] = [
  {
    id: 'service',
    label: 'médiane du service',
    pass: 'cold',
    historyCount: 24,
    // the contractual engagements are read against this scenario, and a
    // quarterly tracker draws the movement of the thing it holds. the history
    // is kept so that line comes from aggregations rather than from a
    // polyline typed into a fixture.
    metrics: {
      transferred_bytes: { centre: 1_258_000, spread: 12_000 },
      request_count: { centre: 82, spread: 2, integral: true },
      dom_node_count: { centre: 2_140, spread: 260, integral: true },
      js_execution_ms: { centre: 588, spread: 34 },
      third_party_bytes: { centre: 478_000, spread: 9_000 },
    },
    keepHistoryFor: ['transferred_bytes', 'third_party_share_pct'],
    aggregations: [
      { id: 'service', label: 'médiane du service', runCount: 5, fingerprintStable: true },
    ],
  },
  {
    // one route, two commits, two captures. every centre below is what the
    // capture weighs; only the spreads are authored. the floor is the route's,
    // so the comparison reads both runs against the same number.
    id: 'route-acte-naissance',
    label: '/demarches/acte-naissance',
    pass: 'cold',
    historyCount: 24,
    metrics: fromCapture(BASELINE_CAPTURE, {
      transferred_bytes: 12_000,
      request_count: 2,
      dom_node_count: 300,
      js_execution_ms: 24,
      third_party_bytes: 4_000,
    }),
    aggregations: [
      { id: 'baseline', label: '#4790 · main', runCount: 5, fingerprintStable: true },
      {
        id: 'candidate',
        label: '#4812 · pr/412',
        runCount: 5,
        fingerprintStable: true,
        capture: CANDIDATE_CAPTURE,
        metrics: fromCapture(CANDIDATE_CAPTURE, {
          transferred_bytes: 18_000,
          request_count: 2,
          dom_node_count: 320,
          js_execution_ms: 30,
          third_party_bytes: 6_000,
        }),
      },
    ],
  },
  {
    id: 'journey-demande-acte',
    label: 'journey:demande-acte',
    pass: 'cold',
    historyCount: JOURNEY_HISTORY_BYTES.length,
    metrics: {
      transferred_bytes: { centre: 1_258_000, spread: 24_000 },
      request_count: { centre: 96, spread: 3, integral: true },
      dom_node_count: { centre: 4_180, spread: 320, integral: true },
      third_party_bytes: { centre: 226_000, spread: 6_000 },
    },
    historyCentres: { transferred_bytes: JOURNEY_HISTORY_BYTES },
    keepHistoryFor: ['transferred_bytes'],
    aggregations: [
      { id: 'journey', label: "demande d'acte", runCount: 5, fingerprintStable: true },
    ],
  },
  {
    // the free scan: one cold pass on a page entered by a stranger. no history,
    // so no floor, and every figure it shows is low confidence. one page and
    // one run, so the capture is the measurement and there is no centre to
    // author: the findings, the grade and the weight are all this list of
    // resources, read three ways.
    id: 'scan',
    label: 'bibliotheques-selo.fr',
    pass: 'cold',
    historyCount: 0,
    metrics: fromCapture(SCAN_CAPTURE, {
      transferred_bytes: 0,
      request_count: 0,
      dom_node_count: 0,
    }),
    aggregations: [
      {
        id: 'scan',
        label: 'bibliotheques-selo.fr',
        runCount: 1,
        fingerprintStable: true,
        capture: SCAN_CAPTURE,
      },
    ],
  },
];

/**
 * how far a corpus service's runs move between them, as a share of what the
 * page settles at.
 *
 * one figure for the whole corpus rather than a spread authored per service:
 * they are measured by one runner on one profile, so a heavier page moves more
 * in bytes and no more in proportion. it is also what makes the floors
 * comparable, and a floor that is not comparable makes a trend column a set of
 * unrelated verdicts printed in one column.
 */
const CORPUS_RUN_SPREAD = 0.014;

/**
 * one corpus service: one page, two aggregations ninety days apart, and one
 * floor from its own history that both are read against.
 *
 * no capture is published with them. the index renders no inventory, and
 * carrying twelve resource lists into this file to render nothing would be
 * twelve chances for a copy to drift from the original.
 */
function corpusScenario(service: CorpusService): ScenarioSpec {
  const measured = extractMetrics(service.capture);
  const at = (metricId: MetricId): number => {
    const found = measured.values.find((value) => value.metricId === metricId);
    if (found === undefined) throw new Error(`${service.domain} yields no ${metricId}`);
    return found.value;
  };

  const metrics: Spreads = {
    transferred_bytes: {
      centre: at('transferred_bytes'),
      spread: at('transferred_bytes') * CORPUS_RUN_SPREAD,
    },
    request_count: { centre: at('request_count'), spread: 1, integral: true },
    dom_node_count: {
      centre: at('dom_node_count'),
      spread: Math.round(at('dom_node_count') * CORPUS_RUN_SPREAD),
      integral: true,
    },
    third_party_bytes: {
      centre: at('third_party_bytes'),
      spread: at('third_party_bytes') * CORPUS_RUN_SPREAD,
    },
  };

  return {
    id: corpusScenarioId(service.domain),
    label: service.domain,
    pass: 'cold',
    historyCount: service.historyCount,
    metrics,
    aggregations: [
      {
        id: corpusPriorId(service.domain),
        label: `${service.domain} · j-90`,
        runCount: 5,
        fingerprintStable: true,
        metrics: {
          ...metrics,
          transferred_bytes: {
            centre: service.priorTransferredBytes,
            spread: service.priorTransferredBytes * CORPUS_RUN_SPREAD,
          },
        },
      },
      { id: corpusScenarioId(service.domain), label: service.domain, runCount: 5, fingerprintStable: true },
    ],
  };
}

export function buildMeasurementCanon() {
  const built = [...SCENARIOS, ...CORPUS_SERVICES.map(corpusScenario)].map(buildScenario);
  return {
    scalingFactor: PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR,
    minHistory: NOISE_FLOOR_MIN_HISTORY,
    runOffsets: RUN_OFFSETS,
    scenarios: built.map((entry) => entry.scenario),
    aggregations: built.flatMap((entry) => entry.aggregations),
  };
}

export type MeasurementCanon = ReturnType<typeof buildMeasurementCanon>;

const BUILT = buildMeasurementCanon();

/**
 * one measured metric, for the other generators. they read their byte counts,
 * request counts and floors from here rather than restating them, so the
 * carbon estimate, the budget verdict and the ledger record all describe the
 * same run.
 */
export function canonMetric(aggregationId: string, metricId: MetricId): CanonMetric {
  const aggregation = BUILT.aggregations.find((entry) => entry.id === aggregationId);
  if (aggregation === undefined) {
    throw new Error(`the measurement canon holds no aggregation "${aggregationId}"`);
  }
  const found = aggregation.metrics.find((entry) => entry.metricId === metricId);
  if (found === undefined) {
    throw new Error(`aggregation "${aggregationId}" measured no ${metricId}`);
  }
  return found;
}

/**
 * one aggregation as the kernel produced it, for the generators that evaluate
 * against it. the budget engine reads the route's two aggregates from here
 * rather than summing a resource list of its own, so the verdict on a screen
 * and the figures above it are the same measurement.
 */
export function canonAggregate(aggregationId: string): AggregatedMetrics {
  const aggregation = BUILT.aggregations.find((entry) => entry.id === aggregationId);
  if (aggregation === undefined) {
    throw new Error(`the measurement canon holds no aggregation "${aggregationId}"`);
  }
  return {
    pass: aggregation.pass,
    sampleCount: aggregation.sampleCount,
    metrics: aggregation.metrics.map((metric) => ({
      metricId: metric.metricId,
      unit: metric.unit,
      median: metric.median,
      mad: metric.mad,
      min: metric.min,
      max: metric.max,
      sampleCount: metric.sampleCount,
    })),
  };
}

/** the capture the aggregation's median run recorded, where one is published. */
export function canonCapture(aggregationId: string): RawCapture {
  const aggregation = BUILT.aggregations.find((entry) => entry.id === aggregationId);
  if (aggregation?.capture === undefined) {
    throw new Error(`aggregation "${aggregationId}" publishes no capture`);
  }
  return aggregation.capture;
}

/** the established floor, or undefined where the history has not set one. */
export function canonFloor(aggregationId: string, metricId: MetricId): number | undefined {
  const floor = canonMetric(aggregationId, metricId).floor;
  return floor.status === 'established' ? floor.value : undefined;
}
