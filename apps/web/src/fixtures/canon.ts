import type { AggregatedMetric, MetricId, NoiseFloor, Unit } from '@balise/schemas';

// The scenario canon: one internally consistent fictional dataset, from the
// design handoff. None of it is measured. It exists so every screen tells the
// same story until the runner (V1) and the API (V2) replace it with real data.
// Keep the cross-screen arithmetic consistent; the design brief in testing/
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
    // 14 samples, medians in KB with run dispersion envelope.
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

// ---- Run detail ----

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

// ---- Comparison ----

function agg(metricId: MetricId, unit: Unit, median: number, mad: number): AggregatedMetric {
  return { metricId, unit, median, mad, min: median - 2 * mad, max: median + 2 * mad, sampleCount: 5 };
}

function establishedFloor(metricId: MetricId, unit: Unit, value: number): NoiseFloor {
  return { status: 'established', metricId, unit, value, sampleCount: 30, scalingFactor: 1.2 };
}

export interface ComparisonRow {
  label: string;
  /** Display formatting family; raw values stay raw (invariant 6). */
  kind: 'kb' | 'ms' | 'count' | 'g';
  lowConfidence?: boolean;
  before: AggregatedMetric;
  after: AggregatedMetric;
  floor: NoiseFloor;
  /** An absolute budget or contractual threshold is exceeded. */
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
  // Estimates are not kernel metrics; the carbon row inherits significance
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
    // The attribution engine emits plain language (operating manual section
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
