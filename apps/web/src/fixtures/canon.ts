import type { AggregatedMetric, MetricId, NoiseFloor, Unit } from '@balise/schemas';
import { formatInt } from '@balise/ui';

// the scenario canon: one internally consistent fictional dataset, from the
// design handoff. none of it is measured. it exists so every screen tells the
// same story until the runner (v1) and the api (v2) replace it with real data.
// keep the cross-screen arithmetic consistent; the design brief in testing/
// holds the canon.

export const canon = {
  tenant: {
    agency: 'Atelier Sextant',
    city: 'Nantes',
    plan: 'AGENCE',
    servicesUsed: 6,
    servicesTotal: 10,
  },
  service: {
    domain: 'sevre-et-loire.fr',
    organisation: 'Métropole de Sèvre-et-Loire',
    title: 'Portail métropolitain',
    branch: 'main',
    scenarios: 14,
    journeys: 4,
    continuousSince: '03 March 2026',
    runsRetained: 4812,
  },
  appBar: {
    deadlineDays: 47,
    lastRunTime: '14:02',
    lastRunMinutesAgo: 8,
    userInitials: 'MC',
    fingerprint:
      'chromium 127.0.6533.88 · img sha256:4e91c2a7 · desktop-fibre + mobile-4g · eu-west-par',
    methodologyVersion: 'v1.2',
  },
  referenceModel: { id: 'swd', version: '4.0' },
  models: [
    { name: 'EcoIndex', version: '3.1', value: 0.31, isReference: false },
    { name: 'SWD v4', version: '4.0', value: 0.42, isReference: true },
    { name: 'ADEME BE', version: '2024', value: 0.37, isReference: false },
    { name: '1byte', version: '2021', value: 0.58, isReference: false },
  ],
  carbon: {
    median: 0.42,
    low: 0.31,
    high: 0.58,
    noiseLow: 0.39,
    noiseHigh: 0.45,
    scaleMin: 0.2,
    scaleMax: 0.7,
  },
  transferred: {
    medianKb: 1258,
    madKb: 6,
    noiseKb: 7,
    budgetKb: 1300,
    scaleMin: 1000,
    scaleMax: 1500,
  },
  thirdParty: {
    sharePct: 38,
    commitCeilingPct: 30,
    bandLow: 36,
    bandHigh: 40,
    scaleMin: 0,
    scaleMax: 50,
  },
  domNodes: {
    median: 2140,
    mad: 78,
    bandLow: 2062,
    bandHigh: 2218,
    noiseLow: 2040,
    noiseHigh: 2240,
    scaleMin: 1800,
    scaleMax: 2500,
    runsVaried: 3,
    runsTotal: 5,
  },
  trend: {
    journey: "demande d'acte",
    budgetKb: 1300,
    startLabel: '17 JUL',
    endLabel: '15 AUG',
    gridValues: [1250, 1350, 1450],
    // 14 samples, medians in kb with run dispersion envelope.
    points: [
      { median: 1242, low: 1218, high: 1266 },
      { median: 1238, low: 1212, high: 1264 },
      { median: 1251, low: 1226, high: 1276 },
      { median: 1247, low: 1222, high: 1272 },
      { median: 1244, low: 1219, high: 1269 },
      { median: 1258, low: 1233, high: 1283 },
      { median: 1262, low: 1237, high: 1287 },
      { median: 1255, low: 1230, high: 1280 },
      { median: 1249, low: 1224, high: 1274 },
      { median: 1421, low: 1394, high: 1448 },
      { median: 1418, low: 1391, high: 1445 },
      { median: 1424, low: 1397, high: 1451 },
      { median: 1263, low: 1238, high: 1288 },
      { median: 1258, low: 1233, high: 1283 },
    ],
    deploys: [
      { index: 3, label: '#398', kind: 'normal' as const },
      { index: 6, label: '#405', kind: 'normal' as const },
      { index: 9, label: '#412', kind: 'regression' as const },
      { index: 12, label: '#417', kind: 'no-sig' as const },
    ],
  },
  regression: {
    route: '/demarches/acte-naissance',
    gainedKb: 184,
    detail: ['160 KB is ', 'date-fns', ' locale data introduced by ', 'PR #412', ' · c. bellanger'],
  },
  completeness: {
    automated: { done: 31, total: 31 },
    assisted: { done: 18, total: 24 },
    declarative: { done: 9, total: 23 },
    pendingDeclarative: 14,
  },
  deadline: {
    date: '30 SEP 2026',
    contract: '2026-SL-0417',
    days: 45,
  },
} as const;

