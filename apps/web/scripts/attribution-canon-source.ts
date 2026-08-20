import type { AttributedResource, RawCapture } from '@balise/schemas';
import {
  attribute,
  attributeBundle,
  blameModules,
  placeGrowth,
  type AttributionSide,
  type GitPort,
} from '@balise/attribution';
import {
  BASELINE_BUNDLE,
  BASELINE_CAPTURE,
  CANDIDATE_BUNDLE,
  CANDIDATE_CAPTURE,
  DAILYMOTION,
  ROUTE,
} from './capture-canon-source';

/**
 * the canon's regression, as an actual pair of bundles with actual source maps
 * rather than a sentence typed into a fixture. every figure the comparison
 * screen shows is computed by @balise/attribution from these two builds.
 *
 * deterministic by construction: fixed sizes, fixed content, fixed commit. the
 * resource lists are not restated here: both sides read the captures in
 * capture-canon-source, so the attribution card and the metric table above it
 * are two readings of one pair of runs.
 */

export { ROUTE } from './capture-canon-source';

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
  /** original lines the bundle takes from it, as a real map would name them. */
  lines: number;
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
 *
 * each module gets one segment per original line it is taken from, which is
 * what a real map carries and what lets a source file be placed at a line
 * rather than at a default.
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
  let previousLine = 0;
  const segments = modules.flatMap((module, index) => {
    const start = columns[index]!;
    const terminator = index === modules.length - 1 ? 1 : 0;
    const width = module.bytes - terminator;
    const fields: string[] = [];

    for (let line = 0; line < module.lines; line += 1) {
      const column = start + Math.floor((line * width) / module.lines);
      fields.push(
        [
          encodeVlq(column - previousColumn),
          encodeVlq(index - previousSource),
          encodeVlq(line - previousLine),
          'A',
        ].join(''),
      );
      previousColumn = column;
      previousSource = index;
      previousLine = line;
    }
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
  { source: 'webpack://selo/./node_modules/date-fns/index.js', bytes: 68_000, lines: 640 },
  { source: 'webpack://selo/./node_modules/date-fns/format/index.js', bytes: 94_000, lines: 780 },
  { source: 'webpack://selo/./node_modules/date-fns/parse/index.js', bytes: 80_000, lines: 720 },
  { source: 'webpack://selo/./src/lib/dates.ts', bytes: 4_120, lines: 96 },
  { source: 'webpack://selo/./src/lib/format-acte.ts', bytes: 21_880, lines: 318 },
];

// the candidate: one line changed in dates.ts pulled the whole locale index in.
const CANDIDATE_MODULES: readonly Module[] = [
  { source: 'webpack://selo/./node_modules/date-fns/index.js', bytes: 68_000, lines: 640 },
  { source: 'webpack://selo/./node_modules/date-fns/format/index.js', bytes: 94_000, lines: 780 },
  { source: 'webpack://selo/./node_modules/date-fns/parse/index.js', bytes: 80_000, lines: 720 },
  { source: 'webpack://selo/./node_modules/date-fns/locale/index.js', bytes: 40_000, lines: 210 },
  { source: 'webpack://selo/./node_modules/date-fns/locale/fr/index.js', bytes: 62_000, lines: 340 },
  { source: 'webpack://selo/./node_modules/date-fns/locale/br/index.js', bytes: 58_000, lines: 320 },
  { source: 'webpack://selo/./src/lib/dates.ts', bytes: 4_240, lines: 104 },
  { source: 'webpack://selo/./src/lib/format-acte.ts', bytes: 21_880, lines: 318 },
];

export const BASELINE_BUILD = build(BASELINE_BUNDLE, BASELINE_MODULES, PRELUDE_BYTES, 5_999);
export const CANDIDATE_BUILD = build(CANDIDATE_BUNDLE, CANDIDATE_MODULES, PRELUDE_BYTES, 29_879);

// ---------------------------------------------------------------------------
// the two runs, as the runner recorded them
// ---------------------------------------------------------------------------

/**
 * attribution sees a subset of a capture: a url, what crossed the wire, and the
 * decoded size where the capture holds one, because a source map explains
 * decoded bytes and never transferred ones. the type, the coverage and the
 * timing stay on the capture, which is where the inventory reads them.
 */
function attributed(capture: RawCapture): AttributedResource[] {
  return capture.resources.map((resource) => ({
    url: resource.url,
    transferredBytes: resource.transferredBytes,
    ...(resource.decodedBytes === null ? {} : { decodedBytes: resource.decodedBytes }),
  }));
}

function side(capture: RawCapture, build: Build): AttributionSide {
  return {
    serviceOrigin: capture.serviceOrigin,
    resources: attributed(capture),
    bundles: [{ url: build.url, content: build.content, sourceMap: build.sourceMap }],
  };
}

export const BASELINE_SIDE = side(BASELINE_CAPTURE, BASELINE_BUILD);
export const CANDIDATE_SIDE = side(CANDIDATE_CAPTURE, CANDIDATE_BUILD);

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

  // what the check may annotate: grown repository files the candidate map
  // placed. every dependency in the diff drops out here, which is the point.
  const placed = placeGrowth(changed);

  return {
    route: ROUTE,
    baselineBundleUrl: BASELINE_BUNDLE,
    candidateBundleUrl: CANDIDATE_BUNDLE,
    report,
    blame,
    placed,
    thirdPartyBundle,
  };
}
