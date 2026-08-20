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
 * the long tail of thumbnails: deterministic, spread around its own mean, and
 * summing exactly to what is left after the named resources. the tail is the
 * fixture's shock absorber, so every named resource above it is the size it
 * says it is and the page still comes out at the weight the canon states.
 *
 * the floor is checked rather than assumed. before this file the tail of run
 * #4812 was seventy-six requests weighing two kilobytes between them, which is
 * twenty-six bytes each, smaller than the response headers that arrive with
 * them. a tail that would produce one now throws here.
 */
const TAIL_FLOOR_BYTES = 1_000;

interface Tail {
  origin: string;
  name: string;
  count: number;
  total: number;
  firstStartMs: number;
}

function tail(spec: Tail): CapturedResource[] {
  if (spec.count === 0) return [];
  // spread around the mean rather than around a constant, so a tail of forty
  // thumbnails weighing 200 KB and one of seventy weighing 200 KB are both
  // plausible pages and neither ends with one file absorbing the rest.
  const mean = spec.total / spec.count;
  const sizes: number[] = [];
  let running = 0;
  for (let index = 0; index < spec.count; index += 1) {
    const size = Math.round(mean * (0.6 + (0.8 * ((index * 137) % 100)) / 100));
    sizes.push(size);
    running += size;
  }
  sizes[spec.count - 1] = sizes[spec.count - 1]! + (spec.total - running);
  const smallest = Math.min(...sizes);
  if (smallest < TAIL_FLOOR_BYTES) {
    throw new Error(
      `the tail of ${spec.origin} would carry a ${smallest} byte response; no browser fetches one that small`,
    );
  }

  return sizes.map((transferredBytes, index) =>
    resource({
      url: `${spec.origin}${spec.name.replace('{n}', String(index + 1).padStart(2, '0'))}`,
      type: 'image',
      transferredBytes,
      startMs: spec.firstStartMs + index * 22,
      durationMs: 120 + ((index * 53) % 140),
    }),
  );
}

interface CaptureSpec {
  origin: string;
  named: readonly Authored[];
  requestCount: number;
  transferredBytes: number;
  tailName: string;
  tailFirstStartMs: number;
  domAtLoad: number;
  domAtNetworkIdle: number;
  jsExecutionMs: number;
}

function capture(spec: CaptureSpec): RawCapture {
  const records = spec.named.map(resource);
  const namedTotal = records.reduce((sum, record) => sum + record.transferredBytes, 0);
  return {
    serviceOrigin: spec.origin,
    pass: 'cold',
    resources: [
      ...records,
      ...tail({
        origin: spec.origin,
        name: spec.tailName,
        count: spec.requestCount - records.length,
        total: spec.transferredBytes - namedTotal,
        firstStartMs: spec.tailFirstStartMs,
      }),
    ],
    requestCount: spec.requestCount,
    domNodeCountAtLoad: spec.domAtLoad,
    domNodeCountAtNetworkIdle: spec.domAtNetworkIdle,
    jsExecutionMs: spec.jsExecutionMs,
  };
}

/** run #4790, main. */
export const BASELINE_CAPTURE = capture({
  origin: ORIGIN,
  named: [...SHARED, ...BASELINE_ONLY],
  requestCount: BASELINE_REQUESTS,
  transferredBytes: BASELINE_TRANSFERRED,
  tailName: '/assets/media/vignette-{n}.webp',
  tailFirstStartMs: 620,
  domAtLoad: 2_040,
  domAtNetworkIdle: 2_118,
  jsExecutionMs: 548,
});

/** run #4812, pr/412. */
export const CANDIDATE_CAPTURE = capture({
  origin: ORIGIN,
  named: [...SHARED, ...CANDIDATE_ONLY],
  requestCount: CANDIDATE_REQUESTS,
  transferredBytes: CANDIDATE_TRANSFERRED,
  tailName: '/assets/media/vignette-{n}.webp',
  tailFirstStartMs: 620,
  domAtLoad: 2_062,
  domAtNetworkIdle: 2_140,
  jsExecutionMs: 612,
});

// ---------------------------------------------------------------------------
// the free scan: a stranger's domain, measured once
// ---------------------------------------------------------------------------

