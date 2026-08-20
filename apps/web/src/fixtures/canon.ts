import type { AggregatedMetric, Confidence, MetricId, NoiseFloor } from '@balise/schemas';
import { formatInt, formatNumber } from '@balise/ui';
import {
  asAggregate,
  floorValue,
  kb,
  metric,
  runsVaried,
  trendPoints,
} from '../lib/measurement-view';
import { carbonCanon } from './carbon-canon';
import { elidedHash, groupedHash, REF, shortHash, verifyUrl } from './ledger-refs';
import { ledgerCanon } from './ledger-canon';

// ---- the measured state, from @balise/measure-core ----

// the service median the dashboard tiles draw. read once here so no tile can
// state a median, a dispersion or a floor that another tile contradicts.
const SERVICE_BYTES = metric('service', 'transferred_bytes');
const SERVICE_DOM = metric('service', 'dom_node_count');
const SERVICE_SHARE = metric('service', 'third_party_share_pct');
const SERVICE_REQUESTS = metric('service', 'request_count');

// a floor is null until the history establishes one, and a tile with no floor
// draws no noise region rather than a region of zero width.
const SERVICE_BYTES_FLOOR = floorValue(SERVICE_BYTES);
const SERVICE_DOM_FLOOR = floorValue(SERVICE_DOM);
const SERVICE_SHARE_FLOOR = floorValue(SERVICE_SHARE);

// the two runs the comparison and the run detail read against each other. both
// are aggregations of one scenario, so both are measured against its one floor.
const BASE_BYTES = metric('baseline', 'transferred_bytes');
const CAND_BYTES = metric('candidate', 'transferred_bytes');

// the free scan: one cold pass on a page nobody has history for.
const SCAN_DOM = metric('scan', 'dom_node_count');

// ---- the contractual footprint engagement ----

// the service median as @balise/carbon-models estimated it, read once. the
// tender, the contract tracker and the execution report all print this figure,
// so no two of them can state a different footprint for the same service.
const carbonService = carbonCanon.pages.find((page) => page.id === 'dashboard');
if (carbonService === undefined) throw new Error('the carbon canon holds no service median');

const carbonMedianG = carbonService.band.reference;

// the ceiling is authored, not measured: a threshold is something a supplier
// signs, and this one was written into the offer with room above the figure
// the reference model gave at the time. the headroom below is derived from it,
// never typed beside it.
const CARBON_CEILING_G = 0.1;

const carbonHeadroomPct = Math.round((1 - carbonMedianG / CARBON_CEILING_G) * 100);
const carbonBarPct = 100 - carbonHeadroomPct;

const carbonMedianText = formatNumber(carbonMedianG, 3);
const carbonCeilingText = formatNumber(CARBON_CEILING_G, 3);

/** documents are french, and french decimals take a comma. */
const fr = (text: string): string => text.replace('.', ',');

