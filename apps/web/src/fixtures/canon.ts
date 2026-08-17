// The scenario canon: one internally consistent fictional dataset, from the
// design handoff. None of it is measured. It exists so every screen tells the
// same story until the runner (V1) and the API (V2) replace it with real data.
// Keep the cross-screen arithmetic consistent; see testing/CLAUDE-2.md
// section 14.

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
