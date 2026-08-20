import type { CapturedResource, RawCapture, ResourceType } from '@balise/schemas';

/**
 * the two captures the canon is about: one route, measured before and after
 * pull request #412.
 *
 * a capture is authored here and nowhere else. before this file there were two
 * resource lists for run #4812 and they described different pages: the run
 * detail held eight resources and a tail of seventy-six weighing two kilobytes
 * between them, which is twenty-six bytes each and is not a thing a browser can
 * fetch, while the attribution canon held eighty-four real ones. the two also
 * disagreed about the run's third parties, 340 KB against 180 KB on the
 * baseline, so the metric row and the origin diff beneath it on the same screen
 * were answering from different measurements.
 *
 * everything downstream reduces this rather than restating it: `extractMetrics`
 * for the six metrics, `summariseResources` for the inventory, the attribution
 * engine for the diff, the budget engine for the verdicts. no generator sums a
 * resource list of its own.
 */

export const ORIGIN = 'https://sevre-et-loire.fr';
export const ROUTE = '/demarches/acte-naissance';

export const BASELINE_BUNDLE = `${ORIGIN}/assets/vendor-dates.a91b.js`;
export const CANDIDATE_BUNDLE = `${ORIGIN}/assets/vendor-dates.c40e.js`;
export const DAILYMOTION = 'https://player.dailymotion.com/embed.js';

/** what each run of the route weighs, and how many requests it takes. */
const BASELINE_TRANSFERRED = 1_114_000;
const CANDIDATE_TRANSFERRED = 1_298_000;
const BASELINE_REQUESTS = 82;
const CANDIDATE_REQUESTS = 84;

interface Authored {
  url: string;
  type: ResourceType;
  transferredBytes: number;
  /** null where a browser hands back no body. */
  decodedBytes?: number | null;
  /** script and stylesheet only. everything else is not applicable, not zero. */
  unusedDecodedBytes?: number;
  startMs: number;
  durationMs: number;
}

function resource(authored: Authored): CapturedResource {
  return {
    url: authored.url,
    resourceType: authored.type,
    transferredBytes: authored.transferredBytes,
    decodedBytes: authored.decodedBytes ?? authored.transferredBytes,
    unusedDecodedBytes: authored.unusedDecodedBytes ?? null,
    startMs: authored.startMs,
    durationMs: authored.durationMs,
  };
}

/** on both sides of the comparison, unchanged by the pull request. */
const SHARED: readonly Authored[] = [
  {
    url: `${ORIGIN}${ROUTE}`,
    type: 'document',
    transferredBytes: 42_000,
    decodedBytes: 186_000,
    startMs: 0,
    durationMs: 240,
  },
  {
    url: `${ORIGIN}/assets/app.9d1e.css`,
    type: 'stylesheet',
    transferredBytes: 38_000,
    decodedBytes: 214_000,
    unusedDecodedBytes: 148_000,
    startMs: 252,
    durationMs: 180,
  },
  {
    url: `${ORIGIN}/assets/app.7c2f.js`,
    type: 'script',
    transferredBytes: 122_000,
    decodedBytes: 402_000,
    unusedDecodedBytes: 176_000,
    startMs: 264,
    durationMs: 420,
  },
  {
    url: `${ORIGIN}/assets/fonts/martian-mono.woff2`,
    type: 'font',
    transferredBytes: 62_000,
    startMs: 288,
    durationMs: 190,
  },
  {
    url: `${ORIGIN}/assets/fonts/public-sans.woff2`,
    type: 'font',
    transferredBytes: 62_000,
    startMs: 296,
    durationMs: 186,
  },
  {
    url: `${ORIGIN}/assets/fonts/archivo-expanded.woff2`,
    type: 'font',
    transferredBytes: 62_000,
    startMs: 304,
    durationMs: 194,
  },
  {
    url: 'https://geo.api.gouv.fr/communes?code=44',
    type: 'other',
    transferredBytes: 12_000,
    decodedBytes: 48_000,
    startMs: 720,
    durationMs: 210,
  },
  {
    url: 'https://matomo.selo.fr/matomo.js',
    type: 'script',
    transferredBytes: 72_000,
    decodedBytes: 214_000,
    unusedDecodedBytes: 96_000,
    startMs: 832,
    durationMs: 260,
  },
  {
    url: 'https://tarteaucitron.io/load.js',
    type: 'script',
    transferredBytes: 96_000,
    decodedBytes: 288_000,
    unusedDecodedBytes: 121_000,
    startMs: 936,
    durationMs: 300,
  },
];