// the scenario canon: one internally consistent fictional dataset, from the
// design handoff. none of it is measured. it exists so every screen tells the
// same story until the runner (v1) and the api (v2) replace it with real data.
// keep the cross-screen arithmetic consistent; the design brief in testing/
// holds the canon.
//
// every median, dispersion, noise floor and confidence grade below is read
// from the measurement canon, which @balise/measure-core computed from runs.
// nothing in this file may state a statistic of its own: the version of it
// that did drew five run dots beside a mad those five runs do not give.

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
  transferred: {
    medianKb: kb(SERVICE_BYTES.median),
    madKb: kb(SERVICE_BYTES.mad),
    noiseKb: SERVICE_BYTES_FLOOR === null ? null : kb(SERVICE_BYTES_FLOOR),
    confidence: SERVICE_BYTES.confidence,
    // the budget is a threshold someone set, not a measurement.
    budgetKb: 1300,
    scaleMin: 1000,
    scaleMax: 1500,
  },
  thirdParty: {
    sharePct: SERVICE_SHARE.median,
    // the ceiling the offer committed to. authored, like every threshold.
    commitCeilingPct: 30,
    bandLow: SERVICE_SHARE.median - SERVICE_SHARE.mad,
    bandHigh: SERVICE_SHARE.median + SERVICE_SHARE.mad,
    noiseLow: SERVICE_SHARE_FLOOR === null ? null : SERVICE_SHARE.median - SERVICE_SHARE_FLOOR,
    noiseHigh: SERVICE_SHARE_FLOOR === null ? null : SERVICE_SHARE.median + SERVICE_SHARE_FLOOR,
    confidence: SERVICE_SHARE.confidence,
    scaleMin: 0,
    scaleMax: 50,
  },
  domNodes: {
    median: SERVICE_DOM.median,
    mad: SERVICE_DOM.mad,
    bandLow: SERVICE_DOM.median - SERVICE_DOM.mad,
    bandHigh: SERVICE_DOM.median + SERVICE_DOM.mad,
    noiseLow: SERVICE_DOM_FLOOR === null ? null : SERVICE_DOM.median - SERVICE_DOM_FLOOR,
    noiseHigh: SERVICE_DOM_FLOOR === null ? null : SERVICE_DOM.median + SERVICE_DOM_FLOOR,
    confidence: SERVICE_DOM.confidence,
    scaleMin: 1800,
    scaleMax: 2500,
    // the reason the grade is not high, said plainly: this many of the runs
    // behind the median landed somewhere else.
    runsVaried: runsVaried(SERVICE_DOM),
    runsTotal: SERVICE_DOM.sampleCount,
  },
  trend: {
    journey: "demande d'acte",
    budgetKb: 1300,
    startLabel: '17 JUL',
    endLabel: '15 AUG',
    gridValues: [1250, 1350, 1450],
    // the last fourteen aggregations of the journey, medians in kilobytes
    // inside each aggregation's own run spread. the envelope is measured
    // dispersion, never a smoothing applied to make the line read better.
    points: trendPoints('journey', 'transferred_bytes', 14),
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
  deadline: {
    date: '30 SEP 2026',
    contract: '2026-SL-0417',
    days: 45,
  },
} as const;

// ---- run detail ----

export const runDetailFixture = {
  id: '#4812',
  timestamp: '15 Aug 2026 14:02:41 UTC',
  route: '/demarches/acte-naissance',
  profile: 'mobile-4g',
  // the waterfall, the resource inventory and the by-type summary are all read
  // from this run's capture, which the measurement canon publishes beside the
  // metrics extracted from it: see lib/capture-view.ts. the version of this
  // fixture that listed eight resources here had them adding to a different
  // page from the one the attribution engine diffed.
  // every figure on this card is the aggregate's, including the run dots: the
  // dispersion drawn is the dispersion of the runs drawn, and the two sides
  // carry their own mad because two run sets do not share one.
  dispersion: {
    baselineRuns: BASE_BYTES.runValues.map(kb),
    candidateRuns: CAND_BYTES.runValues.map(kb),
    baselineMedian: kb(BASE_BYTES.median),
    candidateMedian: kb(CAND_BYTES.median),
    baselineMad: kb(BASE_BYTES.mad),
    candidateMad: kb(CAND_BYTES.mad),
    noiseKb: floorValue(CAND_BYTES) === null ? null : kb(floorValue(CAND_BYTES)!),
    scaleMin: 1080,
    scaleMax: 1330,
    // kernel inputs. the verdict on this card is computed through
    // classifyDelta, never asserted here; the delta and the noise ratio are
    // derived from these at the call site.
    before: asAggregate(BASE_BYTES),
    after: asAggregate(CAND_BYTES),
    floor: CAND_BYTES.floor,
  },
  fingerprint: [
    { key: 'chromium', value: '127.0.6533.88' },
    { key: 'image', value: 'sha256:4e91c2a7…' },
    { key: 'throttle', value: 'mobile-4g (1.6 Mbps / 4× CPU)' },
    { key: 'region', value: 'eu-west-par' },
    // coverage instruments script execution and moves the time it reports, so
    // it is part of the environment and not a detail of the run.
    { key: 'coverage', value: 'js + css' },
    // the models row is filled at render time from what actually ran.
    { key: 'models', value: '' },
    { key: 'ledger', value: `${shortHash(REF.run)}…`, link: true },
  ] as ReadonlyArray<{ key: string; value: string; link?: boolean }>,
} as const;

// ---- comparison ----

