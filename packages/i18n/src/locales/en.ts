// english catalog: the app chrome language in the current design canon.
// french domain terms stay french, verbatim; they are legal vocabulary,
// not translatable copy. house rule: no em dashes in any string.

export const en = {
  a11y: {
    skipToContent: 'Skip to content',
    evidence: 'Cited responses',
    // tables are drawn as css grids so the columns can be tuned; the role and
    // the name are what a screen reader has instead of the alignment.
    tables: {
      resources: 'Records, {count} of {requests} requests',
      resourcesByType: 'Resources by type',
      comparison: 'Compared metrics',
      budgets: 'Budgets by scope',
      criteria: 'Referential criteria',
      tenderCommitments: 'Proposed commitments',
      observatory: 'Indexed services',
      contractCommitments: 'Contractual commitments',
      checkScenarios: 'Measurements by scenario',
      reportCommitments: 'Commitments and measured state',
      fleet: 'Fleet services',
      nonConformities: 'Non-conforming criteria',
      measuredState: 'Measured state of the service',
    },
    // a sparkline is drawn for the eye and hidden from the screen reader, so
    // the cell holding it says what the line says. the kernel's own words: no
    // direction is claimed, because whether a rise is a regression depends on
    // the metric.
    trend: {
      regression: 'Trend: regression',
      improvement: 'Trend: improvement',
      noSignificantChange: 'Trend: no significant change',
      indeterminate: 'Trend: not enough history',
    },
  },
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
  fingerprint: {
    keys: {
      browser: 'chromium',
      image: 'image',
      throttle: 'throttle',
      viewport: 'viewport',
      locale: 'locale',
      region: 'region',
      coverage: 'coverage',
      models: 'models',
      ledger: 'ledger',
    },
    throttle: '{profile} · {mbps} Mbps · {cpu}x CPU',
    throttleUnthrottled: '{profile} · link not throttled · {cpu}x CPU',
    viewport: '{width} x {height} · dpr {dpr}',
    coverageOn: 'js + css instrumented',
    coverageOff: 'not instrumented',
    // the app bar summarises the service's scenarios, which are not all one
    // environment. it says what they share and names what they do not.
    sharedAcross: '{count} scenarios',
    variesLabel: 'varies',
    variesNote:
      '{fields} differs across the {count} scenarios of this service. Figures from them are not compared to each other.',
    matched: 'Identical to the baseline environment. Comparison permitted without a flag.',
    mismatched:
      '{fields} differs from the baseline environment. Invariant 3 requires an acknowledged flag before these are compared.',
    // bare nouns, so they read in a chip and in a sentence without changing.
    fields: {
      browserBuild: 'browser build',
      imageDigest: 'image digest',
      throttleProfile: 'throttle profile',
      viewportWidth: 'viewport width',
      viewportHeight: 'viewport height',
      deviceScaleFactor: 'device scale factor',
      locale: 'locale',
      timezone: 'timezone',
      region: 'region',
      coverageEnabled: 'coverage',
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
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  carbon: {
    provenance: '{model} · reference · band = {count} models · grid {grid} gCO2e/kWh ({zone})',
    gradeAndScore: '{grade} · {score}/100',
    scoreDerived: 'Rated from page weight, requests and DOM nodes. Not carried in the band: it reads its figure off that rating rather than from energy.',
    scoreDerivedShort: 'read off a rating, not an energy calculation',
    ownValue: 'its own figure: {value} gCO2e',
    gridSensitive: 'applies the measured grid',
    gridBlind: 'fixed intensities, not the measured grid',
    asideTitle: 'REPORTED BESIDE THE BAND',
    bandTitle: 'IN THE BAND',
    // 'green' is banned interface vocabulary; the check is against the
    // green web foundation dataset and the copy names what it establishes.
    hostingChecked: 'renewable-powered hosting, verified {date}',
  },
  confidence: {
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
    highBadge: 'HIGH CONF.',
  },
  metrics: {
    transferred_bytes: 'bytes',
    request_count: 'requests',
    dom_node_count: 'DOM nodes',
    js_execution_ms: 'JS time',
    third_party_bytes: 'third-party bytes',
    third_party_share_pct: 'third-party share',
  },
  verdicts: {
    breach: 'BREACH',
    real: 'REAL',
    noSig: 'NO SIG.',
    noSigFull: 'No significant change',
    warn: 'WARN',
    fail: 'FAIL',
    pass: 'PASS',
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
      internalTarget: 'internal target ≤{value}',
      provenanceReference: '{model} · reference · band = {count} models',
      provenanceMeasured: 'measured · band = median ± MAD',
      thresholdBreached: 'internal target exceeded · not a contractual commitment',
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
  runDetail: {
    title: 'Run {id}',
    coldCache: 'cold cache',
    warmCache: 'warm cache',
    tabs: {
      waterfall: 'Waterfall',
      resources: 'Resources',
      dispersion: 'Dispersion',
      models: 'Models',
      environment: 'Environment',
    },
    waterfallTitle: 'WATERFALL · {requests} REQUESTS · {kb} KB',
    resourceHeader: 'RESOURCE',
    kbHeader: 'KB',
    timeHeader: 'TIME',
    moreRows: '+ {count} more',
    thirdPartyTag: '⟨3p⟩',
    modelsTitle: 'ALL MODEL OUTPUTS · SIDE BY SIDE',
    modelsCaption:
      'Two scales, not one: a model that does not compute the same quantity is not drawn on the same axis. A model that publishes no uncertainty of its own is drawn as a line rather than a band, because an invented width would read as a stated one.',
    dispersionTitle: 'RUN-TO-RUN DISPERSION · N={n}',
    noiseFloorLabel: 'NOISE ±{value} KB',
    noFloorLabel: 'NO FLOOR ESTABLISHED',
    deltaTimesNoise: 'Δ +{delta} KB · {ratio}× noise',
    dispersionCaption:
      'MAD {baseMad} KB on the baseline, {candMad} KB on the candidate. {runs} runs each side, same fingerprint.',
    baselineRow: 'baseline',
    candidateRow: 'candidate',
    resources: {
      byTypeTitle: 'BY TYPE · {requests} REQUESTS · {kb} KB',
      headers: {
        type: 'TYPE',
        requests: 'REQ',
        transferred: 'TRANSFERRED',
        share: 'SHARE',
        resource: 'RESOURCE',
        decoded: 'DECODED',
        unused: 'UNUSED',
        origin: 'ORIGIN',
      },
      types: {
        document: 'document',
        script: 'script',
        stylesheet: 'stylesheet',
        image: 'image',
        font: 'font',
        media: 'media',
        other: 'other',
      },
      recordsTitle: 'RECORDS · {count} OF {requests} REQUESTS',
      firstParty: 'first-party',
      coverageCaption:
        'Unused is decoded bytes never executed, from the coverage capture. It is not a transferred saving: what compression would have done with those bytes is a separate question, and the attribution panel answers it per bundle.',
      unavailableCaption:
        'Decoded size unavailable for {decoded} resources, coverage not captured for {coverage} scripts or stylesheets. Counted as such, never estimated.',
    },
    fingerprintTitle: 'ENVIRONMENT FINGERPRINT',
    plannedPanel:
      'Planned for {version}. Nothing renders here until it can be measured; the other tabs hold the reference views today.',
  },
  comparison: {
    baselineTag: 'BASELINE · {branch}',
    candidateTag: 'CANDIDATE · {branch}',
    fingerprintMatch: 'FINGERPRINT MATCH',
    fingerprintDiffers: 'FINGERPRINTS DIFFER: {fields}',
    headers: {
      metric: 'METRIC',
      baseline: 'BASELINE',
      candidate: 'CANDIDATE',
      delta: 'Δ',
      vsNoise: 'VS NOISE FLOOR',
      verdict: 'VERDICT',
    },
    carbonRow: 'Estimated footprint per visit ({model})',
    lowConf: 'low conf.',
    attributionTitle: 'ATTRIBUTION · RESOLVED THROUGH SOURCE MAPS',
    attributionKeys: {
      bundle: 'bundle',
      dependency: 'dependency',
      module: 'module',
      file: 'file',
      commit: 'commit',
      remainder: 'remainder',
    },
    attributionLead:
      '{bundle} gained {amount} decoded. {share} is {package}, in {count} new modules, introduced by {commit}.',
    attributionLeadNoCommit:
      '{bundle} gained {amount} decoded. {share} is {package}, in {count} new modules. No commit range was configured for this comparison.',
    attributionCoverage:
      '{explained} of {measured} measured is attributed to modules. {remainder} is bundler output no mapping covers, and is reported rather than shared out.',
    thirdPartyTitle: 'THIRD-PARTY DIFF',
    unchanged: 'unchanged',
    newOrigin: 'NEW ORIGIN',
    noSourceMap:
      'Attribution unavailable for {origin}: no source map served. Origin and size are recorded; cause is not inferred.',
  },
  budgets: {
    subtitle: 'Writes back to {file} on {branch} · every edit is a commit',
    thresholdSource: 'Threshold set in balise.yml, line {line}: {text}',
    toggleLabel: 'Budget view',
    toggleVisual: 'Visual',
    toggleYaml: 'YAML',
    headers: {
      scopeMetric: 'SCOPE · METRIC',
      current: 'CURRENT',
      threshold: 'THRESHOLD',
      headroom: 'HEADROOM',
      onBreach: 'ON BREACH',
    },
    relativeNote: 'relative rule · noise-floor gated',
    relativeMetric: 'Δ vs baseline',
    worstOn: 'worst on {scenario}',
    withinNoiseNote: 'inside the noise floor',
    overriddenNote: 'overridden',
    overPast: 'past the budget on',
    notEvaluated: {
      'no-noise-floor': 'no noise floor yet',
      'metric-not-measured': 'not measured',
      'no-baseline': 'no baseline',
      'no-threshold': 'no threshold',
    },
    rebaselineTitle: 'RE-BASELINE HISTORY',
    rebaselineNote:
      'Every re-baseline is written to the ledger. Moving the goalposts is possible and permanently visible.',
    overridesTitle: 'OVERRIDES · {count} ACTIVE',
    overridesNotePrefix: 'Overrides appear verbatim in the',
    overridesNoteSuffix: '. Nobody disables the check quietly.',
    rapportName: "rapport d'exécution",
  },
  prCheck: {
    title: 'The check',
    subtitle: "How Balise appears inside the developer's own tool. Nothing to learn, nothing to open.",
    merge1: 'wants to merge',
    merge2: 'commits into',
    merge3: 'from',
    blockedTitle: 'Merging is blocked',
    blockedBody1: 'One required check failed.',
    blockedBody2: 'is a required status on',
    details: 'Details',
    commented: 'commented',
    measurementLine: 'Measurement · {runs} runs per scenario · fingerprint matched',
    headers: {
      route: 'ROUTE',
      base: 'BASE',
      head: 'HEAD',
      delta: 'Δ',
      vsNoise: 'VS NOISE',
      verdict: 'VERDICT',
    },
    attributionHeading: 'Attribution',
    fixLabel: 'Fix:',
    provenanceMethodology: 'Methodology',
    provenanceModels: 'models',
    provenanceRun: 'run',
    provenanceLedger: 'ledger',
    overrideLink: 'override this check',
    overrideNote: '(reason required, appears in the execution report)',
    toggleLabel: 'Comment view',
    toggleRendered: 'Rendered',
    toggleMarkdown: 'Markdown',
    artifactNote:
      'The check posts this text as it stands. It is built from the same assessments as the rendered view, never written by hand.',
    annotationTitle: 'INLINE ANNOTATION · {file}',
  },
  /**
   * the check run itself: the one line beside its name, the markdown it posts,
   * and the annotations it attaches. the screen renders the same strings, so
   * the mock and the artifact cannot say different things.
   */
  checkRun: {
    statusBreachOne: '1 budget over its limit',
    statusBreachMany: '{count} budgets over their limits',
    statusRegressionOne: '1 significant regression',
    statusRegressionMany: '{count} significant regressions',
    statusClean: 'every budget held',
    statusUndecided: '{count} not evaluated',

    summaryBlockedOne: 'Merging is blocked by 1 budget over its limit.',
    summaryBlockedMany: 'Merging is blocked by {count} budgets over their limits.',
    summaryNeutral: 'Nothing blocks the merge. What follows is reported.',
    summaryClean: 'Every budget held on the scenarios measured.',
    summaryBlockingItem: '`{scope}` · {metric}: {observed} against a limit of {threshold}, {headroom}.',
    summaryOverriddenItem:
      '`{scope}` · {metric}: over its limit, covered by an override from {by} recorded on {date}. The breach is still counted.',
    summaryUndecidedOne: '1 rule was not evaluated.',
    summaryUndecidedMany: '{count} rules were not evaluated.',
    noiseRule:
      'A budget is checked only on a scenario whose noise floor is established, and a delta below the floor is not a change. No check fails on noise.',

    measurementHeading: 'Measurement',
    measurementLine: '{runs} runs per scenario · profiles {profiles} · median ± MAD, never a mean',
    fingerprintMatched: 'fingerprint identical on both sides',
    fingerprintDiffers: 'fingerprints differ: the comparison is flagged, not silent',
    tableScenario: 'Scenario',
    tableBase: 'Base',
    tableHead: 'Head',
    tableDelta: 'Δ',
    tableFloor: 'Floor',
    tableVerdict: 'Verdict',
    noBaseline: 'no baseline',
    verdictRegression: 'regression',
    verdictImprovement: 'improvement',
    verdictNoSig: 'no significant change',
    verdictIndeterminate: 'not enough history',

    budgetsHeading: 'Budgets',
    tableScopeMetric: 'Scope · metric',
    tableMeasured: 'Measured',
    tableThreshold: 'Limit',
    tableHeadroom: 'Headroom',
    tableStatus: 'Status',
    relativeMetric: 'Δ vs baseline',
    statusLabels: {
      conforme: 'conforme',
      warn: 'warn',
      breach: 'breach',
      non_evalue: 'not evaluated',
    },
    notEvaluated: {
      'no-noise-floor': 'noise floor not established yet, the budget is not active',
      'metric-not-measured': 'metric not measured on this scenario',
      'no-baseline': 'no baseline to compare against',
      'no-threshold': 'no limit written for this rule',
    },
    withinNoiseTag: 'on the line, inside the floor',
    overriddenTag: 'overridden',

    attributionHeading: 'Attribution',
    attributionAdvisory: 'Attribution explains a breach. It never decides one.',
    sourceGrowthLine: 'Repository files the candidate build makes heavier:',
    sourceGrowthItem: '`{path}`, lines {first} to {last}: {bytes}',
    sourceGrowthCaveat:
      'The lines are the ones the candidate build takes from the file. No position is compared between two versions of a file.',

    provenanceHeading: 'Provenance',
    provenanceMethodology: 'Methodology {version}',
    provenanceModels: 'Models: {models}',
    provenanceRun: 'Run {run}',
    provenanceLedger: 'Ledger {hash}: {url}',
    provenanceConfig: 'Budgets read from {file}',
    overrideHowTo:
      'Overriding this check requires a reason, which is written to the ledger and appears in the execution report.',

    annotationWorstOn: '(worst on {scenario})',
    annotationBreachTitle: 'Budget over its limit',
    annotationWarnTitle: 'Budget in warning',
    annotationOverriddenTitle: 'Breach covered by an override',
    annotationUndecidedTitle: 'Budget not evaluated',
    annotationBody: '{scope} · {metric}: {observed} against a limit of {threshold} ({headroom}).',
    annotationOverriddenBody:
      '{scope} · {metric}: {observed} against a limit of {threshold}. Override by {by}, reason: {reason}',
    annotationUndecidedBody: '{scope} · {metric}: {reason}',
    annotationSourceTitle: 'Module grown',
    annotationSourceBody:
      '{bytes} on this file, {total} in the candidate build. The bundle takes lines {first} to {last} of it.',
    annotationsOmitted: '{count} annotations were not sent: the limit is {limit} per request.',
  },
  criteria: {
    subtitle: 'Pack {pack} · {criteria} criteria · {families} families · assessment pinned to this pack version',
    summary: {
      conforme: 'CONFORME',
      partiel: 'PARTIEL',
      nonConf: 'NON CONF.',
      na: 'N/A',
      taux: 'TAUX ({done}/{total})',
    },
    tiers: {
      automatedDesc: 'Machine-verifiable. Re-evaluated on every run.',
      assistedDesc: 'Evidence gathered, answer proposed, human confirms.',
      declarativeDesc: 'Human attestation, artifact and named person required.',
      proposed: 'PROPOSED',
      answeredBy: '{answered} of {total} answered',
    },
    // the pack ships its tier split as a proposal. saying so is the whole
    // point of the split: an answer a person wrote is not an automated one.
    signOff: {
      title: 'Tier split not signed off',
      body:
        'The {pack} pack proposes {automated} automated, {assisted} assisted and {declarative} declarative. Until that is reviewed no criterion is answered from measurement, and {withEvaluation} of {criteria} carries an evaluation rule this engine can run.',
      sourceMeasured: '{count} answered from measurement',
      sourceAttested: '{count} attested by a named person',
      sourceUnevaluated: '{count} not looked at',
    },
    filter: {
      tier: 'TIER',
      all: 'All {count}',
      automated: 'Automated {count}',
      assisted: 'Assisted {count}',
      declarative: 'Declarative {count}',
      shown: '{count} shown',
    },
    headers: {
      id: 'ID',
      criterion: 'CRITERION',
      family: 'FAMILY',
      tier: 'TIER',
      status: 'STATUS',
      evidence: 'EVIDENCE',
      verified: 'VERIFIED',
    },
    // statuses follow the official rgesn grid verbatim; they are legal
    // vocabulary and stay french in every locale.
    statuses: {
      conforme: 'Conforme',
      partiellement: 'Partiellement',
      nonConforme: 'Non conforme',
      nonEvalue: 'Non évalué',
      nonApplicable: 'Non applicable',
    },
    footnote:
      'Every criterion in the pack, in its order. Anything not conforme requires justification text before the declaration can publish.',
    attestedOn: '{who} · {date}',
    notLookedAt: 'not looked at',
  },
  declaration: {
    blockingReasons: {
      'missing-justification': 'Status with no justification text',
      'unassessed-criterion': 'Criterion not assessed',
      'unconfirmed-proposal': 'Proposed answer awaiting confirmation',
      'missing-evidence': 'Required evidence not attached',
    },
    subtitle: 'Draft {draft} · last published {published} on {publishedDate} · next review due {reviewDate}',
    diffVs: 'Diff vs {version}',
    previewPage: 'Preview page',
    publishBlocked: 'Publish · blocked',
    blockingTitle: 'BLOCKING · {count}',
    knownGapsTitle: 'KNOWN GAPS · REQUIRED SECTION',
    knownGapsNote:
      'The template will not let you publish an empty gaps section. A declaration claiming 100% conformity reads as unverified.',
    versionHistoryTitle: 'VERSION HISTORY',
    draftTag: 'DRAFT',
    conformeCount: '{count} conforme',
    ledgerRef: 'ledger {hash}',
    livePreviewTitle: 'LIVE PREVIEW · PUBLISHED PAGE',
    footerBadge: 'FOOTER BADGE · reachable from every page',
    // the preview is the published declaration itself: a french legal
    // document, rendered in french in every locale.
    preview: {
      heading: "Déclaration d'écoconception",
      meta: '{service} · établie le {date} · référentiel {referential}',
      taux: 'TAUX DE CONFORMITÉ',
      conformes: 'CRITÈRES CONFORMES',
      nonConformes: 'NON CONFORMES',
      familyTitle: 'CONFORMITÉ PAR FAMILLE',
      hosting:
        "Hébergement : {host} · électricité d'origine renouvelable vérifiée le {date}. Mesures produites par la méthodologie Balise {version}, vérifiables à l'adresse",
      badgeName: 'Écoconception',
    },
  },
  engagements: {
    perYear: '{count} / year',
    notSigned: 'proposed, not taken',
    status: {
      tenu: 'held',
      enCours: 'in progress',
      nonTenu: 'not held',
    },
    margins: {
      headroom: '{pct}% headroom',
      stretch: 'stretch · +{points} pt to close',
      notMet: 'over by {points} pt today',
      process: 'process',
    },
    trendPeriods: '{count} aggregations',
    noHistory: 'no history',
    signedNote:
      'The table carries only signed engagements. One that was proposed and not taken is not an obligation, and is never reported as not held.',
  },
  tender: {
    remiseDesOffres: 'REMISE DES OFFRES',
    // the first column is the checkbox saying whether the commitment is in the
    // offer. the mark is decorative, so the column and the cell are named.
    inOffer: 'Included in the offer',
    notInOffer: 'Not included in the offer',
    daysVia: '{days} days · via {platform}',
    stepDone: 'DONE',
    stepCurrent: 'CURRENT',
    steps: {
      reference: 'Tender reference',
      scope: 'Scope & scenarios',
      commitments: 'Commitments',
      narrative: 'Narrative',
      export: 'Export',
    },
    commitmentsTitle: 'PROPOSED COMMITMENTS · DRAWN FROM MEASURED BASELINE',
    commitmentsCaption:
      'Thresholds are your own measured values plus a stated margin, so every commitment is achievable on the day it is signed.',
    headers: {
      inOffer: 'INCLUDED',
      commitment: 'COMMITMENT',
      measured: 'MEASURED',
      proposed: 'PROPOSED',
      margin: 'MARGIN',
    },
    margins: {
      headroom: '+{pct}% headroom',
      stretch: 'stretch · +{points} pt',
      notMet: 'not met today',
      process: 'process',
    },
    warningStrong: 'Third-party share left unchecked.',
    warningBody:
      'You are {points} points from the threshold today. Committing to it would put the contract at risk from month one; the narrative instead states a remediation plan with a dated milestone.',
    historyTitle: 'MEASURED HISTORY · THE PART NOBODY CAN FAKE',
    historySince: 'Continuous measurement since',
    historyCounts: '{days} days, {runs} runs, {versions} published declaration versions.',
    conformityCounts: 'Conforming criteria per published version, out of {total} in the referential. {versions} versions, the latest still a draft.',
    historyCaption: 'A competitor bidding this contract can promise the same numbers. They cannot produce this line.',
    outputTitle: 'OUTPUT',
    outputKeys: {
      branding: 'branding',
      format: 'format',
      figures: 'figures',
      verification: 'verification',
      editable: 'editable',
    },
    outputFormat: 'PDF/A-3 · Typst · {pages} pages',
    outputFigures: '{count} tolerance bands, greyscale-safe',
    outputEditable: 'yes · before export',
    openAnnex: 'Open the annex',
  },
  contract: {
    deliveredOf: '{delivered} of {total} delivered',
    noHistory: 'no history',
    earlyWarning: {
      rate: 'Conformity is at {current}%, against a {target}% target at the {months}-month review.',
      ceiling:
        'Answering the {unanswered} criteria nobody has looked at, every one of them conforme, reaches {ceiling}%.',
      short:
        'The target needs {needed} conforme out of {applicable}, which is {short} more than answering the open criteria can give. That gap is in criteria that are answered and not conforme.',
      reached: 'The target is within what answering the open criteria can reach.',
      noExtrapolation: 'No rate of change is drawn from this. A conformity trend needs history the ledger does not hold yet.',
    },
    subtitle: 'Marché {ref} · notifié {date} · {months} months · clause environnementale art. {article}',
    generateReport: 'Generate {quarter} report',
    headers: {
      engagement: 'ENGAGEMENT CONTRACTUEL',
      seuil: 'SEUIL',
      actuel: 'ACTUEL',
      headroom: 'HEADROOM',
      trend: 'TREND 90 D',
      status: 'STATUS',
    },
    statuses: {
      tenu: 'TENU',
      atRisk: 'AT RISK',
      aJour: 'À JOUR',
    },
    ptToGo: '{points} pt to go',
    earlyWarningTitle: 'EARLY WARNING',
    openCriteria: 'Open the {count} criteria',
    calendarTitle: 'CONTRACT CALENDAR',
    daysShort: '{days} d',
    quarterShort: 'Q{n}',
    calendar: {
      report: 'Execution report {quarter}',
      declarationReview: 'Annual review · declaration',
      contractReview: 'Contract review, {months} months',
      termEnd: 'End of contract · renewal',
    },
  },
  fleet: {
    subtitle: '{agency} · {services} services under measurement · {contracts} active contracts · {tenders} open tender',
    summary: {
      breaches: 'BREACHES',
      staleDecl: 'STALE DECL.',
      deadlines: 'DEADLINES 30 D',
    },
    headers: {
      service: 'SERVICE',
      carbonVisit: 'FOOTPRINT / VISIT',
      conf: 'CONF.',
      rgesn: 'RGESN',
      declaration: 'DECLARATION',
      contract: 'CONTRACT',
      alert: 'ALERT',
    },
    measuredNote:
      'One home page per service, cold cache, {profile} profile, median of five runs. Measuring the rows identically is what makes the shared scale readable.',
    rgesnSource: {
      assessed: 'assessed by the engine over all 78 criteria of the referential',
      recorded: 'rate reported by the client, not assessed here',
    },
    rgesnNote:
      'One RGESN rate here is assessed: the audited service, answered by the criteria engine over all 78 criteria of the referential. The others are what each client reported, carried as given and marked as such.',
    declarationNone: 'none',
    declarationCell: 'v{version} · {days} d',
    alerts: {
      none: 'none',
      budget: 'budget breached',
      declarationMissing: 'no declaration',
      declarationExpired: 'declaration expired · {days} d',
      declarationDue: 'declaration due · {days} d',
      thirdParty: 'third parties · {share} of weight',
      noFloor: 'no noise floor',
    },
    benchmarkTitle: 'CORPUS DISTRIBUTION · MEASURED PAGE WEIGHT',
    benchmarkCaption:
      '{n} measured services. {domain} is {rank} of {n}. A position in this corpus, not a percentile: {n} services are not a national distribution.',
    medianLabel: 'median {value}',
    clientAccessTitle: 'CLIENT ACCESS',
    clientAccessBody:
      'Each client sees only their own service, in your branding, with your commentary. No cross-client data, no Balise chrome.',
    viewerService: 'viewer · {count} service',
    invitationsPending: '{count} invitations pending',
  },
  docs: {
    register: 'Document register',
    publishedPage: 'published page',
    backToEditor: 'Back to editor',
    backToWorkspace: 'Back to workspace',
    backToTracker: 'Back to tracker',
    exportPdf: 'Export PDF/A-3',
    anchorSend: 'Anchor & send',
    draft: '{version} draft',
  },
  // the three documents are french legal artifacts; their content renders in
  // french in every locale, like the declaration preview.
  docDeclaration: {
    // the document is french in both locales: it is what the customer publishes.
    justificationMissing: "Aucun texte de justification. La déclaration ne peut pas être publiée en l'état.",
    intro1: "Cette déclaration s'applique au",
    intro2:
      "({domain}). Elle est établie au regard du référentiel général d'écoconception de services numériques, version 2 (2024), et sera revue au plus tard le {reviewDate}.",
    stats: {
      taux: 'TAUX DE CONFORMITÉ',
      tauxSub: '{conformes} conformes / {applicables} applicables',
      partiels: 'PARTIELLEMENT CONFORMES',
      partielsSub: 'justification fournie',
      nonConformes: 'NON CONFORMES',
      nonConformesSub: 'détaillés ci-dessous',
    },
    nonConformesTitle: 'Critères non conformes',
    headers: { id: 'N°', criterion: 'CRITÈRE', justification: 'JUSTIFICATION' },
    hostingTitle: 'Hébergement et mesure',
    hostingBody:
      "Hébergement Scaleway, centre de données DC5 (Paris). Électricité d'origine renouvelable vérifiée auprès du jeu de données Green Web Foundation le {verifiedDate}. Les indicateurs sont mesurés en continu depuis le {since} selon la méthodologie Balise {methodology}, publiée et versionnée. Chaque relevé est horodaté et chaîné : l'ensemble est vérifiable sans compte à l'adresse ci-dessous.",
    hashLabel: 'EMPREINTE DE CETTE VERSION',
    verificationLabel: 'VÉRIFICATION PUBLIQUE',
    footer:
      'Déclaration établie le {date} par la Direction du numérique · contact {contact} · version 3, remplaçant la version 2 du 12 mars 2026.',
  },
  docAnnexe: {
    memoire: 'MÉMOIRE TECHNIQUE',
    annexeLine: 'ANNEXE 4 · ENVIRONNEMENT',
    consultation: 'CONSULTATION {ref}',
    title: 'Performance environnementale du service',
    lede:
      "{title} · {organisation}. Mesures continues, méthodologie publiée, engagements chiffrés et vérifiables par l'acheteur.",
    stats: {
      since: 'MESURE CONTINUE DEPUIS',
      runs: 'RELEVÉS HORODATÉS',
      conformity: 'CONFORMITÉ RGESN',
      commitments: 'ENGAGEMENTS CHIFFRÉS',
    },
    docHashLabel: 'EMPREINTE DU DOCUMENT',
    runningRight: 'ANNEXE 4 · {page}/{pages}',
    section2Title: '2. État mesuré du service existant',
    section2Body:
      "Les valeurs ci-dessous sont les médianes de cinq exécutions par scénario, réalisées sur un navigateur épinglé et un profil de bridage documenté. Chaque estimation carbone est présentée sous forme d'étendue inter-modèles, le modèle de référence étant indiqué. Aucune valeur n'est lissée.",
    figLabel: "FIG. 3 · EMPREINTE ESTIMÉE PAR VISITE · PAGE D'ACCUEIL",
    // filled from the models that actually ran. a caption naming a model the
    // build does not carry is the kind of thing an auditor checks first.
    figCaption:
      'Hachures : étendue inter-modèles ({band}). Pointillé : plancher de bruit du scénario, ±{floor} d\'octets transférés, porté dans le modèle. Trait plein : médiane, modèle de référence {reference}.',
    figCaptionAside:
      "Hors bande, {model} publie {headline} et {value} gCO2e pour la même page : sa valeur est lue sur une note et non calculée à partir de l'énergie du transfert.",
    headers: { indicator: 'INDICATEUR', median: 'MÉDIANE', mad: 'MAD', confidence: 'CONFIANCE' },
    confHigh: 'Élevée',
    confMedium: 'Moyenne △',
    ecartsStrong: 'Écarts connus.',
    hashLabel: 'EMPREINTE',
  },
  docRapport: {
    marcheRef: 'marché {ref}',
    holder: 'titulaire du marché {ref}',
    headRight1: "RAPPORT D'EXÉCUTION · {quarter}",
    headRight2: 'PÉRIODE {period}',
    headRight3: 'CLAUSE ENVIRONNEMENTALE ART. {article}',
    title: 'Suivi des engagements environnementaux',
    intro:
      'Établi à partir de {runs} relevés horodatés sur la période. Les valeurs sont des médianes de cinq exécutions ; les écarts inférieurs au plancher de bruit sont déclarés sans évolution significative.',
    headers: { engagement: 'ENGAGEMENT', seuil: 'SEUIL', periode: '{quarter}', marge: 'MARGE', etat: 'ÉTAT' },
    etats: { tenu: 'TENU', enCours: 'EN COURS', nonTenu: 'NON TENU' },
    eventsTitle: 'Événements de la période',
    calloutStrong: 'Cible interne dépassée : part des tiers. Cet engagement a été proposé et non retenu au marché.',
    hashLabel: 'EMPREINTE DU RAPPORT',
  },
  // the public surfaces are french public pages, like the three documents:
  // their content renders in french in every locale. only the app chrome
  // around them (nav rail labels) follows the interface locale.
  findings: {
    title: '{count} findings',
    titleOne: '1 finding',
    none: 'Nothing above the published thresholds.',
    note: 'Every line is a quantity measured on this page. No saving is projected.',
    sentences: {
      'image-weight': 'Images: {count} requests, {share} of the page weight.',
      'font-weight': 'Fonts: {count} files, {share} of the page weight.',
      'third-party-weight': 'Third parties: {count} distinct origins, {share} of the page weight.',
      'heaviest-resource': 'One response carries {share} of the page weight.',
      'unused-script-bytes':
        'Scripts: {share} of the decoded bytes measured were not executed during the load.',
      'unused-stylesheet-bytes':
        'Stylesheets: {share} of the decoded bytes measured were not applied during the load.',
      'reference-dom-node-count':
        'DOM nodes: past {percentile} of the pages in the reference distribution EcoIndex publishes.',
      'reference-request-count':
        'Requests: past {percentile} of the pages in the reference distribution EcoIndex publishes.',
      'reference-transferred-bytes':
        'Page weight: past {percentile} of the pages in the reference distribution EcoIndex publishes.',
    },
    unavailable: '{count} files carry no coverage measurement and are not counted in this total.',
    withheldTitle: 'Not measured on this run',
    withheld: {
      'unused-script-bytes':
        'Unexecuted script bytes: coverage not instrumented, {count} files. It moves script execution time and is off by default.',
      'unused-stylesheet-bytes':
        'Unapplied stylesheet bytes: coverage not instrumented, {count} files.',
      'image-weight': 'Images: not measured on this run.',
      'font-weight': 'Fonts: not measured on this run.',
      'third-party-weight': 'Third parties: not measured on this run.',
      'heaviest-resource': 'Heaviest response: not measured on this run.',
      'reference-dom-node-count': 'DOM nodes: no reference position.',
      'reference-request-count': 'Requests: no reference position.',
      'reference-transferred-bytes': 'Page weight: no reference position.',
    },
  },
  publicScan: {
    navObservatory: 'Observatoire',
    navMethodology: 'Méthodologie',
    navPricing: 'Tarifs',
    title: 'Mesurez une page. Sans compte.',
    // the lede has to describe what this surface actually does. it measured one
    // cold pass, so it does not promise five, and the model count is filled
    // from the models that ran rather than typed.
    lede:
      "Un relevé à froid, {count} modèles d'estimation, méthodologie publiée. Le résultat indique aussi si le service publie une déclaration d'écoconception.",
    fieldLabel: 'Adresse du service à mesurer',
    submit: 'Mesurer',
    gradeLabel: 'ECOINDEX',
    gradeScore: '{score}/100',
    bandLabel: 'EMPREINTE PAR VISITE · ÉTENDUE INTER-MODÈLES',
    confidenceNote: 'CONFIANCE {grade}',
    // the grade word, in french on both catalogs like the rest of this
    // surface. `t.confidence` is interface vocabulary and would print
    // english here the moment the app locale changed.
    confidenceGrade: { high: 'ÉLEVÉE', medium: 'MOYENNE', low: 'FAIBLE' },
    // the public surfaces are french in both locales.
    provenance: 'médiane {model} · étendue sur {count} modèles · réseau {grid} gCO2e/kWh ({zone})',
    provenanceNoFloor: 'un seul relevé à froid : aucun plancher de bruit établi, aucune tendance affichée',
    declarationTitle: "Déclaration d'écoconception",
    declarationNone: 'Aucune déclaration trouvée',
    declarationBody:
      "Ce service relève d'un EPCI de plus de 50 000 habitants : la publication d'une déclaration est attendue. Nous avons cherché aux emplacements usuels et dans le pied de page.",
    follow: 'Suivre ce service en continu',
    captionBefore: 'Mesure unique, cache froid, profil ',
    captionAfter:
      ", une seule page. Un suivi continu produit des médianes sur cinq exécutions, un plancher de bruit propre au service et un historique horodaté : ce qu'une mesure ponctuelle ne peut pas fournir.",
    noRecordTitle: 'Aucune mesure prise pour ce domaine',
    noRecordBody:
      "Cette page affiche les relevés déjà enregistrés. Elle ne déclenche pas de mesure en direct et n'estime rien à partir d'un nom de domaine.",
    noRecordAction: 'Voir un service mesuré',
  },
  observatory: {
    path: '/observatoire',
    navScan: 'Mesurer une page',
    navMethodology: 'Méthodologie',
    title: 'Observatoire des services numériques publics',
    introBefore:
      "{count} services mesurés · une page d'accueil par service · relevés du {date} · registre public. Les valeurs sont des médianes de cinq exécutions sur profil ",
    introAfter: ", cache froid. Méthodologie identique pour tous, et le corpus est celui qui a été mesuré : aucun rang ci-dessous ne compte contre autre chose.",
    filtersLabel: 'FILTRES',
    sectors: {
      epci: 'Métropoles & EPCI',
      communes: 'Communes',
      etat: 'État',
      sante: 'Santé',
      transport: 'Transport',
    },
    withoutDeclaration: 'Sans déclaration · {count}',
    headers: {
      rank: '#',
      service: 'SERVICE',
      organisme: 'ORGANISME',
      footprint: 'EMPREINTE / VISITE',
      grade: 'NOTE',
      kb: 'KB',
      trend: 'TEND. 90J',
      hosting: 'HÉBERG.',
      declaration: 'DÉCLARATION',
      agency: 'AGENCE',
    },
    hosting: {
      verified: 'vert',
      standard: 'standard',
      unchecked: 'non vérifié',
    },
    trendNa: 'n/a',
    trendFlat: 'non sig.',
    declarationNone: 'aucune',
    declarationCell: 'v{version} · {days} j',
    noAgency: '–',
    footer:
      'Classement par poids de page transféré, croissant, qui est une quantité mesurée : les bandes se chevauchent et ne rangeraient pas ces services. Chaque ligne a un permalien et un historique public.',
    footerModel:
      'Bandes : étendue inter-modèles sur {models} modèles, médiane au modèle de référence {model}. Méthodologie {methodology}.',
    footerHosting:
      "Hébergement vérifié auprès de la Green Web Foundation pour {verified} services sur {total} ; {unchecked} n'ont jamais été vérifiés et leur estimation ne porte aucun crédit d'hébergement.",
    footerTrend:
      "La tendance compare deux mesures à quatre-vingt-dix jours d'écart, lues contre le plancher de bruit du scénario. Sous le plancher, aucun mouvement n'est une évolution.",
    filteredFooter: '{shown} services sur {total} correspondent au filtre.',
    emptyTitle: 'Aucun service ne correspond',
    emptyBody:
      'Le registre compte {total} services mesurés. Retirez le filtre pour les voir tous.',
    emptyAction: 'Retirer le filtre',
  },
  ledger: {
    chrome: '/v/{hash} · vérification publique · aucun compte requis',
    eyebrow: 'ENREGISTREMENT VÉRIFIÉ',
    intact: 'Chaîne intacte',
    checkedNow: "contrôlé à l'instant",
    checkedCount: '{count} entrées vérifiées',
    positionValue: 'entrée {position}',
    merkleValue: 'racine {root} sur {leaves} entrées · ancrée le 15/08/2026 04:00 UTC',
    keys: {
      hash: 'EMPREINTE',
      type: 'TYPE',
      recordedAt: 'ENREGISTRÉ LE',
      service: 'SERVICE',
      methodology: 'MÉTHODOLOGIE',
      models: 'MODÈLES',
      fingerprint: 'EMPREINTE ENV.',
      position: 'POSITION',
      merkle: 'RACINE MERKLE',
    },
    appendOnly:
      "Cet enregistrement est en lecture seule. Une correction ne remplace jamais une entrée : elle est ajoutée à la suite, avec son motif. Les mesures déclarées pour une période donnée ne peuvent donc pas être réécrites après coup.",
    recordedValues:
      'Valeurs consignées : {transferred} KB transférés (MAD {mad}), {requests} requêtes, {dom} nœuds DOM, {carbon} gCO₂e par visite selon {model} · étendue inter-modèles {low} à {high}. Confiance élevée, cinq exécutions.',
    notFoundEyebrow: 'EMPREINTE INCONNUE',
    notFoundTitle: 'Aucune entrée pour cette empreinte',
    notFoundBody:
      "Cette empreinte ne correspond à aucune entrée du registre public. Chaque document généré reproduit son empreinte intégrale en pied de page : vérifiez la valeur relevée, y compris ses derniers caractères.",
    notFoundQueried: 'EMPREINTE RECHERCHÉE',
    notFoundAction: 'Voir un enregistrement vérifié',
  },
  placeholder: {
    eyebrow: 'PLANNED',
    body: 'Planned for {version}. Nothing renders here until it can be measured; invented numbers would defeat the point.',
    reference: 'The design reference for this surface is final.',
  },
} as const;

type Catalogify<T> = { [K in keyof T]: T[K] extends string ? string : Catalogify<T[K]> };
export type Catalog = Catalogify<typeof en>;
