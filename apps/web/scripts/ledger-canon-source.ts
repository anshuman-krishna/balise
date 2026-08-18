import { OrganizationId, type LedgerEntry, type LedgerEntryInput } from '@balise/schemas';
import { anchor, append, createMemoryStore, verify } from '@balise/ledger';

/**
 * the canon's register, as an actual chain rather than a set of hashes typed
 * into a fixture. every entry the scenario refers to is here, in the order it
 * happened, and the runs it retains are here too, so the position a document
 * cites is the position the entry really has.
 *
 * deterministic by construction: fixed timestamps, fixed payloads. running
 * this twice produces byte-identical output, which is the same property the
 * document pipeline needs from its own renders.
 */

export const ORGANIZATION = OrganizationId.parse('org_atelier_sextant');

const RUN_COUNT = 4812;
const FIRST_RUN_AT = Date.parse('2026-03-03T09:00:00.000Z');
const LAST_RUN_AT = Date.parse('2026-08-15T14:02:41.000Z');

const SCENARIOS = ['/accueil', '/demarches/acte-naissance', "journey:demande-acte"] as const;

interface Planned {
  at: string;
  input: LedgerEntryInput;
}

function runAt(index: number): string {
  const span = LAST_RUN_AT - FIRST_RUN_AT;
  const at = FIRST_RUN_AT + Math.round((span * index) / (RUN_COUNT - 1));
  return new Date(at).toISOString();
}

function runEntry(number: number): Planned {
  const index = number - 1;
  const scenario = SCENARIOS[index % SCENARIOS.length]!;
  return {
    at: runAt(index),
    input: {
      organizationId: ORGANIZATION,
      kind: 'run',
      refId: `run_${number}`,
      payload: {
        runId: `#${number}`,
        scenario,
        profile: index % 2 === 0 ? 'mobile-4g' : 'desktop-fibre',
        pass: 'cold',
        runs: 5,
        methodologyVersion: 'v1.2',
      },
    },
  };
}

// the last run is the one every surface cites, so it carries the full record
// rather than the compact one the history uses.
function finalRunEntry(): Planned {
  return {
    at: new Date(LAST_RUN_AT).toISOString(),
    input: {
      organizationId: ORGANIZATION,
      kind: 'run',
      refId: `run_${RUN_COUNT}`,
      payload: {
        runId: `#${RUN_COUNT}`,
        scenario: '/accueil',
        profile: 'mobile-4g',
        pass: 'cold',
        runs: 5,
        methodologyVersion: 'v1.2',
        fingerprint: {
          browserBuild: '127.0.6533.88',
          imageDigest: 'sha256:4e91c2a7',
          throttleProfile: 'mobile-4g',
          region: 'eu-west-par',
        },
        models: ['ecoindex@3.1', 'swd@4.0', 'ademe@2024', '1byte@2021'],
        metrics: {
          transferredBytes: 1_258_000,
          transferredBytesMad: 6_000,
          requestCount: 84,
          domNodeCount: 2_140,
          carbonPerVisitG: 0.42,
          carbonBandLowG: 0.31,
          carbonBandHighG: 0.58,
        },
        confidence: 'high',
      },
    },
  };
}

const NARRATIVE: readonly Planned[] = [
  {
    at: '2026-03-01T00:00:00.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'methodology_version',
      refId: 'methodology_v1.2',
      payload: { version: 'v1.2', url: 'balise.fr/methodologie' },
    },
  },
  {
    at: '2026-03-04T10:12:00.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'declaration_version',
      refId: 'declaration_v1',
      payload: { version: 'v1', packVersion: 'rgesn-2024-v2', conforme: 28, applicable: 70 },
    },
  },
  {
    at: '2026-03-12T16:40:00.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'declaration_version',
      refId: 'declaration_v2',
      payload: { version: 'v2', packVersion: 'rgesn-2024-v2', conforme: 34, applicable: 70 },
    },
  },
  {
    at: '2026-08-15T13:00:00.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'declaration_version',
      refId: 'declaration_v3',
      payload: { version: 'v3', packVersion: 'rgesn-2024-v2', conforme: 41, applicable: 70 },
    },
  },
  {
    at: '2026-07-08T11:05:00.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'budget_override',
      refId: 'override_pr_401',
      payload: {
        pullRequest: 'PR #401',
        route: '/actualites',
        // the justification is recorded verbatim and appears in the execution
        // report; that is the point of logging the escape hatch.
        reason:
          'Mandated by comms for the 14 July campaign, removal scheduled 01 Sep.',
        authorisedBy: 'm. carbonne',
      },
    },
  },
  {
    at: '2026-07-11T08:30:00.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'rebaseline',
      refId: 'rebaseline_4612',
      payload: { branch: 'main', toRun: '#4612', reason: 'new hosting', author: 'm. carbonne' },
    },
  },
  {
    at: '2026-08-03T09:15:00.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'rebaseline',
      refId: 'rebaseline_4790',
      payload: { branch: 'main', toRun: '#4790', reason: 'post-refonte', author: 'c. bellanger' },
    },
  },
  {
    at: '2026-08-15T15:20:08.000Z',
    input: {
      organizationId: ORGANIZATION,
      kind: 'report_generated',
      refId: 'rapport_2026_sl_0417_t3',
      payload: {
        contract: '2026-SL-0417',
        quarter: 'T3 2026',
        period: '2026-07-01/2026-09-30',
        article: '8.4',
        runsInPeriod: 1284,
        methodologyVersion: 'v1.2',
      },
    },
  },
];

/** the refIds every surface cites, so the generator knows what to write out. */
export const CITED_REF_IDS = [
  `run_${RUN_COUNT}`,
  'rapport_2026_sl_0417_t3',
  'declaration_v1',
  'declaration_v2',
  'declaration_v3',
  'override_pr_401',
  'rebaseline_4790',
  'rebaseline_4612',
  'methodology_v1.2',
] as const;

export interface CanonChain {
  entries: readonly LedgerEntry[];
  entryCount: number;
  merkleRoot: string;
  anchoredAt: string;
  verification: Awaited<ReturnType<typeof verify>>;
}

const ANCHORED_AT = '2026-08-15T04:00:00.000Z';

export async function buildCanonChain(): Promise<CanonChain> {
  const planned: Planned[] = [
    ...NARRATIVE,
    ...Array.from({ length: RUN_COUNT - 1 }, (_, index) => runEntry(index + 1)),
    finalRunEntry(),
  ];
  // stable sort by recorded time: the chain is the history, in order
  planned.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));

  const store = createMemoryStore();
  const entries: LedgerEntry[] = [];
  for (const item of planned) {
    entries.push(await append(store, item.input, { now: () => new Date(item.at) }));
  }

  const root = await anchor(store, ORGANIZATION, { now: () => new Date(ANCHORED_AT) });

  return {
    entries,
    entryCount: entries.length,
    merkleRoot: root.root,
    anchoredAt: root.anchoredAt,
    verification: await verify(store, ORGANIZATION),
  };
}