export interface ComparisonRow {
  label: string;
  /** display formatting family; raw values stay raw (invariant 6). */
  kind: 'kb' | 'ms' | 'count' | 'g';
  /** the grade the kernel gave the candidate aggregate, never a hand-set flag. */
  confidence: Confidence;
  before: AggregatedMetric;
  after: AggregatedMetric;
  floor: NoiseFloor;
  /** an absolute budget or contractual threshold is exceeded. */
  overThreshold: boolean;
}

/**
 * one row of the comparison, built from the two aggregations of the route.
 * the floor is the scenario's, so both sides are read against one number, and
 * the confidence grade is the candidate's own.
 */
function comparisonRow(
  label: string,
  kind: ComparisonRow['kind'],
  metricId: MetricId,
  overThreshold: boolean,
): ComparisonRow {
  const before = metric('baseline', metricId);
  const after = metric('candidate', metricId);
  return {
    label,
    kind,
    confidence: after.confidence,
    before: asAggregate(before),
    after: asAggregate(after),
    floor: after.floor,
    overThreshold,
  };
}

export const comparisonFixture = {
  baseline: { run: '#4790', date: '09 Aug 03:00', branch: 'main' },
  candidate: { run: '#4812', date: '15 Aug 14:02', branch: 'pr/412' },
  rows: [
    comparisonRow('Transferred bytes', 'kb', 'transferred_bytes', true),
    comparisonRow('Requests', 'count', 'request_count', false),
    comparisonRow('JS execution time', 'ms', 'js_execution_ms', false),
    comparisonRow('DOM nodes', 'count', 'dom_node_count', false),
  ] as readonly ComparisonRow[],
  // the attribution card and the third-party diff are computed by
  // @balise/attribution from two builds with real source maps. see
  // fixtures/attribution-canon.ts, which is generated.
} as const;

// ---- budgets ----

export const budgetsFixture = {
  // the table, the file and the override are computed: see budget-canon.ts,
  // written by `pnpm gen:budget-canon`. what is left here is narrative the
  // engine has no opinion about.
  rebaselines: [
    { date: '03 AUG', move: 'main → #4790', author: 'c. bellanger', reason: '"post-refonte"' },
    { date: '11 JUL', move: 'main → #4612', author: 'm. carbonne', reason: '"new hosting"' },
  ],
} as const;

// ---- declaration editor ----

export const declarationFixture = {
  draft: 'v3',
  published: 'v2',
  publishedDate: '12 Mar 2026',
  reviewDate: '12 Mar 2027',
  // the known-gaps text is customer-authored content, not template copy
  knownGapsText:
    "Le lecteur vidéo tiers utilisé sur la rubrique actualités déclenche une lecture automatique et n'offre aucun mode écoute seule : les critères 4.1 et 5.5 ne sont pas conformes. Son remplacement est planifié pour le 1er septembre 2026. Trois carrousels animés subsistent en page d'accueil et sont comptés au même critère 4.1.",
  versions: [
    { tag: 'v3', draft: true, date: '15 Aug', conforme: 41 },
    { tag: 'v2', draft: false, date: '12 Mar', conforme: 34, ledger: `${shortHash(REF.declarationV2)}…` },
    { tag: 'v1', draft: false, date: '04 Mar', conforme: 28, ledger: `${shortHash(REF.declarationV1)}…` },
  ] as ReadonlyArray<{ tag: string; draft: boolean; date: string; conforme: number; ledger?: string }>,
  preview: {
    url: 'sevre-et-loire.fr/ecoconception',
    orgEyebrow: 'MÉTROPOLE DE SÈVRE-ET-LOIRE',
    establishedDate: '15 août 2026',
    referential: 'RGESN version 2 (2024)',
    host: 'Scaleway, Paris (DC5)',
    verifiedDate: '15 août 2026',
    methodologyVersion: 'v1.2',
    verifyUrl: verifyUrl(REF.declarationV3),
    badgeDate: '15.08.26',
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
      measured: `${carbonMedianText} g`,
      proposed: `≤ ${carbonCeilingText} g`,
      margin: { kind: 'headroom', pct: carbonHeadroomPct },
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
    verifyUrl: verifyUrl(REF.run),
  },
} as const;

// ---- contract tracker ----

export type ContractStatus = 'tenu' | 'atRisk' | 'aJour';