// ---- run detail ----

export type WaterfallKind = 'first-party' | 'app' | 'regression' | 'third-party';

export const runDetailFixture = {
  id: '#4812',
  timestamp: '15 Aug 2026 14:02:41 UTC',
  route: '/demarches/acte-naissance',
  profile: 'mobile-4g',
  requests: 84,
  totalKb: 1298,
  waterfall: [
    { name: 'document', kb: 42, start: 0, kind: 'first-party' },
    { name: 'app.a91f.js', kb: 412, start: 0.08, kind: 'app' },
    { name: 'vendor-dates.c40e.js', kb: 184, start: 0.13, kind: 'regression' },
    { name: 'marianne-bold.woff2', kb: 68, start: 0.11, kind: 'first-party' },
    { name: 'hero-mairie.jpg', kb: 224, start: 0.18, kind: 'first-party' },
    { name: 'tarteaucitron.js', kb: 96, start: 0.32, kind: 'third-party' },
    { name: 'matomo.js', kb: 72, start: 0.36, kind: 'third-party' },
    { name: 'player.dailymotion', kb: 198, start: 0.42, kind: 'third-party' },
  ] as ReadonlyArray<{ name: string; kb: number; start: number; kind: WaterfallKind }>,
  moreCount: 76,
  moreKb: 2,
  models: [
    { name: 'EcoIndex', value: 0.31, low: 0.28, high: 0.35, isReference: false },
    { name: 'SWD v4', value: 0.42, low: 0.36, high: 0.49, isReference: true },
    { name: 'ADEME BE', value: 0.37, low: 0.33, high: 0.42, isReference: false },
    { name: '1byte', value: 0.58, low: 0.52, high: 0.63, isReference: false },
  ],
  modelScale: { min: 0.2, max: 0.7 },
  dispersion: {
    baselineRuns: [1104, 1110, 1114, 1118, 1123],
    candidateRuns: [1289, 1294, 1298, 1303, 1307],
    baselineMedian: 1114,
    candidateMedian: 1298,
    mad: 9,
    noiseKb: 7,
    deltaKb: 184,
    noiseRatio: 26,
    scaleMin: 1080,
    scaleMax: 1330,
  },
  fingerprint: [
    { key: 'chromium', value: '127.0.6533.88' },
    { key: 'image', value: 'sha256:4e91c2a7…' },
    { key: 'throttle', value: 'mobile-4g (1.6 Mbps / 4× CPU)' },
    { key: 'region', value: 'eu-west-par' },
    { key: 'models', value: 'ecoindex@3.1 swd@4.0 ademe@2024 1byte@2021' },
    { key: 'ledger', value: '9f4c8e21…c7', link: true },
  ] as ReadonlyArray<{ key: string; value: string; link?: boolean }>,
} as const;

// ---- comparison ----

function agg(metricId: MetricId, unit: Unit, median: number, mad: number): AggregatedMetric {
  return { metricId, unit, median, mad, min: median - 2 * mad, max: median + 2 * mad, sampleCount: 5 };
}

function establishedFloor(metricId: MetricId, unit: Unit, value: number): NoiseFloor {
  return { status: 'established', metricId, unit, value, sampleCount: 30, scalingFactor: 1.2 };
}

export interface ComparisonRow {
  label: string;
  /** display formatting family; raw values stay raw (invariant 6). */
  kind: 'kb' | 'ms' | 'count' | 'g';
  lowConfidence?: boolean;
  before: AggregatedMetric;
  after: AggregatedMetric;
  floor: NoiseFloor;
  /** an absolute budget or contractual threshold is exceeded. */
  overThreshold: boolean;
}

