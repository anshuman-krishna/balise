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

// ---------------------------------------------------------------------------
// the corpus: one page per service, every one measured the same way
// ---------------------------------------------------------------------------

/**
 * the services the fleet and the public index set against one another.
 *
 * almost every figure those two surfaces carry is a position rather than a
 * quantity: a rank, a place in a histogram, "better than n of them". a
 * position means nothing outside a corpus that was measured, so the corpus is
 * a set of captures. the version of this that was not held six rows and told a
 * public page that four hundred and twelve services had been measured
 * continuously, which is a claim about work nobody had done.
 *
 * one page per service, one cache pass, one throttle profile, so the shared
 * scale those rows are drawn on means what it looks like it means. comparing
 * across fingerprints is invariant 3 with the fingerprint left out of the
 * argument, and it is what an index does by accident the moment two rows come
 * from different profiles.
 */

/** what the urls look like. the only thing a stack decides here. */
type Stack = 'wordpress' | 'drupal' | 'typo3' | 'spa';

interface StackPaths {
  stylesheet: (index: number) => string;
  script: (index: number) => string;
  font: (index: number) => string;
  image: (index: number) => string;
  tail: string;
}

const STACK: Record<Stack, StackPaths> = {
  wordpress: {
    stylesheet: (index) => `/wp-content/themes/site/${['style', 'blocks', 'print'][index] ?? `css-${index}`}.css`,
    script: (index) =>
      ['/wp-includes/js/jquery/jquery.min.js', '/wp-content/themes/site/main.js', '/wp-content/plugins/forms/forms.js'][
        index
      ] ?? `/wp-content/plugins/plugin-${index}/script.js`,
    font: (index) => `/wp-content/themes/site/fonts/face-${index + 1}.woff2`,
    image: (index) => `/wp-content/uploads/2026/0${(index % 8) + 1}/visuel-${index + 1}.jpg`,
    tail: '/wp-content/uploads/2026/08/vignette-{n}.jpg',
  },
  drupal: {
    stylesheet: (index) => `/sites/default/files/css/css_${index + 1}.css`,
    script: (index) =>
      ['/core/misc/drupal.js', '/sites/default/files/js/js_aggregate.js', '/core/misc/ajax.js'][index] ??
      `/sites/default/files/js/js_${index}.js`,
    font: (index) => `/themes/custom/site/fonts/face-${index + 1}.woff2`,
    image: (index) => `/sites/default/files/styles/large/public/visuel-${index + 1}.jpg`,
    tail: '/sites/default/files/styles/thumbnail/public/vignette-{n}.jpg',
  },
  typo3: {
    stylesheet: (index) => `/typo3temp/assets/css/bundle-${index + 1}.css`,
    script: (index) => `/typo3conf/ext/site/Resources/Public/JavaScript/bundle-${index + 1}.js`,
    font: (index) => `/typo3conf/ext/site/Resources/Public/Fonts/face-${index + 1}.woff2`,
    image: (index) => `/fileadmin/user_upload/visuel-${index + 1}.jpg`,
    tail: '/fileadmin/_processed_/vignette-{n}.jpg',
  },
  spa: {
    stylesheet: (index) => `/assets/index-${index + 1}.css`,
    script: (index) => `/assets/${['index', 'vendor', 'charts'][index] ?? `chunk-${index}`}.js`,
    font: (index) => `/assets/fonts/face-${index + 1}.woff2`,
    image: (index) => `/assets/media/visuel-${index + 1}.jpg`,
    tail: '/assets/media/vignette-{n}.jpg',
  },
};

/**
 * text compresses on the wire and images and fonts arrive as they are stored.
 * the factor matters because a share of decoded bytes and a share of the page
 * are different denominators, and the findings engine will not accept the one
 * for the other.
 */
const DECODED_FACTOR: Partial<Record<ResourceType, number>> = {
  document: 5.6,
  stylesheet: 5.1,
  script: 4.6,
};

/** a vendor on someone else's origin, before the page it lands on is known. */
type Vendor = Omit<Authored, 'startMs' | 'durationMs'>;