export interface ContractRow {
  label: string;
  seuil: string;
  /** null when the figure is read off the assessments rather than typed. */
  actuel: string | null;
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
      seuil: carbonCeilingText,
      actuel: carbonMedianText,
      headroom: { barPct: carbonBarPct, tone: 'ok', labelPct: carbonHeadroomPct },
      trendPoints: '2,8 16,9 30,7 44,10 58,11 72,12 86,13 108,13',
      trendTone: 'neutral',
      status: 'tenu',
    },
    {
      label: 'Taux de conformité RGESN à 12 mois',
      seuil: '75%',
      // null is the derived row: the rate and the headroom come from the
      // assessments, so the tracker and the report cannot state two rates.
      actuel: null,
      actuelTone: 'caution',
      headroom: { barPct: 0, tone: 'caution', ptToGo: 0 },
      // no conformity history is held yet, so no line is drawn from one.
      trendPoints: '',
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
  // the contractual conformity target, which the row and the warning under it
  // are both measured against.
  conformityTargetPct: 75,
  /** the review the conformity target is measured at, not the contract length. */
  conformityReviewMonths: 12,
  calendar: [
    { date: '30 SEP 26', label: "Rapport d'exécution Q3", days: 45, urgent: true },
    { date: '31 DEC 26', label: "Rapport d'exécution Q4", days: 137 },
    { date: '12 MAR 27', label: 'Revue annuelle · déclaration', days: 208 },
    { date: '02 APR 27', label: 'Revue contractuelle 12 mois', days: 229 },
    { date: '02 APR 29', label: 'Fin du marché · reconduction', days: null },
  ] as ReadonlyArray<{ date: string; label: string; days: number | null; urgent?: boolean }>,
} as const;

// ---- fleet ----

/**
 * the fleet's frame. its rows, its shared scale and its distribution come from
 * the corpus, which is measured; what stays here is what the agency holds
 * rather than what the runner found.
 */
export const fleetFixture = {
  activeContracts: 2,
  openTenders: 1,
  deadlines30d: 1,
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
    hash: elidedHash(REF.declarationV3, 16, 4),
    verifyUrl: verifyUrl(REF.declarationV3),
    contact: 'ecoconception@sevre-et-loire.fr',
  },
  annexe: {
    agencyName: 'ATELIER SEXTANT',
    agencyLine: '14 rue Kervégan · 44000 Nantes · SIRET 892 411 507 00018',
    date: '15 août 2026',
    ref: 'AO-2026-SL-0417',
    // '%' is the placeholder for the conformity rate, which the screen reads
    // off the assessments rather than repeating here.
    coverStats: [
      { value: '165 j' },
      { value: formatInt(4812) },
      { value: '%' },
      { value: '4' },
    ],
    // fig. 3 in value space; rendered through the print ToleranceBand so the
    // document figure and the app figure are the same component
    // the service's measured state, all four rows from the one aggregation.
    // the version of this table mixed the candidate run's request count with
    // the service median's bytes and the baseline's dom dispersion, which is
    // three different measurements printed as one page of a tender document.
    indicators: [
      {
        label: 'Octets transférés (froid)',
        median: `${formatInt(kb(SERVICE_BYTES.median))} KB`,
        mad: `${formatInt(kb(SERVICE_BYTES.mad))} KB`,
        conf: SERVICE_BYTES.confidence,
      },
      {
        label: 'Requêtes HTTP',
        median: formatInt(SERVICE_REQUESTS.median),
        mad: formatInt(SERVICE_REQUESTS.mad),
        conf: SERVICE_REQUESTS.confidence,
      },
      {
        label: 'Nœuds DOM',
        median: formatInt(SERVICE_DOM.median),
        mad: formatInt(SERVICE_DOM.mad),
        conf: SERVICE_DOM.confidence,
      },
      {
        label: 'Part des tiers',
        median: `${fr(formatNumber(SERVICE_SHARE.median, 1))}%`,
        mad: `${fr(formatNumber(SERVICE_SHARE.mad, 1))} pt`,
        conf: SERVICE_SHARE.confidence,
      },
    ] as ReadonlyArray<{ label: string; median: string; mad: string; conf: Confidence }>,
    // the figure in the prose is the one in the table above it. a document
    // that states a share in a sentence and a different one in a row beside it
    // is the first thing an auditor pulls on.
    ecartsBody: `La part des tiers (${fr(formatNumber(SERVICE_SHARE.median, 1))}%) dépasse la cible de 30% que nous nous fixons. Le lecteur vidéo de la rubrique actualités en représente 15 points. Son remplacement par une intégration à la demande est planifié au 1er septembre 2026 et figure au chapitre 5 comme engagement daté.`,
    footerLine1: 'MÉTHODOLOGIE v1.2 · balise.fr/methodologie',
    footerLine2: 'RELEVÉS 03/03/2026 → 15/08/2026 · CHROMIUM 127.0.6533.88',
    hash: elidedHash(REF.run, 12, 4),
    verifyUrl: verifyUrl(REF.run),
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
        seuil: `${fr(carbonCeilingText)} g`,
        t3: `${fr(carbonMedianText)} g`,
        gauge: { fillPct: carbonBarPct, tone: 'held' },
        etat: 'tenu',
      },
      {
        label: 'Taux de conformité RGESN (cible 12 mois)',
        seuil: '75%',
        // the achieved rate and the gauge are read off the assessments, so the
        // report and the declaration cannot state two different rates.
        t3: null as string | null,
        targetPct: 75,
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
      /** null when the figure is read off the assessments rather than typed. */
      t3: string | null;
      /** the contractual target the gauge fills against, for a derived row. */
      targetPct?: number;
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
    footerLine2: `REGISTRE : ${formatInt(ledgerCanon.entryCount)} ENTRÉES · RACINE ANCRÉE 15/08/2026 04:00 UTC`,
    hash: groupedHash(REF.report),
    verifyUrl: verifyUrl(REF.report),
  },
} as const;