export const comparisonFixture = {
  baseline: { run: '#4790', date: '09 Aug 03:00', branch: 'main' },
  candidate: { run: '#4812', date: '15 Aug 14:02', branch: 'pr/412' },
  rows: [
    {
      label: 'Transferred bytes',
      kind: 'kb',
      before: agg('transferred_bytes', 'bytes', 1_114_000, 6_000),
      after: agg('transferred_bytes', 'bytes', 1_298_000, 9_000),
      floor: establishedFloor('transferred_bytes', 'bytes', 7_000),
      overThreshold: true,
    },
    {
      label: 'Requests',
      kind: 'count',
      before: agg('request_count', 'count', 82, 1),
      after: agg('request_count', 'count', 84, 1),
      floor: establishedFloor('request_count', 'count', 2),
      overThreshold: false,
    },
    {
      label: 'JS execution time',
      kind: 'ms',
      before: agg('js_execution_ms', 'ms', 548, 12),
      after: agg('js_execution_ms', 'ms', 612, 15),
      floor: establishedFloor('js_execution_ms', 'ms', 30),
      overThreshold: false,
    },
    {
      label: 'DOM nodes',
      kind: 'count',
      lowConfidence: true,
      before: agg('dom_node_count', 'count', 2_118, 78),
      after: agg('dom_node_count', 'count', 2_140, 82),
      floor: establishedFloor('dom_node_count', 'count', 90),
      overThreshold: false,
    },
  ] as readonly ComparisonRow[],
  // estimates are not kernel metrics; the carbon row inherits significance
  // from the transferred-bytes delta that drives it and is precomputed here.
  carbonRow: {
    label: 'Carbon / visit (SWD v4)',
    before: 0.98,
    after: 1.14,
    delta: 0.16,
    floorG: 0.02,
    madG: 0.02,
    verdict: 'breach' as const,
  },
  attribution: {
    // the attribution engine emits plain language (operating manual section
    // 12); the sentence is engine output, so it lives here as data.
    leadParts: [
      { text: '/demarches/acte-naissance', mono: true },
      { text: ' gained ' },
      { text: '184 KB', strong: true },
      { text: '. ' },
      { text: '160 KB', strong: true },
      { text: ' is ' },
      { text: 'date-fns', mono: true },
      { text: ' locale data introduced by ' },
      { text: 'PR #412', mono: true },
      { text: '.' },
    ] as ReadonlyArray<{ text: string; mono?: boolean; strong?: boolean }>,
    table: [
      { key: 'bundle', value: 'vendor-dates.c40e.js', note: '+184 KB', tone: 'breach' },
      { key: 'module', value: 'date-fns/locale/*', note: '+160 KB', tone: 'breach' },
      { key: 'file', value: 'src/lib/dates.ts:14', note: 'import *', tone: 'muted' },
      { key: 'commit', value: 'a7f2c91 · c. bellanger', note: '12 Aug', tone: 'muted' },
      { key: 'remainder', value: 'tree-shake overhead', note: '+24 KB', tone: 'muted' },
    ] as ReadonlyArray<{ key: string; value: string; note: string; tone: 'breach' | 'muted' }>,
    fix: 'import the two locales in use (fr, br) rather than the locale index. Estimated recovery 158 KB.',
  },
  thirdParty: {
    rows: [
      { origin: 'geo.api.gouv.fr', status: 'unchanged', kb: 12 },
      { origin: 'matomo.selo.fr', status: 'unchanged', kb: 72 },
      { origin: 'player.dailymotion.com', status: 'new', kb: 198 },
      { origin: 'tarteaucitron.io', status: 'unchanged', kb: 96 },
    ] as ReadonlyArray<{ origin: string; status: 'unchanged' | 'new'; kb: number }>,
    noSourceMapOrigin: 'player.dailymotion',
  },
} as const;

// ---- budgets ----

export type BudgetTone = 'ok' | 'warn' | 'breach';

export interface BudgetRow {
  scope: string;
  metric: string;
  current: string;
  currentTone: BudgetTone;
  threshold: string;
  // bar fill percentage; absent for relative rules that have no gauge
  barPct?: number;
  barTone?: BudgetTone;
  headroom?: string;
  // a note replaces the bar for relative rules
  note?: boolean;
  action: 'fail' | 'warn';
  rowTone?: 'breach';
}

