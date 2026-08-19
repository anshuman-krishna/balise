import { describe, expect, it } from 'vitest';
import { CheckRunOutput, type BudgetConfig, type BudgetOverride } from '@balise/schemas';
import { catalogs } from '@balise/i18n';
import {
  buildCheckRun,
  checkAnnotations,
  checkTitle,
  evaluateBudgets,
  measurementRows,
  outcomesByRule,
  readConfig,
  summariseCheck,
  type CheckReportInput,
  type ScenarioMeasurement,
} from '../src/index.js';
import { aggregate, floor, metric, noFloor, route } from './helpers.js';

const strings = catalogs.en.checkRun;
const metricLabels = catalogs.en.metrics;

const PROVENANCE = {
  methodologyVersion: 'v1.0 draft',
  models: ['ecoindex@2.1.0', 'swd@4.0.2'],
  runId: 'r-8f21',
  ledgerRef: '0f3ab9c2',
  verificationUrl: 'https://balise.eco/v/0f3ab9c2',
  fingerprintMatched: true,
};

function config(source: string): BudgetConfig {
  const result = readConfig(
    `version: 1\nservice: p\nruns: 5\nprofiles: [mobile-4g]\nreference_model: swd@4.0\n${source}`,
  );
  if (result.status !== 'ok') {
    throw new Error(result.issues.map((issue) => issue.message).join('; '));
  }
  return result.config;
}

const CONFIG = config(
  [
    'budgets:',
    '  - scope: /accueil',
    '    bytes: { warn: 860KB, fail: 900KB }',
    '  - scope: /actualites',
    '    bytes: { fail: 900KB }',
    '',
    'check:',
    '  block_merge_on: fail',
    '  annotate_files: true',
  ].join('\n'),
);

function scenario(id: string, head: number, base?: number): ScenarioMeasurement {
  return route(id, aggregate([metric('transferred_bytes', head, 3_000)]), {
    baseline: base === undefined ? undefined : aggregate([metric('transferred_bytes', base, 3_000)]),
    floors: [floor('transferred_bytes', 7_000)],
  });
}

const SCENARIOS = [scenario('/accueil', 842_000, 840_000), scenario('/actualites', 1_240_000, 1_238_000)];

function report(overrides: Partial<CheckReportInput> = {}): CheckReportInput {
  const config = overrides.config ?? CONFIG;
  const scenarios = overrides.scenarios ?? SCENARIOS;
  const assessments = evaluateBudgets({
    config,
    scenarios,
    overrides: overrides.summary === undefined ? [] : [],
  });
  return {
    config,
    scenarios,
    assessments,
    summary: summariseCheck(assessments, config.check),
    strings,
    metricLabels,
    provenance: PROVENANCE,
    configPath: 'balise.yml',
    ...overrides,
  };
}

describe('the line beside the check name', () => {
  it('counts a breach and a regression, and counts a scenario once', () => {
    const input = report();
    expect(checkTitle(input.summary, input.assessments, strings)).toBe('1 budget over its limit');
  });

  it('says every budget held when nothing was found', () => {
    const input = report({ scenarios: [scenario('/accueil', 842_000, 840_000)] });
    expect(checkTitle(input.summary, input.assessments, strings)).toBe('every budget held');
  });

  it('reports what it refused to decide rather than passing it', () => {
    const scenarios = [
      route('/accueil', aggregate([metric('transferred_bytes', 1_400_000)]), {
        floors: [noFloor('transferred_bytes')],
      }),
    ];
    const input = report({ scenarios });
    expect(checkTitle(input.summary, input.assessments, strings)).toBe('1 not evaluated');
    expect(input.summary.conclusion).toBe('neutral');
  });
});

describe('one row per rule', () => {
  it('reports a rule by its worst scenario, in the order the file wrote them', () => {
    const wide = config(
      ['budgets:', '  - scope: service', '    bytes: { fail: 900KB }'].join('\n'),
    );
    const assessments = evaluateBudgets({ config: wide, scenarios: SCENARIOS });
    const outcomes = outcomesByRule(assessments);
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]!.scenarioCount).toBe(2);
    expect(outcomes[0]!.decided).toMatchObject({ scenarioId: '/actualites', status: 'breach' });
  });
});

describe('the measurement table', () => {
  it('takes its verdict from the kernel, never from the budget status', () => {
    const rows = measurementRows(SCENARIOS, []);
    // 2 KB of growth against a 7 KB floor is not a change, on a route whose
    // budget is comfortably held, and on one whose budget is broken.
    expect(rows.map((row) => row.classification)).toEqual([
      'no-significant-change',
      'no-significant-change',
    ]);
    expect(rows[1]).toMatchObject({ candidate: 1_240_000, baseline: 1_238_000, mad: 3_000 });
  });

  it('has no verdict on a scenario with nothing to compare to', () => {
    const rows = measurementRows([scenario('/accueil', 842_000)], []);
    expect(rows[0]).toMatchObject({ baseline: null, delta: null, classification: 'indeterminate' });
  });

  it('carries the worst budget status of the scenario beside the measurement', () => {
    const input = report();
    const rows = measurementRows(SCENARIOS, input.assessments);
    expect(rows.map((row) => row.status)).toEqual(['conforme', 'breach']);
  });
});

