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
import {
  aggregationFingerprint,
  corpusProfile,
  scenarioFingerprint,
  scenarioPass,
} from '../lib/fingerprint-view';
import { contractCalendar, latestReport } from '../lib/contract-view';
import { CONTRACT } from '../lib/contract-terms';
import {
  draftVersion,
  latestEntryAt,
  longDateFr,
  measurementSpan,
  slashDate,
} from '../lib/declaration-view';
import { clockTime, fullTimestamp, lastRun, rebaselines, runMoment, shortDateTime } from '../lib/register-view';
import { elidedHash, groupedHash, REF, verifyUrl } from './ledger-refs';
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

// the contractual footprint engagement, its threshold, the margin between them
// and the state that follows all live in engagement-canon.ts. the tender, the
// tracker and the execution report each used to compute their own, and two of
// them disagreed.

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
    // "measured since X, N runs" is a fact about the register, and is read
    // from it: lib/declaration-view.ts, measurementSpan().
  },
  appBar: {
    // the declaration countdown is derived: lib/declaration-view.ts reads the
    // review a year after the version in force, against the register's own
    // latest entry.
    // the run the register puts last, and how long before the register's own
    // latest entry it was recorded. these were `14:02` and `8`, and the
    // register says 78 minutes.
    lastRunTime: clockTime(lastRun().at),
    lastRunMinutesAgo: lastRun().minutesAgo,
    userInitials: 'MC',
    // the environment the bar states is derived from the scenarios' own
    // fingerprints, in lib/fingerprint-view. the string that used to sit here
    // named two throttle profiles at once, which no single fingerprint can be.
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
  // the next date the contract owes, from the same calendar the tracker draws.
  // this card said 45 days to 30 SEP 2026 and the tracker said 45 too; both
  // were a day short, and the card had no way of following when the tracker
  // was fixed.
  deadline: {
    date: contractCalendar()[0]!.at,
    contract: CONTRACT.ref,
    days: contractCalendar()[0]!.days,
  },
} as const;

/** the environment run #4812 was measured in, expanded from its named profile. */
const RUN_ENVIRONMENT = aggregationFingerprint('candidate');

// ---- run detail ----

export const runDetailFixture = {
  id: '#4812',
  timestamp: fullTimestamp(runMoment(REF.run).at),
  route: '/demarches/acte-naissance',
  // the profile and the cache pass are the scenario's, not this fixture's.
  profile: RUN_ENVIRONMENT.throttleProfile,
  pass: scenarioPass('route-acte-naissance'),
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
  // the environment panel reads the scenario's own EnvironmentFingerprint,
  // built by the kernel from the named profile. the array that used to sit
  // here typed "mobile-4g (1.6 Mbps / 4x CPU)", which is the profile table
  // restated by hand and free to drift from it.
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
  // both runs are entries in the register, and both dates were typed. the
  // baseline read `09 Aug 03:00` for a run the register records on 14 august.
  baseline: {
    run: runMoment(REF.baselineRun).id,
    date: shortDateTime(runMoment(REF.baselineRun).at),
    branch: 'main',
  },
  candidate: {
    run: runMoment(REF.run).id,
    date: shortDateTime(runMoment(REF.run).at),
    branch: 'pr/412',
  },
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
  // the whole row is in the register entry that records it: the date, the
  // branch, the run, the author and the reason. all five were typed beside it,
  // and the dates put both moves before the runs they point at.
  rebaselines: rebaselines().map((entry) => ({
    at: entry.at,
    move: `${entry.branch} → ${entry.toRun}`,
    author: entry.author,
    reason: `"${entry.reason}"`,
  })),
} as const;

// ---- declaration editor ----

export const declarationFixture = {
  // the tags, the dates, the counts and the review date are all derived from
  // the versions the criteria canon holds: see lib/declaration-view.ts.
  // the known-gaps text is customer-authored content, not template copy
  knownGapsText:
    "Le lecteur vidéo tiers utilisé sur la rubrique actualités déclenche une lecture automatique et n'offre aucun mode écoute seule : les critères 4.1 et 5.5 ne sont pas conformes. Son remplacement est planifié pour le 1er septembre 2026. Trois carrousels animés subsistent en page d'accueil et sont comptés au même critère 4.1.",
  preview: {
    url: 'sevre-et-loire.fr/ecoconception',
    orgEyebrow: 'MÉTROPOLE DE SÈVRE-ET-LOIRE',
    referential: 'RGESN version 2 (2024)',
    host: 'Scaleway, Paris (DC5)',
    // the green hosting check has its own date, which is not the declaration's:
    // a hosting claim is worth what its check date says it is.
    verifiedDate: longDateFr(draftVersion().establishedAt),
    methodologyVersion: 'v1.2',
    verifyUrl: verifyUrl(REF.declarationV3),
  },
} as const;

// ---- tender workspace ----

