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
    // classification is the kernel's vocabulary, not a drawing instruction:
    // the trend component draws breach only for 'regression'. the two
    // unclassified deploys had no delta measured against them.
    deploys: [
      { index: 3, label: '#398' },
      { index: 6, label: '#405' },
      { index: 9, label: '#412', classification: 'regression' as const },
      { index: 12, label: '#417', classification: 'no-significant-change' as const },
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

export type ResourceType = 'document' | 'script' | 'stylesheet' | 'image' | 'font' | 'media' | 'other';

export interface ResourceRecord {
  name: string;
  type: ResourceType;
  transferredKb: number;
  /** bytes after decompression. coverage is measured against this. */
  decodedKb: number;
  /** decoded bytes never executed, from the coverage capture. js and css only. */
  unusedDecodedKb?: number;
  /** absent for first-party resources. */
  origin?: string;
  /** the resource this run's regression was attributed to. */
  regression?: boolean;
}

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
  // the resource inventory behind the waterfall. same capture, same totals:
  // eight records plus the tail add to 84 requests and 1 298 KB. coverage is
  // measured on decoded bytes, so unusedDecodedKb is never a transferred
  // saving; the two are kept in separate columns for that reason.
  resources: [
    { name: 'document', type: 'document', transferredKb: 42, decodedKb: 210 },
    { name: 'app.a91f.js', type: 'script', transferredKb: 412, decodedKb: 1180, unusedDecodedKb: 402 },
    {
      name: 'vendor-dates.c40e.js',
      type: 'script',
      transferredKb: 184,
      decodedKb: 604,
      unusedDecodedKb: 574,
      regression: true,
    },
    { name: 'marianne-bold.woff2', type: 'font', transferredKb: 68, decodedKb: 68 },
    { name: 'hero-mairie.jpg', type: 'image', transferredKb: 224, decodedKb: 224 },
    {
      name: 'tarteaucitron.js',
      type: 'script',
      transferredKb: 96,
      decodedKb: 288,
      unusedDecodedKb: 121,
      origin: 'tarteaucitron.io',
    },
    {
      name: 'matomo.js',
      type: 'script',
      transferredKb: 72,
      decodedKb: 214,
      unusedDecodedKb: 96,
      origin: 'matomo.selo.fr',
    },
    { name: 'player.dailymotion', type: 'media', transferredKb: 198, decodedKb: 198, origin: 'player.dailymotion.com' },
  ] as readonly ResourceRecord[],
  // the tail the waterfall shows as "+ 76 more". we hold no per-resource
  // record for it here, so it is carried as one group rather than invented
  // row by row.
  remainder: { requests: 76, transferredKb: 2 },
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
    scaleMin: 1080,
    scaleMax: 1330,
    // kernel inputs. the verdict on this card is computed through
    // classifyDelta, never asserted here; the delta and the noise ratio are
    // derived from these at the call site.
    before: agg('transferred_bytes', 'bytes', 1_114_000, 9_000),
    after: agg('transferred_bytes', 'bytes', 1_298_000, 9_000),
    floor: establishedFloor('transferred_bytes', 'bytes', 7_000),
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

// ---- criteria workspace ----

export type CriterionTier = 'AUTO' | 'ASSIST' | 'DECL';
export type CriterionStatus =
  | 'conforme'
  | 'partiellement'
  | 'nonConforme'
  | 'nonEvalue'
  | 'nonApplicable';

export interface CriterionRow {
  id: string;
  family: string;
  title: string;
  tier: CriterionTier;
  status: CriterionStatus;
  evidence: string;
  who: string;
}

export const criteriaFixture = {
  pack: 'rgesn-2024-v2',
  criteriaCount: 78,
  familiesCount: 9,
  // counts agree with canon.completeness: 41 conforme out of 70 applicable
  summary: { conforme: 41, partiel: 14, nonConforme: 9, na: 8, tauxDone: 41, tauxTotal: 70, tauxPct: 59 },
  tierCounts: { all: 78, automated: 31, assisted: 24, declarative: 23 },
  // criterion statements are questions from the referential; evidence lines
  // are engine or reviewer output, kept as data like the attribution parts
  rows: [
    { id: '3.1', family: 'Architecture', title: 'Le nombre de requêtes est-il limité au nécessaire ?', tier: 'AUTO', status: 'conforme', evidence: 'run #4812 · 84 requêtes', who: 'auto · 15 Aug' },
    { id: '5.2', family: 'Contenus', title: 'Les images sont-elles compressées et dimensionnées ?', tier: 'AUTO', status: 'partiellement', evidence: '6 des 41 images non optimisées', who: 'auto · 15 Aug' },
    { id: '5.7', family: 'Contenus', title: 'La lecture des vidéos est-elle manuelle ?', tier: 'AUTO', status: 'nonConforme', evidence: 'player.dailymotion · autoplay', who: 'auto · 15 Aug' },
    { id: '6.2', family: 'Frontend', title: 'Le poids des ressources est-il maîtrisé ?', tier: 'AUTO', status: 'nonConforme', evidence: 'budget dépassé sur 2 routes', who: 'auto · 15 Aug' },
    { id: '8.5', family: 'Hébergement', title: "L'électricité est-elle d'origine renouvelable ?", tier: 'AUTO', status: 'conforme', evidence: 'Green Web Foundation · 15/08', who: 'auto · 15 Aug' },
    { id: '2.4', family: 'Spécifications', title: 'Les fonctionnalités sont-elles hiérarchisées par utilité ?', tier: 'ASSIST', status: 'partiellement', evidence: 'analyse Matomo · 3 pages orphelines', who: 'c. bellanger' },
    { id: '4.3', family: 'UX / UI', title: 'Les animations non essentielles sont-elles évitées ?', tier: 'ASSIST', status: 'nonConforme', evidence: '3 carrousels autoplay détectés', who: 'c. bellanger' },
    { id: '4.8', family: 'UX / UI', title: 'Le service est-il utilisable sur du matériel ancien ?', tier: 'ASSIST', status: 'partiellement', evidence: 'mobile-3g · LCP 6,2 s', who: 'c. bellanger' },
    { id: '6.9', family: 'Frontend', title: 'Les parcours essentiels fonctionnent-ils sans JavaScript ?', tier: 'ASSIST', status: 'nonConforme', evidence: 'parcours démarche inopérant', who: 'c. bellanger' },
    { id: '8.1', family: 'Hébergement', title: "L'hébergeur publie-t-il des indicateurs environnementaux ?", tier: 'ASSIST', status: 'conforme', evidence: 'Scaleway · PUE 1,16 · attestation', who: 'm. carbonne' },
    { id: '1.2', family: 'Stratégie', title: 'Une revue annuelle du service est-elle planifiée ?', tier: 'DECL', status: 'conforme', evidence: 'PV de revue 2026.pdf', who: 'm. carbonne' },
    { id: '2.1', family: 'Spécifications', title: 'Une revue des besoins a-t-elle limité les fonctionnalités ?', tier: 'DECL', status: 'nonApplicable', evidence: 'hors périmètre du marché', who: 'm. carbonne' },
    { id: '7.4', family: 'Backend', title: 'Les données sont-elles mises en cache côté serveur ?', tier: 'DECL', status: 'nonEvalue', evidence: 'artefact requis · non assigné', who: '–' },
    { id: '9.2', family: 'Algorithmie', title: 'Les traitements lourds sont-ils déclenchés à la demande ?', tier: 'DECL', status: 'nonEvalue', evidence: 'artefact requis · non assigné', who: '–' },
  ] as readonly CriterionRow[],
} as const;

// ---- declaration editor ----

export interface DeclarationBlocking {
  parts: ReadonlyArray<{ text: string; mono?: boolean }>;
  note: string;
}

export const declarationFixture = {
  draft: 'v3',
  published: 'v2',
  publishedDate: '12 Mar 2026',
  reviewDate: '12 Mar 2027',
  // blocking findings are engine output, kept as data
  blocking: [
    {
      parts: [{ text: '4.3', mono: true }, { text: ' non conforme with no justification text' }],
      note: 'Required by the official grid.',
    },
    {
      parts: [
        { text: '7.4', mono: true },
        { text: ', ' },
        { text: '9.2', mono: true },
        { text: ' unassessed declarative criteria' },
      ],
      note: 'Need a named responsible person and an artifact.',
    },
    {
      parts: [{ text: 'Hosting attestation older than 12 months' }],
      note: 'Uploaded 22 Jul 2025. Re-request from Scaleway.',
    },
  ] as readonly DeclarationBlocking[],
  // the known-gaps text is customer-authored content, not template copy
  knownGapsText:
    "Le lecteur vidéo tiers utilisé sur la rubrique actualités déclenche une lecture automatique et n'est pas conforme au critère 5.7. Son remplacement est planifié pour le 1er septembre 2026. Trois carrousels animés subsistent en page d'accueil (critère 4.3).",
  versions: [
    { tag: 'v3', draft: true, date: '15 Aug', conforme: 41 },
    { tag: 'v2', draft: false, date: '12 Mar', conforme: 34, ledger: '3a91…' },
    { tag: 'v1', draft: false, date: '04 Mar', conforme: 28, ledger: '1c07…' },
  ] as ReadonlyArray<{ tag: string; draft: boolean; date: string; conforme: number; ledger?: string }>,
  preview: {
    url: 'sevre-et-loire.fr/ecoconception',
    orgEyebrow: 'MÉTROPOLE DE SÈVRE-ET-LOIRE',
    establishedDate: '15 août 2026',
    referential: 'RGESN version 2 (2024)',
    host: 'Scaleway, Paris (DC5)',
    verifiedDate: '15 août 2026',
    methodologyVersion: 'v1.2',
    verifyUrl: 'balise.fr/v/9f4c8e21',
    badgeDate: '15.08.26',
    // per-family conformity: segment widths in percent, count label verbatim
    families: [
      { name: '1 Stratégie', ok: 57, warn: 14, bad: 15, label: '4/6' },
      { name: '2 Spécifications', ok: 50, warn: 33, bad: 0, label: '3/6' },
      { name: '3 Architecture', ok: 71, warn: 14, bad: 0, label: '5/7' },
      { name: '4 UX / UI', ok: 50, warn: 25, bad: 17, label: '6/12' },
      { name: '5 Contenus', ok: 55, warn: 18, bad: 18, label: '6/11' },
      { name: '6 Frontend', ok: 62, warn: 15, bad: 15, label: '8/13' },
      { name: '7 Backend', ok: 57, warn: 14, bad: 0, label: '4/7' },
      { name: '8 Hébergement', ok: 88, warn: 0, bad: 0, label: '7/8' },
      { name: '9 Algorithmie', ok: 33, warn: 17, bad: 17, label: '2/6' },
    ] as ReadonlyArray<{ name: string; ok: number; warn: number; bad: number; label: string }>,
  },
} as const;

// ---- tender workspace ----

export type CommitmentMargin =
  | { kind: 'headroom'; pct: number }
  | { kind: 'stretch'; points: number }
  | { kind: 'notMet' }
  | { kind: 'process' };

export interface CommitmentRow {
  checked: boolean;
  // commitment wording appears verbatim in the annex; french legal register
  label: string;
  measured: string;
  measuredTone?: 'breach';
  proposed: string;
  margin: CommitmentMargin;
}

export const tenderFixture = {
  ref: 'AO-2026-SL-0417',
  title: 'Refonte du portail métropolitain',
  deadline: { date: '12 SEP 2026 · 12:00', days: 28, platform: 'PLACE' },
  currentStep: 2,
  commitments: [
    {
      checked: true,
      label: 'Poids médian des 10 pages principales',
      measured: `${formatInt(1258)} KB`,
      proposed: `≤ ${formatInt(1400)} KB`,
      margin: { kind: 'headroom', pct: 11 },
    },
    {
      checked: true,
      label: 'Empreinte estimée par visite (SWD v4)',
      measured: '0.42 g',
      proposed: '≤ 0.55 g',
      margin: { kind: 'headroom', pct: 24 },
    },
    {
      checked: true,
      label: 'Taux de conformité RGESN à 12 mois',
      measured: '59%',
      proposed: '≥ 75%',
      margin: { kind: 'stretch', points: 16 },
    },
    {
      checked: false,
      label: 'Part des tiers dans les octets transférés',
      measured: '38%',
      measuredTone: 'breach',
      proposed: '≤ 30%',
      margin: { kind: 'notMet' },
    },
    {
      checked: true,
      label: "Rapport d'exécution trimestriel horodaté",
      measured: '–',
      proposed: '4 / an',
      margin: { kind: 'process' },
    },
  ] as readonly CommitmentRow[],
  warningPoints: 8,
  history: {
    since: '03 Mar 2026',
    days: 165,
    runs: 4812,
    declarationVersions: 3,
    rateFrom: 28,
    rateTo: 59,
    // conformity sparkline, y values on a 46-high viewbox, from the handoff
    points: '4,34 22,33 40,30 58,31 76,28 94,29 112,25 130,26 148,22 166,20 184,21 202,16 220,14 240,12',
  },
  output: {
    branding: 'Atelier Sextant · sans marque Balise',
    // the white-label method sentence, printed on the annex cover
    methodLine:
      'Mesures produites selon la méthodologie Balise v1.2, publiée et versionnée. Atelier Sextant est seul signataire du présent mémoire.',
    pages: 9,
    figureCount: 6,
    verifyUrl: 'balise.fr/v/9f4c8e21',
  },
} as const;

// ---- contract tracker ----

export type ContractStatus = 'tenu' | 'atRisk' | 'aJour';

export interface ContractRow {
  label: string;
  seuil: string;
  actuel: string;
  actuelTone?: 'caution';
  // gauge rows have a bar; the quarterly row shows delivery squares instead
  headroom?: { barPct: number; tone: 'ok' | 'caution'; labelPct?: number; ptToGo?: number };
  quarters?: { text: string; delivered: number; total: number };
  trendPoints: string;
  trendTone: 'neutral' | 'caution';
  status: ContractStatus;
  rowTint?: 'caution';
}

export const contractFixture = {
  ref: '2026-SL-0417',
  notified: '02 Apr 2026',
  months: 36,
  article: '8.4',
  quarter: 'Q3',
  rows: [
    {
      label: 'Poids médian des 10 pages principales',
      seuil: formatInt(1400),
      actuel: formatInt(1258),
      headroom: { barPct: 90, tone: 'ok', labelPct: 10 },
      trendPoints: '2,12 16,11 30,13 44,10 58,4 72,5 86,11 108,12',
      trendTone: 'neutral',
      status: 'tenu',
    },
    {
      label: 'Empreinte estimée par visite (SWD v4)',
      seuil: '0.55',
      actuel: '0.42',
      headroom: { barPct: 76, tone: 'ok', labelPct: 24 },
      trendPoints: '2,8 16,9 30,7 44,10 58,11 72,12 86,13 108,13',
      trendTone: 'neutral',
      status: 'tenu',
    },
    {
      label: 'Taux de conformité RGESN à 12 mois',
      seuil: '75%',
      actuel: '59%',
      actuelTone: 'caution',
      headroom: { barPct: 79, tone: 'caution', ptToGo: 16 },
      trendPoints: '2,15 16,14 30,13 44,12 58,11 72,11 86,10 108,10',
      trendTone: 'caution',
      status: 'atRisk',
      rowTint: 'caution',
    },
    {
      label: "Rapport d'exécution trimestriel horodaté",
      seuil: '4/an',
      actuel: '2/2',
      quarters: { text: 'Q1 ✓ 31 Mar · Q2 ✓ 30 Jun', delivered: 2, total: 4 },
      trendPoints: '',
      trendTone: 'neutral',
      status: 'aJour',
    },
  ] as readonly ContractRow[],
  // the early warning is engine analysis, kept as data
  earlyWarningParts: [
    { text: 'Conformity is rising at ' },
    { text: '1.9 pt/month', mono: true },
    { text: '. At that rate you reach ' },
    { text: '70%', mono: true },
    { text: ' by the 12-month review, not 75%.' },
  ] as ReadonlyArray<{ text: string; mono?: boolean }>,
  earlyWarningDetail:
    'The 14 unassessed declarative criteria are the whole gap. Assigning them closes 11 points without touching the code.',
  unassessedCount: 14,
  calendar: [
    { date: '30 SEP 26', label: "Rapport d'exécution Q3", days: 45, urgent: true },
    { date: '31 DEC 26', label: "Rapport d'exécution Q4", days: 137 },
    { date: '12 MAR 27', label: 'Revue annuelle · déclaration', days: 208 },
    { date: '02 APR 27', label: 'Revue contractuelle 12 mois', days: 229 },
    { date: '02 APR 29', label: 'Fin du marché · reconduction', days: null },
  ] as ReadonlyArray<{ date: string; label: string; days: number | null; urgent?: boolean }>,
} as const;

// ---- fleet ----

export interface FleetRow {
  domain: string;
  // carbon per visit on the shared 0 to 1.6 gco2e scale
  band: {
    median: number;
    low: number;
    high: number;
    noiseLow: number;
    noiseHigh: number;
    state: 'normal' | 'breach';
    confidence: 'high' | 'low';
  };
  conf: 'high' | 'low';
  rgesnPct: number;
  declaration: { text: string; tone: 'ok' | 'muted' | 'caution' | 'breach' };
  contract: string;
  alert: { text: string; tone: 'none' | 'caution' | 'breach' };
}

export const fleetFixture = {
  services: 6,
  activeContracts: 2,
  openTenders: 1,
  summary: { breaches: 3, staleDeclarations: 2, deadlines30d: 1 },
  scale: { min: 0, max: 1.6 },
  rows: [
    {
      domain: 'sevre-et-loire.fr',
      band: { median: 0.42, low: 0.31, high: 0.58, noiseLow: 0.39, noiseHigh: 0.45, state: 'normal', confidence: 'high' },
      conf: 'high',
      rgesnPct: 59,
      declaration: { text: 'v2 · 156 d', tone: 'muted' },
      contract: '0417 · Q3 due',
      alert: { text: 'budget breach', tone: 'breach' },
    },
    {
      domain: 'transports-selo.fr',
      band: { median: 0.86, low: 0.6, high: 1.35, noiseLow: 0.78, noiseHigh: 0.95, state: 'breach', confidence: 'high' },
      conf: 'high',
      rgesnPct: 44,
      declaration: { text: 'v1 · 248 d', tone: 'caution' },
      contract: '0392 · active',
      alert: { text: 'declaration stale', tone: 'caution' },
    },
    {
      domain: 'bibliotheques-selo.fr',
      band: { median: 0.24, low: 0.1, high: 0.52, noiseLow: 0.18, noiseHigh: 0.3, state: 'normal', confidence: 'high' },
      conf: 'high',
      rgesnPct: 71,
      declaration: { text: 'none', tone: 'breach' },
      contract: '–',
      alert: { text: 'obligated · not published', tone: 'breach' },
    },
    {
      domain: 'chu-armorique.fr',
      band: { median: 1.2, low: 0.88, high: 1.53, noiseLow: 1.05, noiseHigh: 1.43, state: 'normal', confidence: 'low' },
      conf: 'low',
      rgesnPct: 38,
      declaration: { text: 'v1 · 426 d', tone: 'caution' },
      contract: '–',
      alert: { text: 'runner unstable 3 d', tone: 'caution' },
    },
    {
      domain: 'craonnais.fr',
      band: { median: 0.14, low: 0.05, high: 0.32, noiseLow: 0.1, noiseHigh: 0.2, state: 'normal', confidence: 'high' },
      conf: 'high',
      rgesnPct: 82,
      declaration: { text: 'v4 · 21 d', tone: 'ok' },
      contract: '–',
      alert: { text: 'none', tone: 'none' },
    },
    {
      domain: 'eau-selo.fr',
      band: { median: 0.58, low: 0.38, high: 0.98, noiseLow: 0.5, noiseHigh: 0.65, state: 'normal', confidence: 'high' },
      conf: 'high',
      rgesnPct: 64,
      declaration: { text: 'v2 · 88 d', tone: 'muted' },
      contract: '–',
      alert: { text: '3p share 41%', tone: 'breach' },
    },
  ] as readonly FleetRow[],
  benchmark: {
    n: 112,
    bestPct: 38,
    // histogram bar geometry on the 380 by 92 viewbox, from the handoff
    bars: [
      { x: 24, y: 46, h: 20 },
      { x: 46, y: 38, h: 28 },
      { x: 68, y: 26, h: 40 },
      { x: 90, y: 18, h: 48 },
      { x: 112, y: 24, h: 42 },
      { x: 134, y: 34, h: 32 },
      { x: 156, y: 42, h: 24 },
      { x: 178, y: 50, h: 16 },
      { x: 200, y: 54, h: 12 },
      { x: 222, y: 58, h: 8 },
      { x: 244, y: 60, h: 6 },
      { x: 266, y: 62, h: 4 },
    ],
    markerX: 99,
    markerLabel: 'sevre-et-loire · 0.42 · P38',
    medianX: 200,
    medianValue: '0.71',
    axis: ['0.2', '0.8', '1.6 gCO₂e'],
  },
  clientAccess: {
    viewers: [
      { email: 'dsi@sevre-et-loire.fr', services: 1 },
      { email: 'numerique@transports-selo.fr', services: 1 },
    ],
    pendingInvitations: 2,
  },
} as const;

// ---- the three documents, print register ----

export interface DocEventPart {
  text: string;
  mono?: boolean;
  strong?: boolean;
}

export const documentsFixture = {
  declaration: {
    url: 'sevre-et-loire.fr/ecoconception',
    version: 'v3',
    reviewDate: '12 mars 2027',
    established: '15 août 2026',
    since: '3 mars 2026',
    methodology: 'v1.2',
    stats: { taux: 59, conformes: 41, applicables: 70, partiels: 14, nonConformes: 9 },
    // justifications are customer-authored content, not template copy
    nonConformes: [
      {
        id: '4.3',
        criterion: 'Éviter les animations non essentielles',
        justification: "Trois carrousels animés en page d'accueil. Retrait au T4 2026.",
      },
      {
        id: '5.7',
        criterion: 'Lecture manuelle des contenus vidéo',
        justification: 'Lecteur tiers en lecture automatique. Remplacement au 01/09/2026.',
      },
      {
        id: '6.2',
        criterion: 'Maîtrise du poids des ressources',
        justification: 'Budget dépassé sur deux routes de démarches. Correctif en cours (PR #418).',
      },
      {
        id: '6.9',
        criterion: 'Fonctionnement sans JavaScript',
        justification: "Le parcours de demande d'acte requiert JavaScript. Refonte prévue T1 2027.",
      },
    ],
    hash: '9f4c8e21b7d3a04f…c7a1',
    verifyUrl: 'balise.fr/v/9f4c8e21',
    contact: 'ecoconception@sevre-et-loire.fr',
  },
  annexe: {
    agencyName: 'ATELIER SEXTANT',
    agencyLine: '14 rue Kervégan · 44000 Nantes · SIRET 892 411 507 00018',
    date: '15 août 2026',
    ref: 'AO-2026-SL-0417',
    coverStats: [
      { value: '165 j' },
      { value: formatInt(4812) },
      { value: '59%' },
      { value: '4' },
    ],
    // fig. 3 in value space; rendered through the print ToleranceBand so the
    // document figure and the app figure are the same component
    fig3: {
      scaleMin: 0.2,
      scaleMax: 0.7,
      median: 0.42,
      bandLow: 0.31,
      bandHigh: 0.58,
      noiseLow: 0.39,
      noiseHigh: 0.45,
    },
    indicators: [
      { label: 'Octets transférés (froid)', median: `${formatInt(1258)} KB`, mad: '6 KB', conf: 'high' },
      { label: 'Requêtes HTTP', median: '84', mad: '1', conf: 'high' },
      { label: 'Nœuds DOM', median: formatInt(2140), mad: '78', conf: 'medium' },
      { label: 'Part des tiers', median: '38%', mad: '2 pt', conf: 'high' },
    ] as ReadonlyArray<{ label: string; median: string; mad: string; conf: 'high' | 'medium' }>,
    ecartsBody:
      "La part des tiers (38%) dépasse la cible de 30% que nous nous fixons. Le lecteur vidéo de la rubrique actualités en représente 15 points. Son remplacement par une intégration à la demande est planifié au 1er septembre 2026 et figure au chapitre 5 comme engagement daté.",
    footerLine1: 'MÉTHODOLOGIE v1.2 · balise.fr/methodologie',
    footerLine2: 'RELEVÉS 03/03/2026 → 15/08/2026 · CHROMIUM 127.0.6533.88',
    hash: '9f4c8e21b7d3…c7a1',
    verifyUrl: 'balise.fr/v/9f4c8e21',
    page: 3,
    pages: 9,
  },
  rapport: {
    ref: '2026-SL-0417',
    quarterLabel: 'Q3 2026',
    quarter: 'T3 2026',
    period: '01/07 → 30/09/2026',
    article: '8.4',
    runs: 1284,
    rows: [
      {
        label: 'Poids médian des 10 pages principales',
        seuil: `${formatInt(1400)} KB`,
        t3: `${formatInt(1258)} KB`,
        gauge: { fillPct: 90, tone: 'held' },
        etat: 'tenu',
      },
      {
        label: 'Empreinte estimée par visite (SWD v4)',
        seuil: '0,55 g',
        t3: '0,42 g',
        gauge: { fillPct: 77, tone: 'held' },
        etat: 'tenu',
      },
      {
        label: 'Taux de conformité RGESN (cible 12 mois)',
        seuil: '75%',
        t3: '59%',
        gauge: { fillPct: 78, tone: 'caution' },
        etat: 'enCours',
      },
      {
        label: 'Part des tiers dans les octets transférés',
        seuil: '30%',
        t3: '38%',
        t3Tone: 'breach',
        gauge: { fillPct: 100, tone: 'breach' },
        etat: 'nonTenu',
      },
    ] as ReadonlyArray<{
      label: string;
      seuil: string;
      t3: string;
      t3Tone?: 'breach';
      gauge: { fillPct: number; tone: 'held' | 'caution' | 'breach' };
      etat: 'tenu' | 'enCours' | 'nonTenu';
    }>,
    // period events are engine and reviewer output, kept as data
    events: [
      {
        date: '15/08',
        parts: [
          { text: 'Régression de 184 KB détectée sur ' },
          { text: '/demarches/acte-naissance', mono: true },
          { text: ' (PR #412), bloquée avant fusion. Correctif attendu en T3.' },
        ],
      },
      {
        date: '08/07',
        parts: [
          { text: 'Dérogation enregistrée', strong: true },
          {
            text: ' : vidéo de 340 KB en page actualités, demandée par la direction de la communication pour la campagne du 14 juillet. Retrait planifié au 01/09/2026. Autorisée par m. carbonne.',
          },
        ],
      },
      {
        date: '03/08',
        parts: [
          { text: 'Nouvelle référence de comparaison établie sur ' },
          { text: 'main', mono: true },
          { text: ' après refonte, consignée au registre.' },
        ],
      },
    ] as ReadonlyArray<{ date: string; parts: readonly DocEventPart[] }>,
    calloutBody:
      'Le lecteur vidéo tiers représente 15 des 38 points mesurés. Son remplacement par une intégration à la demande est engagé (livraison 01/09/2026), ce qui ramènera la part attendue à 26%. La prochaine mesure trimestrielle vérifiera ce point.',
    footerLine1: `MÉTHODOLOGIE v1.2 · ${formatInt(1284)} RELEVÉS · CHROMIUM 127.0.6533.88`,
    footerLine2: `REGISTRE : ${formatInt(4812)} ENTRÉES · RACINE ANCRÉE 15/08/2026 04:00 UTC`,
    hash: 'd1e7 42ab 90c5 …3f',
    verifyUrl: 'balise.fr/v/d1e742ab',
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

// ---- public surfaces ----

export interface ScanFinding {
  amount: string;
  tone: 'breach' | 'caution';
  text: string;
}

export const scanFixture = {
  domain: 'bibliotheques-selo.fr',
  profile: 'mobile-4g',
  grade: 'B',
  score: 71,
  confidence: 'high',
  carbon: {
    median: 0.29,
    low: 0.21,
    high: 0.41,
    // one cold pass on one page: the floor is the service default, not a
    // floor computed from this scan's own history, which does not exist
    noiseLow: 0.26,
    noiseHigh: 0.32,
    noise: 0.03,
    scaleMin: 0.1,
    scaleMax: 1.6,
  },
  modelCount: 4,
  // findings are engine output, kept as data like the attribution parts
  findings: [
    {
      amount: '−214 KB',
      tone: 'breach',
      text: "Quatre images en PNG non redimensionnées sur la page d'accueil.",
    },
    {
      amount: '−96 KB',
      tone: 'breach',
      text: 'Deux familles de polices chargées, six graisses, aucune sous-classée.',
    },
    {
      amount: formatInt(1830),
      tone: 'caution',
      text: 'Nœuds DOM : le seuil EcoIndex à partir duquel la note décroche.',
    },
  ] as readonly ScanFinding[],
} as const;

export type ObservatorySector = 'epci' | 'communes' | 'etat' | 'sante' | 'transport' | 'departements';

export interface ObservatoryRow {
  rank: number;
  domain: string;
  organisme: string;
  sector: ObservatorySector;
  band: {
    median: number;
    low: number;
    high: number;
    noiseLow: number;
    noiseHigh: number;
    state: 'normal' | 'breach';
    confidence: 'high' | 'low';
  };
  grade: string;
  gradeTone?: 'caution' | 'breach';
  kb: number;
  kbTone?: 'caution' | 'breach';
  // null where 90 days of stable history do not exist; significance is the
  // noise floor rule, so a sub-floor movement is never coloured as a change
  trend: { pct: number; significant: boolean } | null;
  declaration: { text: string; tone: 'ok' | 'muted' | 'caution' | 'breach' } | null;
  agency: string | null;
  highlighted?: boolean;
}

export const observatoryFixture = {
  total: 412,
  withoutDeclaration: 287,
  measuredOn: '15 août 2026',
  profile: 'mobile-4g',
  methodology: 'v1.2',
  modelCount: 4,
  // shared scale across every row, so the bands are comparable by eye
  scale: { min: 0, max: 1.6 },
  rows: [
    {
      rank: 1,
      domain: 'craonnais.fr',
      organisme: 'Ville de Craonnais',
      sector: 'communes',
      band: { median: 0.14, low: 0.05, high: 0.32, noiseLow: 0.1, noiseHigh: 0.2, state: 'normal', confidence: 'high' },
      grade: 'A',
      kb: 318,
      trend: { pct: -14, significant: true },
      declaration: { text: 'v4 · 21 j', tone: 'ok' },
      agency: 'Sextant',
    },
    {
      rank: 2,
      domain: 'ville-de-plessac.fr',
      organisme: 'Commune de Plessac',
      sector: 'communes',
      band: { median: 0.18, low: 0.08, high: 0.34, noiseLow: 0.14, noiseHigh: 0.22, state: 'normal', confidence: 'high' },
      grade: 'A',
      kb: 402,
      trend: { pct: -2, significant: false },
      declaration: { text: 'v1 · 311 j', tone: 'caution' },
      agency: null,
    },
    {
      rank: 14,
      domain: 'sevre-et-loire.fr',
      organisme: 'Métropole de Sèvre-et-Loire',
      sector: 'epci',
      band: { median: 0.42, low: 0.31, high: 0.58, noiseLow: 0.39, noiseHigh: 0.45, state: 'normal', confidence: 'high' },
      grade: 'B',
      kb: 842,
      trend: { pct: -9, significant: true },
      declaration: { text: 'v2 · 156 j', tone: 'muted' },
      agency: 'Sextant',
      highlighted: true,
    },
    {
      rank: 96,
      domain: 'transports-selo.fr',
      organisme: 'Réseau Naïade',
      sector: 'transport',
      band: { median: 0.86, low: 0.6, high: 1.35, noiseLow: 0.78, noiseHigh: 0.95, state: 'breach', confidence: 'high' },
      grade: 'D',
      kb: 2184,
      trend: { pct: 21, significant: true },
      declaration: { text: 'v1 · 248 j', tone: 'caution' },
      agency: 'Sextant',
    },
    {
      rank: 188,
      domain: 'chu-armorique.fr',
      organisme: "CHU d'Armorique",
      sector: 'sante',
      band: { median: 1.2, low: 0.88, high: 1.53, noiseLow: 1.05, noiseHigh: 1.43, state: 'normal', confidence: 'low' },
      grade: 'E',
      gradeTone: 'caution',
      kb: 3062,
      kbTone: 'caution',
      trend: null,
      declaration: { text: 'v1 · 426 j', tone: 'caution' },
      agency: 'Sextant',
    },
    {
      rank: 371,
      domain: 'portail-arvor.fr',
      organisme: "Département d'Arvor",
      sector: 'departements',
      band: { median: 1.42, low: 1.1, high: 1.58, noiseLow: 1.32, noiseHigh: 1.52, state: 'breach', confidence: 'high' },
      grade: 'F',
      gradeTone: 'breach',
      kb: 4418,
      kbTone: 'breach',
      trend: { pct: 34, significant: true },
      declaration: null,
      agency: null,
    },
  ] as readonly ObservatoryRow[],
} as const;

export interface LedgerRecord {
  hash: string;
  shortHash: string;
  type: string;
  recordedAt: string;
  service: string;
  methodology: string;
  methodologyUrl: string;
  models: string;
  fingerprint: string;
  position: string;
  merkle: string;
  values: {
    transferredKb: string;
    madKb: string;
    requests: string;
    domNodes: string;
    carbon: string;
    model: string;
    low: string;
    high: string;
  };
}

// the entry the three documents and the pr check all point at. the record is
// the fixture stand-in for the ledger package (v5); nothing here computes a
// chain, and the screen says only what the record states.
export const ledgerFixture = {
  records: [
    {
      hash: '9f4c8e21b7d3a04f2c8819ee5b7740a3d6c1f0928bb4e5a7c7',
      shortHash: '9f4c8e21',
      type: 'run · scenario /accueil · mobile-4g',
      recordedAt: '15/08/2026 14:02:41 UTC',
      service: 'portail métropolitain · sevre-et-loire.fr',
      methodology: 'v1.2',
      methodologyUrl: 'balise.fr/methodologie',
      models: 'ecoindex@3.1 · swd@4.0 · ademe@2024 · 1byte@2021',
      fingerprint: 'chromium 127.0.6533.88 · img sha256:4e91c2a7 · eu-west-par',
      position: 'entrée 4 812 · précédente 8c02…41d9',
      merkle: 'ancrée le 15/08/2026 04:00 UTC · horodatage RFC 3161 disponible',
      values: {
        transferredKb: formatInt(1258),
        madKb: '6',
        requests: '84',
        domNodes: formatInt(2140),
        carbon: '0,42',
        model: 'SWD v4',
        low: '0,31',
        high: '0,58',
      },
    },
    {
      hash: 'd1e742ab90c5f83b16d0a4e7c2915bb8074fe3a6d95c210f3f',
      shortHash: 'd1e742ab',
      type: "report_generated · rapport d'exécution T3 2026",
      recordedAt: '15/08/2026 15:20:08 UTC',
      service: 'portail métropolitain · sevre-et-loire.fr',
      methodology: 'v1.2',
      methodologyUrl: 'balise.fr/methodologie',
      models: 'ecoindex@3.1 · swd@4.0 · ademe@2024 · 1byte@2021',
      fingerprint: 'chromium 127.0.6533.88 · img sha256:4e91c2a7 · eu-west-par',
      position: 'entrée 4 831 · précédente 9f4c…a7c7',
      merkle: 'ancrée le 15/08/2026 04:00 UTC · horodatage RFC 3161 disponible',
      values: {
        transferredKb: formatInt(1258),
        madKb: '6',
        requests: '84',
        domNodes: formatInt(2140),
        carbon: '0,42',
        model: 'SWD v4',
        low: '0,31',
        high: '0,58',
      },
    },
  ] as readonly LedgerRecord[],
} as const;
