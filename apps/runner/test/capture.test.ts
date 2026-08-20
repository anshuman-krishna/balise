import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Browser } from 'playwright-core';
import { extractMetrics } from '@balise/measure-core';
import { captureRun, launchBrowser } from '../src/capture.js';
import { PROFILES } from '../src/profiles.js';
import { FIXTURE_DOM_NODES, startFixtureSite, type FixtureSite } from './fixture-site.js';

// the browser is a pinned build fetched by `pnpm --filter @balise/runner exec
// playwright-core install chromium`. without it there is nothing to measure,
// and saying so beats a green suite that measured nothing.
// checked by launching exactly what the tests launch, rather than guessing
// at a path: the build playwright resolves depends on the channel.
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

describe.skipIf(!installed)('captureRun', () => {
  let browser: Browser;
  let site: FixtureSite;

  beforeAll(async () => {
    browser = await launchBrowser();
    site = await startFixtureSite();
  }, 120_000);

  afterAll(async () => {
    await site?.close();
    await browser?.close();
  });

  it('captures a cold pass of the fixture site', async () => {
    const { capture, fingerprint } = await captureRun(browser, {
      url: site.origin,
      profile: 'desktop-fibre',
      pass: 'cold',
    });

    expect(capture.pass).toBe('cold');
    expect(capture.serviceOrigin).toBe(site.origin);
    // document, stylesheet, first-party script, third-party script
    expect(capture.requestCount).toBeGreaterThanOrEqual(4);
    expect(capture.resources.length).toBeGreaterThanOrEqual(4);
    expect(capture.domNodeCountAtLoad).toBe(FIXTURE_DOM_NODES);
    expect(capture.domNodeCountAtNetworkIdle).toBe(FIXTURE_DOM_NODES);
    expect(capture.jsExecutionMs).toBeGreaterThanOrEqual(0);

    expect(fingerprint.throttleProfile).toBe('desktop-fibre');
    expect(fingerprint.viewportWidth).toBe(PROFILES['desktop-fibre'].viewportWidth);
    expect(fingerprint.browserBuild).toMatch(/^\d+\./);
  }, 120_000);

  it('feeds extraction, which attributes the other origin as third party', async () => {
    const { capture } = await captureRun(browser, {
      url: site.origin,
      profile: 'desktop-fibre',
      pass: 'cold',
    });
    const metrics = extractMetrics(capture);
    const value = (id: string) => metrics.values.find((metric) => metric.metricId === id)?.value ?? 0;

    expect(value('transferred_bytes')).toBeGreaterThan(0);
    expect(value('third_party_bytes')).toBeGreaterThan(0);
    expect(value('third_party_bytes')).toBeLessThan(value('transferred_bytes'));
    expect(value('third_party_share_pct')).toBeGreaterThan(0);
    expect(value('third_party_share_pct')).toBeLessThan(100);
    expect(value('dom_node_count')).toBe(FIXTURE_DOM_NODES);
  }, 120_000);

  it('gives every run a fresh context, so a cold pass stays cold', async () => {
    const first = await captureRun(browser, { url: site.origin, profile: 'desktop-fibre', pass: 'cold' });
    const second = await captureRun(browser, { url: site.origin, profile: 'desktop-fibre', pass: 'cold' });
    expect(second.capture.requestCount).toBe(first.capture.requestCount);
    expect(second.capture.resources.length).toBe(first.capture.resources.length);
  }, 120_000);

  it('records what the browser did with each resource, and its decoded size', async () => {
    const { capture, fingerprint } = await captureRun(browser, {
      url: site.origin,
      profile: 'desktop-fibre',
      pass: 'cold',
    });

    const types = new Set(capture.resources.map((resource) => resource.resourceType));
    expect(types.has('document')).toBe(true);
    expect(types.has('script')).toBe(true);
    expect(types.has('stylesheet')).toBe(true);

    const document = capture.resources.find((resource) => resource.resourceType === 'document')!;
    expect(document.decodedBytes).toBeGreaterThan(0);
    // coverage was not asked for, so it is absent rather than zero.
    expect(document.unusedDecodedBytes).toBeNull();
    expect(fingerprint.coverageEnabled).toBe(false);

    // the document starts the navigation everything else is measured from.
    expect(document.startMs).toBe(0);
    for (const resource of capture.resources) {
      if (resource.startMs !== null) expect(resource.startMs).toBeGreaterThanOrEqual(0);
      if (resource.durationMs !== null) expect(resource.durationMs).toBeGreaterThanOrEqual(0);
    }
  }, 120_000);

  it('reports unused decoded bytes only when coverage was asked for', async () => {
    const { capture, fingerprint } = await captureRun(browser, {
      url: site.origin,
      profile: 'desktop-fibre',
      pass: 'cold',
      coverage: true,
    });

    expect(fingerprint.coverageEnabled).toBe(true);
    const scripts = capture.resources.filter((resource) => resource.resourceType === 'script');
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      if (script.unusedDecodedBytes === null) continue;
      expect(script.decodedBytes).not.toBeNull();
      expect(script.unusedDecodedBytes).toBeLessThanOrEqual(script.decodedBytes!);
    }
  }, 120_000);

  it('fails a hung run rather than waiting on it', async () => {
    await expect(
      captureRun(browser, {
        url: `${site.origin}/`,
        profile: 'mobile-3g',
        pass: 'cold',
        runTimeoutMs: 1,
      }),
    ).rejects.toThrow();
  }, 120_000);
});

describe.skipIf(installed)('captureRun without a browser', () => {
  it('reports that the pinned browser is missing', () => {
    expect(installed).toBe(false);
    console.warn(
      'chromium is not installed; the capture integration tests were skipped. run: pnpm --filter @balise/runner exec playwright-core install chromium',
    );
  });
});