const VENDOR = {
  matomo: (transferredBytes: number): Vendor => ({
    url: 'https://stats.data.gouv.fr/matomo.js',
    type: 'script',
    transferredBytes,
    decodedBytes: transferredBytes * 4.6,
  }),
  tagManager: (transferredBytes: number): Vendor => ({
    url: 'https://www.googletagmanager.com/gtag/js',
    type: 'script',
    transferredBytes,
    decodedBytes: transferredBytes * 4.6,
  }),
  youtube: (transferredBytes: number): Vendor => ({
    url: 'https://www.youtube.com/iframe_api',
    type: 'script',
    transferredBytes,
    decodedBytes: transferredBytes * 4.6,
  }),
  dailymotion: (transferredBytes: number): Vendor => ({
    url: DAILYMOTION,
    type: 'script',
    transferredBytes,
    decodedBytes: transferredBytes * 4.6,
  }),
  leaflet: (transferredBytes: number): Vendor => ({
    url: 'https://unpkg.com/leaflet/dist/leaflet.js',
    type: 'script',
    transferredBytes,
    decodedBytes: transferredBytes * 4.6,
  }),
  tiles: (transferredBytes: number, count: number): Vendor[] =>
    Array.from({ length: count }, (_, index) => ({
      url: `https://tile.openstreetmap.org/13/${4_093 + index}/2892.png`,
      type: 'image',
      transferredBytes,
    })),
  webFonts: (transferredBytes: number): Vendor => ({
    url: 'https://fonts.gstatic.com/s/opensans/v40/face.woff2',
    type: 'font',
    transferredBytes,
  }),
  chat: (transferredBytes: number): Vendor => ({
    url: 'https://widget.crisp.chat/l.js',
    type: 'script',
    transferredBytes,
    decodedBytes: transferredBytes * 4.6,
  }),
} as const;

interface SiteSpec {
  origin: string;
  stack: Stack;
  documentBytes: number;
  stylesheetBytes: readonly number[];
  scriptBytes: readonly number[];
  fontBytes: readonly number[];
  /** the images the page names, heaviest first. the rest fall into the tail. */
  imageBytes: readonly number[];
  thirdParties: readonly Vendor[];
  requestCount: number;
  transferredBytes: number;
  domAtLoad: number;
  domAtNetworkIdle: number;
  jsExecutionMs: number;
}

/**
 * one site's capture from a compact description of it. the description is
 * authored; the page weight is still the sum of the list this produces, and
 * the tail refuses to close a gap with a response no browser would fetch.
 */
function site(spec: SiteSpec): RawCapture {
  const paths = STACK[spec.stack];
  const named: Authored[] = [];
  let at = 0;

  const push = (url: string, type: ResourceType, transferredBytes: number, duration: number) => {
    const factor = DECODED_FACTOR[type];
    named.push({
      url,
      type,
      transferredBytes,
      ...(factor === undefined ? {} : { decodedBytes: Math.round(transferredBytes * factor) }),
      startMs: at,
      durationMs: duration,
    });
    at += 14;
  };

  push(`${spec.origin}/`, 'document', spec.documentBytes, 240 + Math.round(spec.documentBytes / 200));
  at = 300;
  spec.stylesheetBytes.forEach((bytes, index) =>
    push(`${spec.origin}${paths.stylesheet(index)}`, 'stylesheet', bytes, 160 + Math.round(bytes / 300)),
  );
  spec.scriptBytes.forEach((bytes, index) =>
    push(`${spec.origin}${paths.script(index)}`, 'script', bytes, 190 + Math.round(bytes / 300)),
  );
  spec.fontBytes.forEach((bytes, index) =>
    push(`${spec.origin}${paths.font(index)}`, 'font', bytes, 170 + index * 8),
  );
  at = 460;
  spec.imageBytes.forEach((bytes, index) =>
    push(`${spec.origin}${paths.image(index)}`, 'image', bytes, 280 + Math.round(bytes / 300)),
  );
  // a third party arrives late by construction: it is fetched by a script the
  // page had to parse first.
  spec.thirdParties.forEach((vendor, index) =>
    named.push({
      ...vendor,
      startMs: 1_120 + index * 60,
      durationMs: 220 + Math.round(vendor.transferredBytes / 200),
    }),
  );

  return capture({
    origin: spec.origin,
    named,
    requestCount: spec.requestCount,
    transferredBytes: spec.transferredBytes,
    tailName: paths.tail,
    tailFirstStartMs: 620,
    domAtLoad: spec.domAtLoad,
    domAtNetworkIdle: spec.domAtNetworkIdle,
    jsExecutionMs: spec.jsExecutionMs,
  });
}

