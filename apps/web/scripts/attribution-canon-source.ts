import type { AttributedResource } from '@balise/schemas';
import { attribute, attributeBundle, blameModules, type AttributionSide, type GitPort } from '@balise/attribution';

/**
 * the canon's regression, as an actual pair of bundles with actual source maps
 * rather than a sentence typed into a fixture. every figure the comparison
 * screen shows is computed by @balise/attribution from these two builds.
 *
 * deterministic by construction: fixed sizes, fixed content, fixed commit. the
 * resource lists sum to the transferred medians the comparison fixture already
 * carries (1 114 000 and 1 298 000 bytes, 82 and 84 requests), so the
 * attribution card and the metric table above it describe the same two runs.
 */

const ORIGIN = 'https://sevre-et-loire.fr';
export const ROUTE = '/demarches/acte-naissance';

const BASELINE_BUNDLE = `${ORIGIN}/assets/vendor-dates.a91b.js`;
const CANDIDATE_BUNDLE = `${ORIGIN}/assets/vendor-dates.c40e.js`;
const DAILYMOTION = 'https://player.dailymotion.com/embed.js';

// ---------------------------------------------------------------------------
// the two builds
// ---------------------------------------------------------------------------

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeVlq(value: number): string {
  let remaining = value < 0 ? (-value << 1) + 1 : value << 1;
  let out = '';
  do {
    let digit = remaining & 0b11111;
    remaining >>>= 5;
    if (remaining > 0) digit |= 0b100000;
    out += ALPHABET[digit];
  } while (remaining > 0);
  return out;
}

interface Module {
  source: string;
  /** attributed bytes this module must come out at, newline included. */
  bytes: number;
}

/** ascii filler, so one character is one byte and the totals are exact. */
function filler(length: number, seed: string): string {
  const unit = `/* ${seed} */`;
  return unit.repeat(Math.ceil(length / unit.length)).slice(0, length);
}

interface Build {
  url: string;
  content: string;
  sourceMap: string;
}

/**
 * one unmapped prelude line, every module end to end on one line, one unmapped
 * epilogue line. the epilogue is where a bundler's own output lives, which is
 * what grows when tree shaking gives up.
 */
function build(url: string, modules: readonly Module[], preludeBytes: number, epilogueBytes: number): Build {
  let code = '';
  const columns: number[] = [];
  modules.forEach((module, index) => {
    columns.push(code.length);
    // the newline ending the module line belongs to the last segment on it.
    const terminator = index === modules.length - 1 ? 1 : 0;
    code += filler(module.bytes - terminator, module.source);
  });

  let previousColumn = 0;
  let previousSource = 0;
  const segments = modules.map((_, index) => {
    const column = columns[index]!;
    const fields = [encodeVlq(column - previousColumn), encodeVlq(index - previousSource), 'A', 'A'].join('');
    previousColumn = column;
    previousSource = index;
    return fields;
  });

  return {
    url,
    content: `${filler(preludeBytes, 'runtime')}\n${code}\n${filler(epilogueBytes, 'chunk')}`,
    sourceMap: JSON.stringify({
      version: 3,
      file: url.split('/').pop(),
      sources: modules.map((module) => module.source),
      names: [],
      mappings: `;${segments.join(',')};`,
    }),
  };
}

const PRELUDE_BYTES = 12_000;

// the baseline: date-fns core, and the two files that use it.
const BASELINE_MODULES: readonly Module[] = [
  { source: 'webpack://selo/./node_modules/date-fns/index.js', bytes: 68_000 },
  { source: 'webpack://selo/./node_modules/date-fns/format/index.js', bytes: 94_000 },
  { source: 'webpack://selo/./node_modules/date-fns/parse/index.js', bytes: 80_000 },
  { source: 'webpack://selo/./src/lib/dates.ts', bytes: 4_120 },
  { source: 'webpack://selo/./src/lib/format-acte.ts', bytes: 21_880 },
];

// the candidate: one line changed in dates.ts pulled the whole locale index in.
const CANDIDATE_MODULES: readonly Module[] = [
  { source: 'webpack://selo/./node_modules/date-fns/index.js', bytes: 68_000 },
  { source: 'webpack://selo/./node_modules/date-fns/format/index.js', bytes: 94_000 },
  { source: 'webpack://selo/./node_modules/date-fns/parse/index.js', bytes: 80_000 },
  { source: 'webpack://selo/./node_modules/date-fns/locale/index.js', bytes: 40_000 },
  { source: 'webpack://selo/./node_modules/date-fns/locale/fr/index.js', bytes: 62_000 },
  { source: 'webpack://selo/./node_modules/date-fns/locale/br/index.js', bytes: 58_000 },
  { source: 'webpack://selo/./src/lib/dates.ts', bytes: 4_240 },
  { source: 'webpack://selo/./src/lib/format-acte.ts', bytes: 21_880 },
];

export const BASELINE_BUILD = build(BASELINE_BUNDLE, BASELINE_MODULES, PRELUDE_BYTES, 5_999);
export const CANDIDATE_BUILD = build(CANDIDATE_BUNDLE, CANDIDATE_MODULES, PRELUDE_BYTES, 29_879);

// ---------------------------------------------------------------------------
// the two runs, as the runner recorded them
// ---------------------------------------------------------------------------

