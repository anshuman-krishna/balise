import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { AggregatedMetrics, Confidence, MetricId } from '@balise/schemas';
import { MetricId as MetricIdSchema } from '@balise/schemas';
import {
  aggregateRuns,
  classifyDelta,
  computeNoiseFloor,
  extractMetrics,
  getAggregatedMetric,
  gradeConfidence,
} from '@balise/measure-core';
import { captureRun, launchBrowser } from '../src/capture.js';
import { fingerprintsMatch } from '../src/fingerprint.js';
import { DEFAULT_RUNS } from '../src/policy.js';
import { startFixtureSite, type FixtureSite } from '../test/fixture-site.js';
import type { Browser } from 'playwright-core';

/**
 * the exit test for the measurement contract: the same unchanged service,
 * measured over and over, produces the same verdict every time. not the same
 * numbers, which a real browser cannot give, the same verdict.
 *
 * it is slow because it is doing the real thing. if it goes flaky the fix is
 * to find the source of non-determinism, never to loosen the assertion.
 */

// twenty aggregations establish the floor, plus one to serve as the baseline
const SESSIONS = 21;

async function measureSession(browser: Browser, url: string): Promise<AggregatedMetrics> {
  const metricSets = [];
  for (let run = 0; run < DEFAULT_RUNS; run += 1) {
    const { capture } = await captureRun(browser, { url, profile: 'desktop-fibre', pass: 'cold' });
    metricSets.push(extractMetrics(capture));
  }
  return aggregateRuns(metricSets);
}

async function browserInstalled(): Promise<boolean> {
  try {
    const probe = await launchBrowser();
    await probe.close();
    return true;
  } catch {
    return false;
  }
}

const installed = await browserInstalled();

describe.skipIf(!installed)('reproducibility', () => {
  let browser: Browser;
  let site: FixtureSite;
  let sessions: AggregatedMetrics[];
  let fingerprintStable: boolean;

  beforeAll(async () => {
    browser = await launchBrowser();
    site = await startFixtureSite();

    const first = await captureRun(browser, {
      url: site.origin,
      profile: 'desktop-fibre',
      pass: 'cold',
    });
    fingerprintStable = true;
    sessions = [];
    for (let session = 0; session < SESSIONS; session += 1) {
      sessions.push(await measureSession(browser, site.origin));
      const { fingerprint } = await captureRun(browser, {
        url: site.origin,
        profile: 'desktop-fibre',
        pass: 'cold',
      });
      if (!fingerprintsMatch(first.fingerprint, fingerprint)) {
        fingerprintStable = false;
      }
    }
  });

  afterAll(async () => {
    await site?.close();
    await browser?.close();
  });

  it('holds one fingerprint across every session', () => {
    expect(fingerprintStable).toBe(true);
  });

  it('establishes a noise floor for every metric', () => {
    for (const metricId of MetricIdSchema.options) {
      const floor = computeNoiseFloor(sessions, metricId);
      expect(floor.status, `${metricId} has no floor after ${SESSIONS} sessions`).toBe('established');
    }
  });

  it('reports no significant change on an unchanged service, every time', () => {
    const [baseline, ...candidates] = sessions;
    const verdicts: Array<{ metricId: MetricId; session: number; classification: string }> = [];

    for (const metricId of MetricIdSchema.options) {
      const floor = computeNoiseFloor(sessions, metricId);
      const before = getAggregatedMetric(baseline!, metricId)!;
      candidates.forEach((candidate, index) => {
        const after = getAggregatedMetric(candidate, metricId)!;
        verdicts.push({
          metricId,
          session: index + 1,
          classification: classifyDelta(before, after, floor).classification,
        });
      });
    }

    const changed = verdicts.filter((verdict) => verdict.classification !== 'no-significant-change');
    expect(changed, `nothing changed, so nothing may be reported as a change: ${JSON.stringify(changed)}`).toEqual([]);
  });

  it('grades confidence the same way in every session', () => {
    for (const metricId of MetricIdSchema.options) {
      const grades = new Set<Confidence>(
        sessions.map((session) =>
          gradeConfidence(getAggregatedMetric(session, metricId)!, { fingerprintStable }),
        ),
      );
      expect([...grades], `${metricId} graded inconsistently`).toHaveLength(1);
    }
  });
});

describe.skipIf(installed)('reproducibility without a browser', () => {
  it('reports that the pinned browser is missing', () => {
    expect(installed).toBe(false);
    console.warn(
      'chromium is not installed; the reproducibility suite did not run. install it with: pnpm --filter @balise/runner exec playwright-core install chromium',
    );
  });
});