/**
 * the twelve. `bibliotheques-selo.fr` is not among them because it is already
 * held: the free scan measured it, and a domain that weighs one thing on the
 * public scan and another in the index is the two-resource-lists bug wearing
 * different clothes.
 */
export const CORPUS_CAPTURES: Readonly<Record<string, RawCapture>> = {
  'craonnais.fr': site({
    origin: 'https://craonnais.fr',
    stack: 'spa',
    documentBytes: 9_000,
    stylesheetBytes: [18_000],
    scriptBytes: [26_000],
    fontBytes: [16_000],
    imageBytes: [58_000, 24_000, 14_000],
    thirdParties: [VENDOR.matomo(12_000)],
    requestCount: 18,
    transferredBytes: 210_000,
    domAtLoad: 288,
    domAtNetworkIdle: 300,
    jsExecutionMs: 140,
  }),
  'mairie-lanvaux.fr': site({
    origin: 'https://mairie-lanvaux.fr',
    stack: 'wordpress',
    documentBytes: 14_000,
    stylesheetBytes: [22_000, 6_000],
    scriptBytes: [48_000, 9_000],
    fontBytes: [14_000, 14_000],
    imageBytes: [64_000, 28_000, 21_000],
    thirdParties: [VENDOR.matomo(12_000)],
    requestCount: 26,
    transferredBytes: 318_000,
    domAtLoad: 502,
    domAtNetworkIdle: 520,
    jsExecutionMs: 210,
  }),
  'ville-de-plessac.fr': site({
    origin: 'https://ville-de-plessac.fr',
    stack: 'wordpress',
    documentBytes: 18_000,
    stylesheetBytes: [28_000, 8_000],
    scriptBytes: [62_000, 14_000],
    fontBytes: [15_000, 15_000, 15_000],
    imageBytes: [72_000, 34_000, 26_000],
    thirdParties: [VENDOR.tagManager(44_000)],
    requestCount: 34,
    transferredBytes: 402_000,
    domAtLoad: 762,
    domAtNetworkIdle: 780,
    jsExecutionMs: 280,
  }),
  'musees-selo.fr': site({
    origin: 'https://musees-selo.fr',
    stack: 'drupal',
    documentBytes: 22_000,
    stylesheetBytes: [34_000, 11_000],
    scriptBytes: [78_000, 22_000],
    fontBytes: [16_000, 16_000],
    imageBytes: [96_000, 48_000, 36_000, 28_000],
    thirdParties: [VENDOR.matomo(12_000), VENDOR.youtube(42_000)],
    requestCount: 44,
    transferredBytes: 604_000,
    domAtLoad: 1_214,
    domAtNetworkIdle: 1_240,
    jsExecutionMs: 340,
  }),
  'prefecture-arvor.fr': site({
    origin: 'https://prefecture-arvor.fr',
    stack: 'typo3',
    documentBytes: 26_000,
    stylesheetBytes: [42_000, 14_000],
    scriptBytes: [88_000, 31_000, 12_000],
    fontBytes: [17_000, 17_000],
    imageBytes: [104_000, 52_000, 38_000],
    thirdParties: [VENDOR.matomo(12_000), VENDOR.webFonts(24_000)],
    requestCount: 48,
    transferredBytes: 712_000,
    domAtLoad: 1_452,
    domAtNetworkIdle: 1_486,
    jsExecutionMs: 380,
  }),
  'sevre-et-loire.fr': site({
    origin: ORIGIN,
    stack: 'spa',
    documentBytes: 24_000,
    stylesheetBytes: [38_000, 12_000],
    scriptBytes: [96_000, 62_000, 18_000],
    fontBytes: [18_000, 18_000],
    imageBytes: [118_000, 62_000, 44_000, 32_000],
    thirdParties: [VENDOR.matomo(12_000), VENDOR.dailymotion(62_000)],
    requestCount: 52,
    transferredBytes: 842_000,
    domAtLoad: 1_588,
    domAtNetworkIdle: 1_620,
    jsExecutionMs: 420,
  }),
  'eau-selo.fr': site({
    origin: 'https://eau-selo.fr',
    stack: 'wordpress',
    documentBytes: 22_000,
    stylesheetBytes: [32_000, 9_000],
    scriptBytes: [66_000, 18_000],
    fontBytes: [16_000, 16_000],
    imageBytes: [88_000, 42_000, 30_000],
    thirdParties: [
      VENDOR.tagManager(46_000),
      VENDOR.youtube(128_000),
      VENDOR.chat(88_000),
      VENDOR.leaflet(44_000),
      VENDOR.webFonts(26_000),
      ...VENDOR.tiles(30_000, 6),
    ],
    requestCount: 58,
    transferredBytes: 1_246_000,
    domAtLoad: 1_386,
    domAtNetworkIdle: 1_410,
    jsExecutionMs: 520,
  }),
  'ars-bretagne.fr': site({
    origin: 'https://ars-bretagne.fr',
    stack: 'drupal',
    documentBytes: 34_000,
    stylesheetBytes: [48_000, 16_000],
    scriptBytes: [124_000, 46_000, 22_000],
    fontBytes: [18_000, 18_000, 18_000],
    imageBytes: [142_000, 78_000, 56_000, 42_000],
    thirdParties: [VENDOR.matomo(12_000), VENDOR.tagManager(46_000), VENDOR.webFonts(26_000)],
    requestCount: 74,
    transferredBytes: 1_588_000,
    domAtLoad: 2_218,
    domAtNetworkIdle: 2_260,
    jsExecutionMs: 560,
  }),
  'transports-selo.fr': site({
    origin: 'https://transports-selo.fr',
    stack: 'spa',
    documentBytes: 28_000,
    stylesheetBytes: [56_000, 18_000],
    scriptBytes: [286_000, 142_000, 64_000],
    fontBytes: [20_000, 20_000],
    imageBytes: [186_000, 94_000, 68_000, 52_000],
    thirdParties: [
      VENDOR.tagManager(46_000),
      VENDOR.leaflet(44_000),
      VENDOR.chat(88_000),
      VENDOR.youtube(62_000),
      ...VENDOR.tiles(32_000, 8),
    ],
    requestCount: 96,
    transferredBytes: 2_184_000,
    domAtLoad: 3_094,
    domAtNetworkIdle: 3_140,
    jsExecutionMs: 1_240,
  }),
  'chu-armorique.fr': site({
    origin: 'https://chu-armorique.fr',
    stack: 'typo3',
    documentBytes: 42_000,
    stylesheetBytes: [72_000, 26_000, 11_000],
    scriptBytes: [318_000, 164_000, 88_000, 34_000],
    fontBytes: [21_000, 21_000, 21_000, 21_000],
    imageBytes: [284_000, 168_000, 112_000, 86_000, 64_000],
    thirdParties: [
      VENDOR.tagManager(46_000),
      VENDOR.chat(88_000),
      VENDOR.youtube(62_000),
      VENDOR.webFonts(26_000),
    ],
    requestCount: 118,
    transferredBytes: 3_062_000,
    domAtLoad: 4_548,
    domAtNetworkIdle: 4_620,
    jsExecutionMs: 1_860,
  }),
  'portail-arvor.fr': site({
    origin: 'https://portail-arvor.fr',
    stack: 'wordpress',
    documentBytes: 58_000,
    stylesheetBytes: [96_000, 38_000, 14_000],
    scriptBytes: [412_000, 226_000, 118_000, 52_000],
    fontBytes: [22_000, 22_000, 22_000, 22_000, 22_000, 22_000],
    imageBytes: [386_000, 242_000, 164_000, 118_000, 92_000],
    thirdParties: [
      VENDOR.tagManager(46_000),
      VENDOR.chat(88_000),
      VENDOR.youtube(62_000),
      VENDOR.dailymotion(62_000),
      VENDOR.webFonts(26_000),
      VENDOR.leaflet(44_000),
    ],
    requestCount: 142,
    transferredBytes: 4_418_000,
    domAtLoad: 6_092,
    domAtNetworkIdle: 6_180,
    jsExecutionMs: 2_640,
  }),
};
