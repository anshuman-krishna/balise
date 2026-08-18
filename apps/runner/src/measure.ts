import type {
  AggregatedMetrics,
  CachePass,
  Confidence,
  EnvironmentFingerprint,
  MetricId,
  MetricSet,
  ThrottleProfile,
} from '@balise/schemas';
import { aggregateRuns, extractMetrics, gradeConfidence } from '@balise/measure-core';
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
}

interface MeasureBase {
  fingerprint: EnvironmentFingerprint;
  fingerprintStable: boolean;
  metricSets: readonly MetricSet[];
  failures: readonly RunFailure[];
}

export type MeasureResult =
  | (MeasureBase & {
      status: 'measured';
      aggregate: AggregatedMetrics;
      confidence: Readonly<Record<MetricId, Confidence>>;
    })
  | (MeasureBase & { status: 'insufficient-runs'; required: number });

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
  const failures: RunFailure[] = [];
  const fingerprints: EnvironmentFingerprint[] = [];

  try {
    const captureOptions: CaptureOptions = {
      url: options.url,
      profile: options.profile,
      pass: options.pass,
      ...(options.serviceOrigin === undefined ? {} : { serviceOrigin: options.serviceOrigin }),
      ...(options.runTimeoutMs === undefined ? {} : { runTimeoutMs: options.runTimeoutMs }),
    };

    for (let index = 0; index < runCount; index += 1) {
      try {
        const result = await captureRun(browser, captureOptions);
        metricSets.push(extractMetrics(result.capture));
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

  const base: MeasureBase = { fingerprint: first, fingerprintStable, metricSets, failures };

  if (!sufficientForAggregate(metricSets.length)) {
    return { ...base, status: 'insufficient-runs', required: MIN_RUNS };
  }

  const aggregate = aggregateRuns(metricSets);
  const confidence = Object.fromEntries(
    aggregate.metrics.map((metric) => [
      metric.metricId,
      gradeConfidence(metric, { fingerprintStable }),
    ]),
  ) as Record<MetricId, Confidence>;

  return { ...base, status: 'measured', aggregate, confidence };
}
