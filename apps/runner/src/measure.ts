import type {
  AggregatedMetrics,
  CachePass,
  Confidence,
  EnvironmentFingerprint,
  MetricId,
  MetricSet,
  RawCapture,
  ThrottleProfile,
} from '@balise/schemas';
import {
  aggregateRuns,
  computeNoiseFloor,
  extractMetrics,
  gradeConfidence,
} from '@balise/measure-core';
import { captureRun, launchBrowser, type CaptureOptions } from './capture.js';
import { fingerprintsMatch } from './fingerprint.js';
import { resolveRunCount, sufficientForAggregate, MIN_RUNS } from './policy.js';

export interface RunFailure {
  index: number;
  message: string;
}

export interface MeasureOptions {
  url: string;
  serviceOrigin?: string;
  profile: ThrottleProfile;
  pass: CachePass;
  /** five by default, never below three. */
  runs?: number;
  runTimeoutMs?: number;
  /** instrument js and css coverage. changes the fingerprint. */
  coverage?: boolean;
  /**
   * this scenario's prior aggregations, oldest first, for the noise floor.
   *
   * optional and defaulting to none, which is what a one-off measurement
   * actually has. without history there is no floor, and METHODOLOGY.md
   * sections 7 and 9 make every figure from that scenario low confidence.
   * the runner does not read a store, so a caller that has the history passes
   * it and a caller that does not gets the honest grade rather than one
   * derived from dispersion alone.
   */
  history?: readonly AggregatedMetrics[];
}

interface MeasureBase {
  fingerprint: EnvironmentFingerprint;
  fingerprintStable: boolean;
  metricSets: readonly MetricSet[];
  /**
   * the capture each metric set was extracted from, in the same order. the
   * resource inventory a run detail shows is read from here, so the inventory
   * and the metrics above it are two readings of one capture.
   */
  captures: readonly RawCapture[];
  failures: readonly RunFailure[];
}

export type MeasureResult =
  | (MeasureBase & {
      status: 'measured';
      aggregate: AggregatedMetrics;
      confidence: Readonly<Record<MetricId, Confidence>>;
    })
  | (MeasureBase & { status: 'insufficient-runs'; required: number });

export interface GradeContext {
  fingerprintStable: boolean;
  /** this scenario's prior aggregations, oldest first. none is the default. */
  history?: readonly AggregatedMetrics[];
}

/**
 * grades every metric in an aggregate.
 *
 * separated from `measure` so that the decision can be tested without a
 * browser. it was not, once, and a call site that never passed a noise floor
 * went on grading from dispersion alone after the kernel started requiring
 * one, because nothing exercised it.
 *
 * a floor belongs to a scenario rather than to a session, so it is computed per
 * metric from the history the caller carried in. with no history
 * `computeNoiseFloor` reports insufficient history and every grade is low,
 * however tight the runs were: METHODOLOGY.md sections 7 and 9.
 */
export function gradeAggregate(
  aggregate: AggregatedMetrics,
  context: GradeContext,
): Record<MetricId, Confidence> {
  const history = context.history ?? [];
  return Object.fromEntries(
    aggregate.metrics.map((metric) => [
      metric.metricId,
      gradeConfidence(metric, {
        fingerprintStable: context.fingerprintStable,
        noiseFloor: computeNoiseFloor(history, metric.metricId),
      }),
    ]),
    // Object.fromEntries widens the key back to string; every metric id in the
    // aggregate is a MetricId by construction.
  ) as Record<MetricId, Confidence>;
}

/**
 * measures one url n times and aggregates through the kernel.
 *
 * failures are carried, not hidden and not imputed. if fewer than the minimum
 * of runs succeed there is no aggregate: the result says insufficient-runs,
 * which is the honest output and the one a budget must refuse to fail on.
 */
export async function measure(options: MeasureOptions): Promise<MeasureResult> {
  const runCount = resolveRunCount(options.runs);
  const browser = await launchBrowser();

  const metricSets: MetricSet[] = [];
  const captures: RawCapture[] = [];
  const failures: RunFailure[] = [];
  const fingerprints: EnvironmentFingerprint[] = [];

  try {
    const captureOptions: CaptureOptions = {
      url: options.url,
      profile: options.profile,
      pass: options.pass,
      ...(options.serviceOrigin === undefined ? {} : { serviceOrigin: options.serviceOrigin }),
      ...(options.runTimeoutMs === undefined ? {} : { runTimeoutMs: options.runTimeoutMs }),
      ...(options.coverage === undefined ? {} : { coverage: options.coverage }),
    };

    for (let index = 0; index < runCount; index += 1) {
      try {
        const result = await captureRun(browser, captureOptions);
        metricSets.push(extractMetrics(result.capture));
        captures.push(result.capture);
        fingerprints.push(result.fingerprint);
      } catch (error) {
        failures.push({ index, message: error instanceof Error ? error.message : String(error) });
      }
    }
  } finally {
    await browser.close();
  }

  const first = fingerprints[0];
  if (first === undefined) {
    throw new Error(`every run failed: ${failures.map((failure) => failure.message).join('; ')}`);
  }
  const fingerprintStable = fingerprints.every((candidate) => fingerprintsMatch(first, candidate));

  const base: MeasureBase = {
    fingerprint: first,
    fingerprintStable,
    metricSets,
    captures,
    failures,
  };

  if (!sufficientForAggregate(metricSets.length)) {
    return { ...base, status: 'insufficient-runs', required: MIN_RUNS };
  }

  const aggregate = aggregateRuns(metricSets);

  return {
    ...base,
    status: 'measured',
    aggregate,
    confidence: gradeAggregate(aggregate, { fingerprintStable, history: options.history }),
  };
}
