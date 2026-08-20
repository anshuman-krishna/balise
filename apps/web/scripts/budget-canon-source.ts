import type { AggregatedMetrics, BudgetOverride, MetricId, NoiseFloor } from '@balise/schemas';
import type { AttributionSide } from '@balise/attribution';
import { carbonModels } from '@balise/carbon-models';
import {
  evaluateBudgets,
  readConfig,
  summariseCheck,
  type CheckProvenance,
  type ScenarioMeasurement,
} from '@balise/budgets';
import { BASELINE_SIDE, CANDIDATE_SIDE, ROUTE } from './attribution-canon-source';
import { aggregateFrom, canonMetric } from './measurement-canon-source';
import { ledgerEntry, REF, shortHash, verifyUrl } from '../src/fixtures/ledger-refs';

/**
 * the canon's budgets, as a real balise.yml evaluated by @balise/budgets against
 * the runs the other canons already publish.
 *
 * the route the comparison and attribution screens are about is not restated
 * here: its two aggregates are derived from the same resource lists that produced
 * the attribution card, so the budget table, the pr check and the attribution
 * card cannot disagree about what the run measured.
 */

export const CANON_CONFIG_SOURCE = `# balise.yml · sevre-et-loire.fr · pack rgesn-2024-v2
version: 1
service: portail-metropolitain
runs: 5
profiles: [desktop-fibre, mobile-4g]
reference_model: swd@4.0
# deltas below the computed noise floor are never failures
noise_floor: auto

budgets:
  - scope: /accueil
    bytes: { warn: 860KB, fail: 900KB }
  - scope: /demarches/*
    bytes: { warn: 1250KB, fail: 1300KB }
    requests: { fail: 90 }
  - scope: /actualites
    bytes: { warn: 860KB, fail: 900KB }
  - scope: journey:demande-acte
    bytes: { fail: 1400KB }
  - scope: service
    third_party_share: { fail: 30% }
    relative_to_baseline: { warn: +3% }

check:
  block_merge_on: fail
  annotate_files: true
`;

// ---------------------------------------------------------------------------
// the measurements
// ---------------------------------------------------------------------------

/**
 * the floors the budgets are read against, from the service scenario's own
 * history rather than typed in. a budget that failed on a delta the floor
 * would have absorbed is the failure mode this removes.
 */
const FLOOR_METRICS: readonly MetricId[] = [
  'transferred_bytes',
  'request_count',
  'third_party_share_pct',
];

function floors(): NoiseFloor[] {
  return FLOOR_METRICS.map((metricId) => canonMetric('service', metricId).floor);
}

interface Measured {
  bytes: number;
  requests: number;
  thirdPartyBytes: number;
  /** dispersion of the transferred figure, for the bands the screens draw. */
  mad: number;
}

/**
 * an aggregation built from runs, through the kernel's own aggregator. the
 * spread is twice the mad because the run offsets put the mad at half of it,
 * and the third-party share is divided out of each run rather than declared:
 * the version of this that typed `min: median - mad` was describing a
 * distribution no runs produced.
 */
function aggregate(measured: Measured): AggregatedMetrics {
  const share = measured.thirdPartyBytes / measured.bytes;
  return aggregateFrom(
    {
      transferred_bytes: { centre: measured.bytes, spread: measured.mad * 2 },
      request_count: { centre: measured.requests, spread: 2, integral: true },
      third_party_bytes: { centre: measured.thirdPartyBytes, spread: measured.mad * 2 * share },
    },
    'cold',
    5,
  );
}

/** the same resource lists the attribution canon runs on, read as metrics. */
function fromSide(side: AttributionSide, mad: number): Measured {
  const bytes = side.resources.reduce((total, resource) => total + resource.transferredBytes, 0);
  const thirdPartyBytes = side.resources
    .filter((resource) => !resource.url.startsWith(side.serviceOrigin))
    .reduce((total, resource) => total + resource.transferredBytes, 0);
  return { bytes, requests: side.resources.length, thirdPartyBytes, mad };
}

const MAIN: Record<string, Measured> = {
  '/accueil': { bytes: 840_000, requests: 61, thirdPartyBytes: 184_800, mad: 3_000 },
  [ROUTE]: fromSide(BASELINE_SIDE, 9_000),
  // the video hero the override is about: 340 KB past a 900 KB budget, and the
  // reason the service third-party share is where it is.
  '/actualites': { bytes: 1_240_000, requests: 74, thirdPartyBytes: 480_000, mad: 11_000 },
  'demande-acte': { bytes: 1_258_000, requests: 96, thirdPartyBytes: 226_000, mad: 9_000 },
};

