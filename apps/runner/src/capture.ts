import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import type { CachePass, EnvironmentFingerprint, RawCapture, ThrottleProfile } from '@balise/schemas';
import { buildFingerprint } from './fingerprint.js';
import { profileFor, userAgentFor, type ProfileDefinition } from './profiles.js';

export const DEFAULT_RUN_TIMEOUT_MS = 60_000;

// chrome's own prediction, background sync and extension surface all change
// what a page does between two identical runs. determinism first.
const LAUNCH_ARGS = [
  '--disable-extensions',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-sync',
  '--no-first-run',
  '--no-default-browser-check',
  '--metrics-recording-only',
];

export interface CaptureOptions {
  url: string;
  /** defaults to the origin of `url`. resources elsewhere are third party. */
  serviceOrigin?: string;
  profile: ThrottleProfile;
  pass: CachePass;
  runTimeoutMs?: number;
}

export interface CaptureResult {
  capture: RawCapture;
  fingerprint: EnvironmentFingerprint;
}

/**
 * the full chromium build, not playwright's stripped headless shell. we are
 * measuring what a visitor's browser does, so the browser has to be the one
 * a visitor has; the shell omits parts of the rendering and networking stack.
 */
export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ channel: 'chromium', args: LAUNCH_ARGS });
}

function newContext(browser: Browser, profile: ProfileDefinition): Promise<BrowserContext> {
  return browser.newContext({
    viewport: { width: profile.viewportWidth, height: profile.viewportHeight },
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.isMobile,
    locale: profile.locale,
    timezoneId: profile.timezone,
    userAgent: userAgentFor(profile, browser.version()),
  });
}

async function applyThrottling(page: Page, profile: ProfileDefinition): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuThrottlingRate });
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: profile.network?.latencyMs ?? 0,
    downloadThroughput: profile.network?.downloadBytesPerSecond ?? -1,
    uploadThroughput: profile.network?.uploadBytesPerSecond ?? -1,
  });
}

async function scriptDurationMs(page: Page): Promise<number> {
  const cdp = await page.context().newCDPSession(page);
  const { metrics } = await cdp.send('Performance.getMetrics');
  // ScriptDuration is reported in seconds by the protocol.
  const scriptDuration = metrics.find((metric) => metric.name === 'ScriptDuration');
  return scriptDuration === undefined ? 0 : scriptDuration.value * 1000;
}

const NODE_COUNT = 'document.getElementsByTagName("*").length';

/**
 * one measurement of one url. a fresh context every time: a reused profile
 * carries cache, storage and connection state from the previous run, and the
 * cold pass would stop being cold.
 *
 * a hung run is a failed run, not a slow one, so the navigation and the idle
 * wait both carry the hard timeout.
 */
export async function captureRun(browser: Browser, options: CaptureOptions): Promise<CaptureResult> {
  const profile = profileFor(options.profile);
  const timeout = options.runTimeoutMs ?? DEFAULT_RUN_TIMEOUT_MS;
  const context = await newContext(browser, profile);

  try {
    const page = await context.newPage();
    page.setDefaultTimeout(timeout);
    await applyThrottling(page, profile);

    let requestCount = 0;
    const sizes: Array<Promise<{ url: string; transferredBytes: number }>> = [];
    page.on('request', () => {
      requestCount += 1;
    });
    page.on('response', (response) => {
      sizes.push(
        response
          .request()
          .sizes()
          .then((size) => ({
            url: response.url(),
            // what crossed the wire: encoded body plus response headers.
            transferredBytes: Math.max(0, size.responseBodySize + size.responseHeadersSize),
          }))
          .catch(() => ({ url: response.url(), transferredBytes: 0 })),
      );
    });

    if (options.pass === 'warm') {
      // the warm pass is a second navigation in the same context, so the
      // cache is primed. it is a different question from the cold pass and
      // the two are never averaged together.
      await page.goto(options.url, { waitUntil: 'load', timeout });
      await page.waitForLoadState('networkidle');
      requestCount = 0;
      sizes.length = 0;
    }

    await page.goto(options.url, { waitUntil: 'load', timeout });
    const domNodeCountAtLoad = Number(await page.evaluate(NODE_COUNT));
    await page.waitForLoadState('networkidle');
    const domNodeCountAtNetworkIdle = Number(await page.evaluate(NODE_COUNT));
    const jsExecutionMs = await scriptDurationMs(page);

    const resources = await Promise.all(sizes);

    const capture: RawCapture = {
      serviceOrigin: options.serviceOrigin ?? new URL(options.url).origin,
      pass: options.pass,
      resources,
      requestCount,
      domNodeCountAtLoad,
      domNodeCountAtNetworkIdle,
      jsExecutionMs,
    };

    return {
      capture,
      fingerprint: buildFingerprint({
        browserBuild: browser.version(),
        throttleProfile: profile.id,
        imageDigest: process.env.BALISE_IMAGE_DIGEST,
        region: process.env.BALISE_REGION,
      }),
    };
  } finally {
    await context.close();
  }
}