const BASELINE_ONLY: readonly Authored[] = [
  {
    url: BASELINE_BUNDLE,
    type: 'script',
    transferredBytes: 96_000,
    decodedBytes: 286_000,
    unusedDecodedBytes: 258_000,
    startMs: 340,
    durationMs: 320,
  },
  {
    url: `${ORIGIN}/assets/media/hero.jpg`,
    type: 'image',
    transferredBytes: 240_000,
    startMs: 468,
    durationMs: 620,
  },
];

const CANDIDATE_ONLY: readonly Authored[] = [
  {
    url: CANDIDATE_BUNDLE,
    type: 'script',
    transferredBytes: 157_000,
    decodedBytes: 470_000,
    // the locale data the pull request added is shipped and never executed.
    // this is the figure the attribution card explains.
    unusedDecodedBytes: 442_000,
    startMs: 340,
    durationMs: 460,
  },
  {
    url: `${ORIGIN}/assets/media/hero.webp`,
    type: 'image',
    transferredBytes: 165_000,
    startMs: 468,
    durationMs: 480,
  },
  {
    url: DAILYMOTION,
    type: 'script',
    transferredBytes: 176_000,
    decodedBytes: 512_000,
    unusedDecodedBytes: 214_000,
    startMs: 1_092,
    durationMs: 420,
  },
  {
    url: 'https://player.dailymotion.com/poster/x8k2p1.jpg',
    type: 'image',
    transferredBytes: 22_000,
    startMs: 1_520,
    durationMs: 180,
  },
];

/**
 * the long tail of thumbnails, deterministic and summing exactly. the last one
 * absorbs the difference, which is how the page comes out at the weight the
 * canon says it weighs: the tail is the fixture's shock absorber and every
 * named resource above it is the size it says it is.
 */
function tail(count: number, total: number): CapturedResource[] {
  const sizes: number[] = [];
  let running = 0;
  for (let index = 0; index < count; index += 1) {
    const size = 2_000 + ((index * 137) % 1_800);
    sizes.push(size);
    running += size;
  }
  sizes[count - 1] = sizes[count - 1]! + (total - running);

  return sizes.map((transferredBytes, index) =>
    resource({
      url: `${ORIGIN}/assets/media/vignette-${String(index + 1).padStart(2, '0')}.webp`,
      type: 'image',
      transferredBytes,
      startMs: 620 + index * 22,
      durationMs: 120 + ((index * 53) % 140),
    }),
  );
}

function capture(
  named: readonly Authored[],
  requestCount: number,
  transferred: number,
  dom: { atLoad: number; atNetworkIdle: number },
  jsExecutionMs: number,
): RawCapture {
  const records = named.map(resource);
  const namedTotal = records.reduce((sum, record) => sum + record.transferredBytes, 0);
  return {
    serviceOrigin: ORIGIN,
    pass: 'cold',
    resources: [...records, ...tail(requestCount - records.length, transferred - namedTotal)],
    requestCount,
    domNodeCountAtLoad: dom.atLoad,
    domNodeCountAtNetworkIdle: dom.atNetworkIdle,
    jsExecutionMs,
  };
}

/** run #4790, main. */
export const BASELINE_CAPTURE = capture(
  [...SHARED, ...BASELINE_ONLY],
  BASELINE_REQUESTS,
  BASELINE_TRANSFERRED,
  { atLoad: 2_040, atNetworkIdle: 2_118 },
  548,
);

/** run #4812, pr/412. */
export const CANDIDATE_CAPTURE = capture(
  [...SHARED, ...CANDIDATE_ONLY],
  CANDIDATE_REQUESTS,
  CANDIDATE_TRANSFERRED,
  { atLoad: 2_062, atNetworkIdle: 2_140 },
  612,
);
