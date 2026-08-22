import { OrganizationId, type LedgerEntry, type LedgerEntryInput } from '@balise/schemas';
import { anchor, append, createMemoryStore, verify } from '@balise/ledger';
import { buildCarbonCanon } from './carbon-canon-source';
import { canonMetric } from './measurement-canon-source';
import { buildCriteriaCanon } from './criteria-canon-source';

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

// a declaration version is recorded on the day it is established, carrying the
// conformity the engine reads for that day's evidence. one source for the date,
// one for the count, and the editor's history reads them back from here.
const DECLARATION_ENTRIES = buildCriteriaCanon().versions.map((version) => ({
  at: version.establishedAt,
  input: {
    organizationId: ORGANIZATION,
    kind: 'declaration_version' as const,
    refId: `declaration_${version.tag}`,
    payload: {
      version: version.tag,
      packVersion: 'rgesn-2024-v2',
      conforme: version.conforme,
      applicable: version.applicable,
    },
  },
}));

// the estimate the register records is the one the models produced for the
// same page, read from the same build. a verification permalink that stated a
// different figure than the run detail would be worth nothing.
const CARBON = buildCarbonCanon();
const RUN_PAGE = (() => {
  // run #4812 is the candidate on /demarches/acte-naissance: the run the run
  // detail shows and the pull request check reports on. the register records
  // that run's own figures, not the service median's.
  const page = CARBON.pages.find((candidate) => candidate.id === 'candidate');
  if (page === undefined) throw new Error('the carbon canon holds no page for the retained run');
  return page;
})();

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
        scenario: '/demarches/acte-naissance',
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
        models: CARBON.assumptions.map((model) => `${model.id}@${model.version}`),
        metrics: {
          transferredBytes: canonMetric('candidate', 'transferred_bytes').median,
          transferredBytesMad: canonMetric('candidate', 'transferred_bytes').mad,
          requestCount: canonMetric('candidate', 'request_count').median,
          domNodeCount: canonMetric('candidate', 'dom_node_count').median,
          carbonPerVisitG: RUN_PAGE.band.reference,
          carbonBandLowG: RUN_PAGE.band.low,
          carbonBandHighG: RUN_PAGE.band.high,
        },
        confidence: canonMetric('candidate', 'transferred_bytes').confidence,
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
  // the three declaration versions, from the same place the editor's history
  // reads: a version's conformity count is the engine's verdict on the answers
  // that version could have held. the register used to carry `conforme: 28` on
  // version 1 while the engine, asked the same question, says 26.
  ...DECLARATION_ENTRIES,
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
  /**
   * how many runs the register retains, and when the first and last of them
   * were recorded. the dashboard and the tender both state "continuous
   * measurement since X, N runs", and both used to state it from a fixture
   * beside the register that actually holds the runs.
   */
  runs: { count: number; firstAt: string; lastAt: string };
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

  const runs = entries.filter((entry) => entry.kind === 'run');
  if (runs.length === 0) throw new Error('a register with no run retains no measurement');

  return {
    entries,
    entryCount: entries.length,
    merkleRoot: root.root,
    anchoredAt: root.anchoredAt,
    verification: await verify(store, ORGANIZATION),
    runs: {
      count: runs.length,
      firstAt: runs[0]!.createdAt,
      lastAt: runs.at(-1)!.createdAt,
    },
  };
}