export interface YamlSeg {
  text: string;
  // v = value, c = comment; plain otherwise
  k?: 'v' | 'c';
}

export const budgetsFixture = {
  file: 'balise.yml',
  branch: 'main',
  rows: [
    {
      scope: '/accueil',
      metric: 'bytes',
      current: '842 KB',
      currentTone: 'ok',
      threshold: '900 KB',
      barPct: 93.6,
      barTone: 'ok',
      headroom: '6%',
      action: 'fail',
    },
    {
      scope: '/demarches/*',
      metric: 'bytes',
      current: `${formatInt(1298)} KB`,
      currentTone: 'breach',
      threshold: `${formatInt(1300)} KB`,
      barPct: 99.8,
      barTone: 'breach',
      headroom: '2 KB',
      action: 'fail',
      rowTone: 'breach',
    },
    {
      scope: "journey: demande d'acte",
      metric: 'bytes',
      current: `${formatInt(1258)} KB`,
      currentTone: 'ok',
      threshold: `${formatInt(1400)} KB`,
      barPct: 89.9,
      barTone: 'ok',
      headroom: '10%',
      action: 'warn',
    },
    {
      scope: 'service',
      metric: 'third-party share',
      current: '38%',
      currentTone: 'breach',
      threshold: '30%',
      barPct: 100,
      barTone: 'breach',
      headroom: '-8 pt',
      action: 'fail',
    },
    {
      scope: 'any route',
      metric: 'Δ vs baseline',
      current: '–',
      currentTone: 'ok',
      threshold: '+3% rel.',
      note: true,
      action: 'warn',
    },
  ] as readonly BudgetRow[],
  yaml: [
    [{ text: '# balise.yml · sevre-et-loire.fr · pack rgesn-2024-v2', k: 'c' }],
    [{ text: 'version: ' }, { text: '1', k: 'v' }],
    [{ text: 'service: ' }, { text: 'portail-metropolitain', k: 'v' }],
    [{ text: 'runs: ' }, { text: '5', k: 'v' }],
    [
      { text: 'profiles: [' },
      { text: 'desktop-fibre', k: 'v' },
      { text: ', ' },
      { text: 'mobile-4g', k: 'v' },
      { text: ']' },
    ],
    [{ text: 'reference_model: ' }, { text: 'swd@4.0', k: 'v' }],
    [{ text: '# deltas below the computed noise floor are never failures', k: 'c' }],
    [{ text: 'noise_floor: ' }, { text: 'auto', k: 'v' }],
    [{ text: '' }],
    [{ text: 'budgets:' }],
    [{ text: '  - scope: ' }, { text: '/accueil', k: 'v' }],
    [
      { text: '    bytes: { warn: ' },
      { text: '860KB', k: 'v' },
      { text: ', fail: ' },
      { text: '900KB', k: 'v' },
      { text: ' }' },
    ],
    [{ text: '  - scope: ' }, { text: '/demarches/*', k: 'v' }],
    [
      { text: '    bytes: { warn: ' },
      { text: '1250KB', k: 'v' },
      { text: ', fail: ' },
      { text: '1300KB', k: 'v' },
      { text: ' }' },
    ],
    [{ text: '    requests: { fail: ' }, { text: '90', k: 'v' }, { text: ' }' }],
    [{ text: '  - scope: ' }, { text: 'journey:demande-acte', k: 'v' }],
    [{ text: '    bytes: { fail: ' }, { text: '1400KB', k: 'v' }, { text: ' }' }],
    [{ text: '  - scope: ' }, { text: 'service', k: 'v' }],
    [{ text: '    third_party_share: { fail: ' }, { text: '30%', k: 'v' }, { text: ' }' }],
    [{ text: '    relative_to_baseline: { warn: ' }, { text: '+3%', k: 'v' }, { text: ' }' }],
    [{ text: '' }],
    [{ text: 'check:' }],
    [{ text: '  block_merge_on: ' }, { text: 'fail', k: 'v' }],
    [{ text: '  annotate_files: ' }, { text: 'true', k: 'v' }],
  ] as ReadonlyArray<readonly YamlSeg[]>,
  rebaselines: [
    { date: '03 AUG', move: 'main → #4790', author: 'c. bellanger', reason: '"post-refonte"' },
    { date: '11 JUL', move: 'main → #4612', author: 'm. carbonne', reason: '"new hosting"' },
  ],
  override: {
    pr: 'PR #401',
    summary: '340 KB video hero on',
    route: '/actualites',
    quote: '"Mandated by comms for the 14 July campaign, removal scheduled 01 Sep."',
    by: 'm. carbonne, 08 Jul',
  },
} as const;