const BASELINE_TRANSFERRED = 1_114_000;
const CANDIDATE_TRANSFERRED = 1_298_000;
const BASELINE_REQUESTS = 82;
const CANDIDATE_REQUESTS = 84;

interface Named {
  url: string;
  transferredBytes: number;
  decodedBytes?: number;
}

const SHARED: readonly Named[] = [
  { url: `${ORIGIN}${ROUTE}`, transferredBytes: 42_000, decodedBytes: 186_000 },
  { url: `${ORIGIN}/assets/app.9d1e.css`, transferredBytes: 38_000, decodedBytes: 214_000 },
  { url: `${ORIGIN}/assets/app.7c2f.js`, transferredBytes: 122_000, decodedBytes: 402_000 },
  { url: `${ORIGIN}/assets/fonts/martian-mono.woff2`, transferredBytes: 62_000 },
  { url: `${ORIGIN}/assets/fonts/public-sans.woff2`, transferredBytes: 62_000 },
  { url: `${ORIGIN}/assets/fonts/archivo-expanded.woff2`, transferredBytes: 62_000 },
  { url: 'https://geo.api.gouv.fr/communes?code=44', transferredBytes: 12_000 },
  { url: 'https://matomo.selo.fr/matomo.js', transferredBytes: 72_000 },
  { url: 'https://tarteaucitron.io/load.js', transferredBytes: 96_000 },
];

/** the long tail of icons and thumbnails, deterministic and summing exactly. */
function tail(count: number, total: number): AttributedResource[] {
  const sizes: number[] = [];
  let running = 0;
  for (let index = 0; index < count; index += 1) {
    const size = 2_000 + ((index * 137) % 1_800);
    sizes.push(size);
    running += size;
  }
  // the last item absorbs the difference, so the run total matches the median
  // the comparison fixture already publishes.
  sizes[count - 1] = sizes[count - 1]! + (total - running);
  return sizes.map((transferredBytes, index) => ({
    url: `${ORIGIN}/assets/media/vignette-${String(index + 1).padStart(2, '0')}.webp`,
    transferredBytes,
  }));
}

function side(build: Build, extras: readonly Named[], requests: number, transferred: number): AttributionSide {
  const named = [...SHARED, ...extras];
  const namedTotal = named.reduce((sum, resource) => sum + resource.transferredBytes, 0);
  return {
    serviceOrigin: ORIGIN,
    resources: [...named, ...tail(requests - named.length, transferred - namedTotal)],
    bundles: [{ url: build.url, content: build.content, sourceMap: build.sourceMap }],
  };
}

const BASELINE_SIDE = side(
  BASELINE_BUILD,
  [
    { url: BASELINE_BUNDLE, transferredBytes: 96_000, decodedBytes: 286_000 },
    { url: `${ORIGIN}/assets/media/hero.jpg`, transferredBytes: 240_000 },
  ],
  BASELINE_REQUESTS,
  BASELINE_TRANSFERRED,
);

const CANDIDATE_SIDE = side(
  CANDIDATE_BUILD,
  [
    { url: CANDIDATE_BUNDLE, transferredBytes: 157_000, decodedBytes: 470_000 },
    { url: `${ORIGIN}/assets/media/hero.webp`, transferredBytes: 165_000 },
    { url: DAILYMOTION, transferredBytes: 176_000 },
    { url: 'https://player.dailymotion.com/poster/x8k2p1.jpg', transferredBytes: 22_000 },
  ],
  CANDIDATE_REQUESTS,
  CANDIDATE_TRANSFERRED,
);

// ---------------------------------------------------------------------------
// the repository, as blame is allowed to see it
// ---------------------------------------------------------------------------

const COMMIT = {
  sha: 'a7f2c91d4e8b3a06f5c29b7e14d0a83bc6f2e915',
  shortSha: 'a7f2c91',
  author: 'c. bellanger',
  authoredAt: '2026-08-12T11:24:00+02:00',
  subject: "feat(dates): formats d'acte localisés (#412)",
};

const CANON_GIT: GitPort = {
  commitsTouching(path) {
    if (path === 'src/lib/dates.ts') return Promise.resolve({ status: 'ok', commits: [COMMIT] });
    if (path.startsWith('src/')) return Promise.resolve({ status: 'ok', commits: [] });
    return Promise.resolve({ status: 'unknown-path' });
  },
};

// ---------------------------------------------------------------------------

export async function buildAttributionCanon() {
  const report = attribute(BASELINE_SIDE, CANDIDATE_SIDE);

  const changed = report.modules.modules.filter((module) => module.delta !== 0);
  const blame = await blameModules(changed, { fromRef: 'e91c4a2', toRef: 'b7d0f31' }, CANON_GIT);

  // the embedded player ships no map. it is not submitted for module
  // attribution, where an unreadable bundle would only make the two sides
  // incomparable; the origin diff already sizes it, and this says why nothing
  // more can be said about it.
  const thirdPartyBundle = attributeBundle({ url: DAILYMOTION, content: 'window.DM=(function(){}());' });

  return {
    route: ROUTE,
    baselineBundleUrl: BASELINE_BUNDLE,
    candidateBundleUrl: CANDIDATE_BUNDLE,
    report,
    blame,
    thirdPartyBundle,
  };
}