// ---- pull request check ----

export const prCheckFixture = {
  title: 'Ajoute le formatage des dates localisé',
  number: '#412',
  author: 'c-bellanger',
  commits: 3,
  into: 'main',
  from: 'feat/dates-locale',
  requiredCheck: 'balise/budget',
  budgetCheck: 'balise / budget',
  statuses: [
    { name: 'balise / criteria', state: 'pass', text: 'no RGESN criterion regressed' },
    { name: 'ci / test', state: 'pass', text: '248 passed' },
  ] as ReadonlyArray<{ name: string; state: 'fail' | 'pass'; text: string }>,
  commentedMinutesAgo: 22,
  runsPerScenario: 5,
  // the measurement rows come from @balise/budgets and the attribution
  // sentence from @balise/attribution: see budget-canon.ts and
  // attribution-canon.ts, both generated. the provenance line comes from the
  // same place the posted comment reads it, budgetCanon.provenance.
  // the diff hunk github renders around an annotation. it is the customer's own
  // code, which we never fetch, never store and never produce; the note beside
  // it is the annotation the check built, and is not written here.
  annotation: {
    file: 'src/lib/dates.ts',
    lines: [
      { no: 12, text: "import { format } from 'date-fns'", added: false },
      { no: 14, text: "+ import * as locales from 'date-fns/locale'", added: true },
      { no: 15, text: "const fmt = (d, l) => format(d, 'PPP', { locale: locales[l] })", added: false },
    ] as ReadonlyArray<{ no: number; text: string; added: boolean }>,
  },
} as const;

// ---- public surfaces ----

export const scanFixture = {
  domain: 'bibliotheques-selo.fr',
  profile: 'mobile-4g',
  // the findings are raised by @balise/measure-core from this page's capture
  // and live in findings-canon.ts. the three that used to sit here were
  // authored sentences with authored savings, two of them describing things a
  // capture does not hold.
  // the grade, the score and the carbon band are estimated by
  // @balise/carbon-models from this page's held capture: see carbon-canon.ts.
  //
  // the confidence grade is the kernel's, and on one cold pass with no history
  // it is low. the version of this that printed "confiance élevée" in green
  // beside a single run was the clearest case in the app of a screen grading
  // its own measurement.
  confidence: SCAN_DOM.confidence,
} as const;

/**
 * the public index's frame. the rows, the size of the corpus, the shared scale
 * and every position in it are the corpus canon's, computed from captures.
 * what remains here is the date of the sweep and the profile it ran on.
 */
export const observatoryFixture = {
  measuredOn: '15 août 2026',
  profile: 'mobile-4g',
  methodology: 'v1.2',
} as const;