// ---- pull request check ----

export type PrVerdict = 'fail' | 'warn' | 'noSig';

export interface PrCheckRow {
  route: string;
  baseKb: number;
  headKb: number;
  deltaKb: number;
  floorKb: number;
  madKb: number;
  verdict: PrVerdict;
}

export const prCheckFixture = {
  title: 'Ajoute le formatage des dates localisé',
  number: '#412',
  author: 'c-bellanger',
  commits: 3,
  into: 'main',
  from: 'feat/dates-locale',
  requiredCheck: 'balise/budget',
  statuses: [
    { name: 'balise / budget', state: 'fail', text: '1 route over budget, 1 real regression' },
    { name: 'balise / criteria', state: 'pass', text: 'no RGESN criterion regressed' },
    { name: 'ci / test', state: 'pass', text: '248 passed' },
  ] as ReadonlyArray<{ name: string; state: 'fail' | 'pass'; text: string }>,
  commentedMinutesAgo: 22,
  runsPerScenario: 5,
  rows: [
    { route: '/demarches/acte-naissance', baseKb: 1114, headKb: 1298, deltaKb: 184, floorKb: 7, madKb: 9, verdict: 'fail' },
    { route: '/accueil', baseKb: 840, headKb: 842, deltaKb: 2, floorKb: 7, madKb: 3, verdict: 'noSig' },
    { route: "journey: demande d'acte", baseKb: 1258, headKb: 1442, deltaKb: 184, floorKb: 7, madKb: 9, verdict: 'warn' },
  ] as readonly PrCheckRow[],
  // attribution and fix sentences are engine output, kept as data
  attributionParts: [
    { text: '/demarches/acte-naissance', mono: true },
    { text: ' gained ' },
    { text: '184 KB', strong: true },
    { text: '. ' },
    { text: '160 KB', strong: true },
    { text: ' is ' },
    { text: 'date-fns', mono: true },
    { text: ' locale data introduced by this PR in ' },
    { text: 'src/lib/dates.ts', mono: true },
    { text: '. The remaining 24 KB is bundler overhead.' },
  ] as ReadonlyArray<{ text: string; mono?: boolean; strong?: boolean }>,
  fixParts: [
    { text: 'import ' },
    { text: 'date-fns/locale/fr', mono: true },
    { text: ' and ' },
    { text: '/br', mono: true },
    { text: ' directly instead of the locale index. Estimated recovery 158 KB, which brings the route to ' },
    { text: `${formatInt(1140)} KB`, strong: true },
    { text: ', under budget.' },
  ] as ReadonlyArray<{ text: string; mono?: boolean; strong?: boolean }>,
  provenance: {
    methodology: 'v1.2',
    models: 'ecoindex@3.1 swd@4.0 ademe@2024',
    run: '#4812',
    ledger: '9f4c8e21',
  },
  annotation: {
    file: 'src/lib/dates.ts',
    lines: [
      { no: 12, text: "import { format } from 'date-fns'", added: false },
      { no: 14, text: "+ import * as locales from 'date-fns/locale'", added: true },
      { no: 15, text: "const fmt = (d, l) => format(d, 'PPP', { locale: locales[l] })", added: false },
    ] as ReadonlyArray<{ no: number; text: string; added: boolean }>,
    costKb: 160,
    note: 'Namespace import pulls all 96 locales into the route bundle. Two are used at runtime.',
  },
} as const;