/**
 * one cold pass on the home page of a service nobody asked us to audit, which
 * is what the public scan is.
 *
 * it exists so the scan's findings are findings. the surface used to carry
 * three authored sentences, two of which stated things a capture cannot hold:
 * that four images were unresized pngs, and that six font files were unsubset
 * weights of two families. what a capture holds is that images are 66 % of the
 * page, that one of them is a quarter of it on its own, and that six font
 * files weigh 102 KB. that is the same page described without the invention.
 *
 * its scripts carry no coverage, because coverage is off by default on a
 * measured run (METHODOLOGY.md open decision 14). the findings engine
 * withholds the unexecuted-bytes finding rather than reporting zero, and the
 * scan says so.
 */
export const SCAN_ORIGIN = 'https://bibliotheques-selo.fr';

const SCAN_NAMED: readonly Authored[] = [
  {
    url: `${SCAN_ORIGIN}/`,
    type: 'document',
    transferredBytes: 24_000,
    decodedBytes: 138_000,
    startMs: 0,
    durationMs: 310,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/themes/selo/style.css`,
    type: 'stylesheet',
    transferredBytes: 38_000,
    decodedBytes: 196_000,
    startMs: 322,
    durationMs: 210,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/plugins/diaporama/slider.css`,
    type: 'stylesheet',
    transferredBytes: 8_000,
    decodedBytes: 34_000,
    startMs: 330,
    durationMs: 150,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/themes/selo/print.css`,
    type: 'stylesheet',
    transferredBytes: 6_000,
    decodedBytes: 21_000,
    startMs: 338,
    durationMs: 140,
  },
  {
    url: `${SCAN_ORIGIN}/wp-includes/js/jquery/jquery.min.js`,
    type: 'script',
    transferredBytes: 62_000,
    decodedBytes: 288_000,
    startMs: 348,
    durationMs: 260,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/plugins/diaporama/slider.js`,
    type: 'script',
    transferredBytes: 22_000,
    decodedBytes: 78_000,
    startMs: 360,
    durationMs: 220,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/themes/selo/tarteaucitron.js`,
    type: 'script',
    transferredBytes: 18_000,
    decodedBytes: 64_000,
    startMs: 372,
    durationMs: 200,
  },
  {
    url: 'https://www.googletagmanager.com/gtag/js?id=G-4KX2QN',
    type: 'script',
    transferredBytes: 46_000,
    decodedBytes: 152_000,
    startMs: 1_180,
    durationMs: 330,
  },
  {
    url: 'https://www.google-analytics.com/analytics.js',
    type: 'script',
    transferredBytes: 4_000,
    decodedBytes: 12_000,
    startMs: 1_520,
    durationMs: 180,
  },
  ...['opensans-regular', 'opensans-bold', 'opensans-italic', 'merriweather-regular', 'merriweather-bold', 'merriweather-light'].map(
    (face, index): Authored => ({
      url: `${SCAN_ORIGIN}/wp-content/themes/selo/fonts/${face}.woff`,
      type: 'font',
      transferredBytes: 17_000,
      startMs: 396 + index * 14,
      durationMs: 180 + index * 8,
    }),
  ),
  {
    url: `${SCAN_ORIGIN}/wp-content/uploads/2019/04/bandeau-bibliotheque.png`,
    type: 'image',
    transferredBytes: 258_000,
    startMs: 440,
    durationMs: 980,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/uploads/2026/08/actualite-rentree.png`,
    type: 'image',
    transferredBytes: 92_000,
    startMs: 512,
    durationMs: 540,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/uploads/2026/08/actualite-club-lecture.png`,
    type: 'image',
    transferredBytes: 84_000,
    startMs: 528,
    durationMs: 510,
  },
  {
    url: `${SCAN_ORIGIN}/wp-content/themes/selo/logo-reseau.png`,
    type: 'image',
    transferredBytes: 12_000,
    startMs: 300,
    durationMs: 160,
  },
];

export const SCAN_CAPTURE = capture({
  origin: SCAN_ORIGIN,
  named: SCAN_NAMED,
  requestCount: 61,
  transferredBytes: 980_000,
  tailName: '/wp-content/uploads/2026/08/vignette-{n}.jpg',
  tailFirstStartMs: 560,
  domAtLoad: 1_762,
  domAtNetworkIdle: 1_830,
  jsExecutionMs: 812,
});