describe('the markdown body', () => {
  const output = buildCheckRun(report());

  it('is a valid check run output', () => {
    expect(() => CheckRunOutput.parse(output)).not.toThrow();
    expect(output.conclusion).toBe('failure');
  });

  it('states the rule that nothing fails on noise, on every comment', () => {
    expect(output.summary).toContain('No check fails on noise.');
  });

  it('names what is holding the merge, with the figures', () => {
    expect(output.summary).toContain('`/actualites` · bytes: 1 240 KB against a limit of 900 KB');
  });

  it('writes the measured value beside its dispersion, never alone', () => {
    expect(output.text).toContain('842 KB ± 3 KB');
  });

  it('carries the provenance the report is verifiable from', () => {
    expect(output.text).toContain('Methodology v1.0 draft');
    expect(output.text).toContain('swd@4.0.2');
    expect(output.text).toContain('https://balise.eco/v/0f3ab9c2');
    expect(output.text).toContain('balise.yml');
  });

  it('flags a fingerprint that does not match instead of comparing quietly', () => {
    const flagged = buildCheckRun(
      report({ provenance: { ...PROVENANCE, fingerprintMatched: false } }),
    );
    expect(flagged.text).toContain('fingerprints differ');
  });

  it('leaves attribution out entirely when it resolved nothing', () => {
    expect(output.text).not.toContain('Attribution');
    const explained = buildCheckRun(report({ attribution: 'app.b81c.js gained 184 KB.' }));
    expect(explained.text).toContain('app.b81c.js gained 184 KB.');
    expect(explained.text).toContain('It never decides one.');
  });

  it('embeds the band rendering only when one is served', () => {
    expect(output.text).not.toContain('![');
    const withImage = buildCheckRun(report({ bandImageUrl: 'https://balise.eco/v1/band/r-8f21.svg' }));
    expect(withImage.text).toContain('![Measurement](https://balise.eco/v1/band/r-8f21.svg)');
  });

  it('escapes a pipe rather than breaking the table it sits in', () => {
    const scenarios = [scenario('/a|b', 842_000, 840_000)];
    const body = buildCheckRun(report({ scenarios })).text;
    expect(body).toContain('`/a\\|b`');
  });

  it('renders the same bytes for the same input', () => {
    expect(buildCheckRun(report()).text).toBe(output.text);
  });
});

describe('the annotations', () => {
  it('points at the line of the limit that decided, in the file that was read', () => {
    const { annotations } = checkAnnotations(report());
    expect(annotations).toHaveLength(1);
    expect(annotations[0]).toMatchObject({
      path: 'balise.yml',
      level: 'failure',
      title: 'Budget over its limit',
      startLine: CONFIG.rules[1]!.fail!.line,
    });
  });

  it('annotates nothing when the file says not to', () => {
    const quiet = config(
      [
        'budgets:',
        '  - scope: /actualites',
        '    bytes: { fail: 900KB }',
        '',
        'check:',
        '  annotate_files: false',
      ].join('\n'),
    );
    expect(checkAnnotations(report({ config: quiet })).annotations).toEqual([]);
  });

  it('marks an overridden breach as a warning and still names the breach', () => {
    const override: BudgetOverride = {
      scope: { kind: 'route', pattern: '/actualites' },
      metricId: 'transferred_bytes',
      reason: 'video hero for the mayor, out on 1 september',
      by: 'm. carbonne',
      recordedAt: '2026-08-14T09:12:00.000Z',
    };
    const assessments = evaluateBudgets({ config: CONFIG, scenarios: SCENARIOS, overrides: [override] });
    const summary = summariseCheck(assessments, CONFIG.check);
    const output = buildCheckRun(report({ assessments, summary }));

    expect(output.conclusion).toBe('neutral');
    expect(output.annotations[0]).toMatchObject({
      level: 'warning',
      title: 'Breach covered by an override',
    });
    expect(output.annotations[0]!.message).toContain('m. carbonne');
    // the override lifted the block. it did not lift the breach.
    expect(output.title).toBe('1 budget over its limit');
    expect(output.text).toContain('breach · overridden');
  });

  it('tells a developer which budget is not protecting them yet', () => {
    const scenarios = [
      route('/accueil', aggregate([metric('transferred_bytes', 1_400_000)]), {
        floors: [noFloor('transferred_bytes')],
      }),
    ];
    const { annotations } = checkAnnotations(report({ scenarios }));
    expect(annotations[0]).toMatchObject({ level: 'notice', title: 'Budget not evaluated' });
    expect(annotations[0]!.message).toContain('noise floor not established yet');
  });
});

describe('a summary that reached the renderer through json', () => {
  it('still knows which assessment is holding the merge', () => {
    // a generated fixture, an api response and a queue message all arrive as
    // json. matching the blocking assessments by object identity would work in
    // memory and silently stop working everywhere else.
    const input = report();
    const revived = JSON.parse(JSON.stringify(input)) as CheckReportInput;
    const output = buildCheckRun({ ...revived, strings, metricLabels });

    expect(output.annotations[0]).toMatchObject({ level: 'failure', startLine: CONFIG.rules[1]!.fail!.line });
    expect(output.conclusion).toBe('failure');
  });
});