export const tenderFixture = {
  ref: 'AO-2026-SL-0417',
  title: 'Refonte du portail métropolitain',
  // the hour the platform closes is the buyer's, and nothing here can derive
  // it. the countdown beside it is ours, and was typed.
  deadline: {
    at: '2026-09-12T12:00:00.000Z',
    time: '12:00',
    platform: 'PLACE',
  },
  currentStep: 2,
  // the commitments, their margins, the points the unsigned proposal falls
  // short by, and the conformity history all come from engagement-canon.ts and
  // criteria-view.ts. what is left here is the tender itself.
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

/** the hour the merkle root was anchored, from the anchor rather than beside it. */
function anchorTime(): string {
  const at = new Date(ledgerCanon.anchoredAt);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}`;
}

// ---- the three documents, print register ----

export interface DocEventPart {
  text: string;
  mono?: boolean;
  strong?: boolean;
}

export const documentsFixture = {
  declaration: {
    url: 'sevre-et-loire.fr/ecoconception',
    since: longDateFr(measurementSpan().since),
    methodology: 'v1.2',
    hash: elidedHash(REF.declarationV3, 16, 4),
    verifyUrl: verifyUrl(REF.declarationV3),
    contact: 'ecoconception@sevre-et-loire.fr',
  },
  annexe: {
    agencyName: 'ATELIER SEXTANT',
    agencyLine: '14 rue Kervégan · 44000 Nantes · SIRET 892 411 507 00018',
    date: longDateFr(latestEntryAt()),
    ref: 'AO-2026-SL-0417',
    // '%' and '#' are placeholders: the conformity rate is read off the
    // assessments and the engagement count off the engagements the offer
    // carries, rather than either being repeated here.
    coverStats: [
      { value: `${formatInt(measurementSpan().days)} j` },
      { value: formatInt(measurementSpan().runs) },
      { value: '%' },
      { value: '#' },
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
    footerLine2: `RELEVÉS ${slashDate(measurementSpan().since)} → ${slashDate(latestEntryAt())} · CHROMIUM 127.0.6533.88`,
    hash: elidedHash(REF.run, 12, 4),
    verifyUrl: verifyUrl(REF.run),
    page: 3,
    pages: 9,
  },
  rapport: {
    // the reference, the article, the period and the count of relevés it was
    // established from are the register's, read from the report entry the
    // footer's own hash resolves to. `runs: 1284` was typed here, typed again
    // in the footer line, and hashed into the register payload, on a chain
    // holding 4 812 timestamped runs of which the period it named holds a
    // different number.
    // the engagement rows come from engagement-canon.ts, and only the signed
    // ones are there. the version this replaces reported the supplier
    // `nonTenu` on a commitment the tender left unchecked, two paragraphs
    // above a narrative calling the same figure a target we set ourselves.

    // an event in the period is an entry in the register: the regression the
    // check blocked, the override that was authorised, the baseline that was
    // moved. the prose describing each one is the reviewer's, the date is the
    // entry's, and the order is the order they happened. all three dates were
    // typed, and they were printed 15/08, 08/07, 03/08.
    events: [
      {
        ref: REF.run,
        parts: [
          { text: 'Régression de 184 KB détectée sur ' },
          { text: '/demarches/acte-naissance', mono: true },
          { text: ' (PR #412), bloquée avant fusion. Correctif attendu en T3.' },
        ],
      },
      {
        ref: REF.override,
        parts: [
          { text: 'Dérogation enregistrée', strong: true },
          {
            text: ' : vidéo de 340 KB en page actualités, demandée par la direction de la communication pour la campagne du 14 juillet. Retrait planifié au 01/09/2026. Autorisée par m. carbonne.',
          },
        ],
      },
      {
        ref: REF.rebaseline4790,
        parts: [
          { text: 'Nouvelle référence de comparaison établie sur ' },
          { text: 'main', mono: true },
          { text: ' après refonte, consignée au registre.' },
        ],
      },
    ] as ReadonlyArray<{ ref: string; parts: readonly DocEventPart[] }>,
    calloutBody:
      'Le lecteur vidéo tiers représente 15 des 38 points mesurés. Son remplacement par une intégration à la demande est engagé, livraison au 01/09/2026. Aucune valeur après remplacement n\'est avancée ici : la mesure du trimestre suivant dira ce qu\'elle est.',
    footerLine1: `MÉTHODOLOGIE v1.2 · ${formatInt(latestReport().runs)} RELEVÉS · CHROMIUM 127.0.6533.88`,
    footerLine2: `REGISTRE : ${formatInt(ledgerCanon.entryCount)} ENTRÉES · RACINE ANCRÉE ${slashDate(ledgerCanon.anchoredAt)} ${anchorTime()} UTC`,
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
  profile: scenarioFingerprint('scan').throttleProfile,
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
  // one profile across the whole corpus, or corpusProfile throws: a rank
  // across two profiles would be ranking the profiles.
  profile: corpusProfile(),
  methodology: 'v1.2',
} as const;