const HEAD: Record<string, Measured> = {
  '/accueil': { bytes: 842_000, requests: 61, thirdPartyBytes: 185_240, mad: 3_000 },
  [ROUTE]: fromSide(CANDIDATE_SIDE, 9_000),
  'demande-acte': { bytes: 1_442_000, requests: 100, thirdPartyBytes: 296_000, mad: 9_000 },
};

function scenario(id: string, label: string, kind: 'route' | 'journey', head?: Measured): ScenarioMeasurement {
  return {
    id,
    kind,
    label,
    candidate: aggregate(head ?? MAIN[id]!),
    baseline: head === undefined ? undefined : aggregate(MAIN[id]!),
    floors: floors(),
  };
}

/** the branch view: the latest measurement of main, with nothing to compare to. */
const BRANCH_SCENARIOS: ScenarioMeasurement[] = [
  scenario('/accueil', '/accueil', 'route'),
  scenario(ROUTE, ROUTE, 'route'),
  scenario('/actualites', '/actualites', 'route'),
  scenario('demande-acte', "journey: demande d'acte", 'journey'),
];

/** the pull request: the scenarios its changed routes cover, against main. */
const PR_SCENARIOS: ScenarioMeasurement[] = [
  scenario('/accueil', '/accueil', 'route', HEAD['/accueil']),
  scenario(ROUTE, ROUTE, 'route', HEAD[ROUTE]),
  scenario('demande-acte', "journey: demande d'acte", 'journey', HEAD['demande-acte']),
];

// ---------------------------------------------------------------------------
// the override, which is a ledger entry before it is anything else
// ---------------------------------------------------------------------------

const EXPIRES_AT = '2026-09-01T00:00:00.000Z';
const EVALUATED_AT = '2026-08-15T12:02:00.000Z';

function overrideFromLedger(): BudgetOverride {
  const entry = ledgerEntry(REF.override);
  const read = (key: string): string => {
    const value = entry.payload[key];
    if (typeof value !== 'string') {
      throw new Error(`the recorded override carries no ${key}`);
    }
    return value;
  };

  return {
    scope: { kind: 'route', pattern: read('route') },
    metricId: 'transferred_bytes',
    reason: read('reason'),
    by: read('authorisedBy'),
    recordedAt: entry.createdAt,
    expiresAt: EXPIRES_AT,
    requestedIn: read('pullRequest'),
    ledgerRef: entry.entryHash.slice(0, 8),
  };
}

// ---------------------------------------------------------------------------
// what the check says about itself
// ---------------------------------------------------------------------------

/**
 * the provenance every check comment carries. the ledger reference is a real
 * entry in the generated chain, and the verification url resolves to it, so
 * the footer of the comment is checkable rather than decorative.
 */
const PROVENANCE: CheckProvenance = {
  methodologyVersion: 'v1.2',
  // read off the package, so the comment cannot name a model that did not run.
  models: carbonModels.map((model) => `${model.id}@${model.version}`),
  runId: '#4812',
  ledgerRef: shortHash(REF.run),
  verificationUrl: verifyUrl(REF.run),
  fingerprintMatched: true,
};

// ---------------------------------------------------------------------------

export function buildBudgetCanon() {
  const parsed = readConfig(CANON_CONFIG_SOURCE);
  if (parsed.status !== 'ok') {
    throw new Error(parsed.issues.map((issue) => `line ${issue.line}: ${issue.message}`).join('\n'));
  }

  const override = overrideFromLedger();
  const shared = { config: parsed.config, overrides: [override], evaluatedAt: EVALUATED_AT };

  const main = evaluateBudgets({ ...shared, scenarios: BRANCH_SCENARIOS });
  const pull = evaluateBudgets({ ...shared, scenarios: PR_SCENARIOS });

  return {
    source: CANON_CONFIG_SOURCE,
    config: parsed.config,
    override,
    main: { assessments: main, summary: summariseCheck(main, parsed.config.check) },
    pull: { assessments: pull, summary: summariseCheck(pull, parsed.config.check) },
    pullScenarios: PR_SCENARIOS,
    provenance: PROVENANCE,
  };
}
