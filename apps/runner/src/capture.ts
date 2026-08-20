import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Response,
} from 'playwright-core';
import type {
  CachePass,
  CapturedResource,
  EnvironmentFingerprint,
  RawCapture,
  ThrottleProfile,
} from '@balise/schemas';
import { buildFingerprint } from './fingerprint.js';
import { profileFor, userAgentFor, type ProfileDefinition } from './profiles.js';
import { resourceTypeOf } from './resource-type.js';
import { NO_COVERAGE, startCoverage, stopCoverage, type CoverageByUrl } from './coverage.js';

export const DEFAULT_RUN_TIMEOUT_MS = 60_000;

/**
 * above this, the decoded body is not read back. a video pulled into the
 * runner's memory to be measured buys one number and risks the run, and a
 * resource this size is already compressed, so the decoded figure would tell
 * nobody anything they did not have. the capture records it as unavailable
 * rather than copying the transferred figure across.
 */
export const MAX_DECODED_READ_BYTES = 8 * 1024 * 1024;

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
  /**
   * capture js and css coverage. off by default: v8's precise coverage
   * instruments execution and moves `js_execution_ms`, so a run made with it
   * is not comparable to a run made without it. it is recorded in the
   * fingerprint for exactly that reason.
   */
  coverage?: boolean;
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
 * one response as the inventory records it. every field the browser refuses is
 * null: a redirect has no body to decode, a resource above the read cap is not
 * pulled into memory, and coverage that does not apply is absent rather than
 * zero. nothing here is inferred from a neighbouring figure.
 */
async function describeResource(
  response: Response,
  coverage: CoverageByUrl,
  navigationStartedAt: number | null,
): Promise<CapturedResource> {
  const request = response.request();
  const url = response.url();

  let transferredBytes = 0;
  try {
    const size = await request.sizes();
    // what crossed the wire: encoded body plus response headers.
    transferredBytes = Math.max(0, size.responseBodySize + size.responseHeadersSize);
  } catch {
    transferredBytes = 0;
  }

  // the protocol reports -1 for a phase it has no timing for, and a cache hit
  // has none at all. both come through as null.
  const timing = request.timing();
  const startMs =
    navigationStartedAt === null || timing.startTime <= 0 ? null : timing.startTime - navigationStartedAt;
  const durationMs = timing.responseEnd < 0 ? null : timing.responseEnd;

  let decodedBytes: number | null = null;
  if (transferredBytes <= MAX_DECODED_READ_BYTES) {
    try {
      decodedBytes = (await response.body()).byteLength;
    } catch {
      decodedBytes = null;
    }
  }

  const unused = coverage.get(url);
  const unusedDecodedBytes =
    unused === undefined || unused === null || decodedBytes === null
      ? null
      : Math.min(unused, decodedBytes);

  return {
    url,
    resourceType: resourceTypeOf(request.resourceType()),
    transferredBytes,
    decodedBytes,
    unusedDecodedBytes,
    startMs,
    durationMs,
  };
}

/**
 * the earliest request start of the navigation, which everything else is
 * measured from. null when no response reported a timing, in which case no
 * resource carries a position rather than all of them carrying a made-up one.
 */
function navigationStart(responses: readonly Response[]): number | null {
  const starts = responses
    .map((response) => response.request().timing().startTime)
    .filter((start) => start > 0);
  return starts.length === 0 ? null : Math.min(...starts);
}

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
    const responses: Response[] = [];
    page.on('request', () => {
      requestCount += 1;
    });
    page.on('response', (response) => {
      responses.push(response);
    });

    if (options.pass === 'warm') {
      // the warm pass is a second navigation in the same context, so the
      // cache is primed. it is a different question from the cold pass and
      // the two are never averaged together.
      await page.goto(options.url, { waitUntil: 'load', timeout });
      await page.waitForLoadState('networkidle');
      requestCount = 0;
      responses.length = 0;
    }

    if (options.coverage === true) await startCoverage(page);

    await page.goto(options.url, { waitUntil: 'load', timeout });
    const domNodeCountAtLoad = Number(await page.evaluate(NODE_COUNT));
    await page.waitForLoadState('networkidle');
    const domNodeCountAtNetworkIdle = Number(await page.evaluate(NODE_COUNT));
    const jsExecutionMs = await scriptDurationMs(page);

    // bodies and coverage are read only now. pulling a response body while the
    // page is still loading would put the measurement's own traffic inside the
    // window being measured.
    const coverage = options.coverage === true ? await stopCoverage(page) : NO_COVERAGE;
    const navigationStartedAt = navigationStart(responses);
    const resources = await Promise.all(
      responses.map((response) => describeResource(response, coverage, navigationStartedAt)),
    );

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
        coverageEnabled: options.coverage === true,
      }),
    };
  } finally {
    await context.close();
  }
}
