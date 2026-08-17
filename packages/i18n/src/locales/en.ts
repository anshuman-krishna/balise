// English catalog: the app chrome language in the current design canon.
// French domain terms stay French, verbatim; they are legal vocabulary,
// not translatable copy. House rule: no em dashes in any string.

export const en = {
  nav: {
    groups: {
      instrument: 'The instrument',
      check: 'The check',
      documents: 'The documents',
      publicSurfaces: 'Public surfaces',
    },
    items: {
      dashboard: 'Dashboard',
      runDetail: 'Run detail',
      comparison: 'Comparison',
      budgets: 'Budgets',
      criteria: 'Criteria workspace',
      declarationEditor: 'Declaration editor',
      tenderWorkspace: 'Tender workspace',
      contractTracker: 'Contract tracker',
      fleet: 'Fleet',
      prCheck: 'Pull request check',
      docDeclaration: "Déclaration d'écoconception",
      docAnnexe: 'Annexe environnementale',
      docRapport: "Rapport d'exécution",
      freeScan: 'Free scan',
      observatory: 'Observatory',
      ledgerVerification: 'Ledger verification',
    },
  },
  appBar: {
    branch: 'branch',
    lastRun: 'last run',
    fingerprintLabel: 'FINGERPRINT',
    methodology: 'METHODOLOGY',
    declarationDue: 'DÉCLARATION DUE IN {days} D',
    minutesAgo: '{minutes} min ago',
  },
  confidence: {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    highBadge: 'HIGH CONF.',
  },
  verdicts: {
    breach: 'BREACH',
    real: 'REAL',
    noSig: 'NO SIG.',
    noSigFull: 'No significant change',
    warn: 'WARN',
    fail: 'FAIL',
    indeterminate: 'NOT ENOUGH HISTORY',
  },
  dashboard: {
    scopeLine: 'RGESN scope unit · {scenarios} scenarios · {journeys} journeys',
    continuousSince: 'Continuous since {date} · {runs} runs retained',
    tiles: {
      carbonPerVisit: 'CARBON / VISIT',
      transferred: 'TRANSFERRED',
      thirdPartyShare: 'THIRD-PARTY SHARE',
      domNodes: 'DOM NODES',
      carbonUnit: 'gCO₂e',
      kbUnit: 'KB',
      nodesUnit: 'nodes',
      pctOfBytes: '% of bytes',
      acrossModels: 'across {count} models',
      madShort: 'MAD {value}',
      commitCeiling: 'commit ≤{value}',
      provenanceReference: '{model} · reference · band = {count} models',
      provenanceMeasured: 'measured · band = median ± MAD',
      thresholdBreached: 'contractual threshold breached',
      dispersionHigh: 'dispersion high · {varied} of {total} runs varied',
    },
    trend: {
      title: 'TRANSFERRED BYTES · 30 DAYS · DEPLOY MARKERS',
      journeyLabel: 'journey: {journey}',
      medianMad: 'median · MAD {mad}',
      budgetLabel: 'BUDGET {value} KB',
    },
    regressions: {
      title: 'OPEN REGRESSIONS',
      gained: 'gained',
      openComparison: 'Open comparison',
      addToBacklog: 'Add to backlog',
    },
    completeness: {
      title: 'DECLARATION COMPLETENESS',
      automated: 'AUTOMATED',
      assisted: 'ASSISTED',
      declarative: 'DECLARATIVE',
      declarativeNote:
        '{count} declarative criteria still need a named responsible person and an uploaded artifact.',
    },
    deadline: {
      title: 'NEXT CONTRACTUAL DEADLINE',
      detail: 'Q3 rapport d’exécution · marché {contract} · {days} days',
      previewReport: 'Preview report',
    },
  },
  placeholder: {
    eyebrow: 'PLANNED',
    body: 'Planned for {version}. Nothing renders here until it can be measured; invented numbers would defeat the point.',
    reference: 'The design reference for this surface is final.',
  },
} as const;

type Catalogify<T> = { [K in keyof T]: T[K] extends string ? string : Catalogify<T[K]> };
export type Catalog = Catalogify<typeof en>;
