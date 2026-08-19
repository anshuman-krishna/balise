import { describe, expect, it } from 'vitest';
import { BudgetConfig } from '@balise/schemas';
import { parseByteSize, parseCount, parsePercent, readConfig } from '../src/config.js';
import { CANON_YAML } from './fixtures/config.js';

function ok(source: string) {
  const result = readConfig(source);
  if (result.status !== 'ok') {
    throw new Error(`expected ok, got ${result.issues.map((issue) => issue.message).join('; ')}`);
  }
  return result.config;
}

function invalid(source: string) {
  const result = readConfig(source);
  if (result.status !== 'invalid') throw new Error('expected a refusal');
  return result.issues;
}

const MINIMAL = ['version: 1', 'service: portail', 'profiles: [mobile-4g]', 'reference_model: swd@4.0'].join('\n');

function withBudget(block: string): string {
  return `${MINIMAL}\nbudgets:\n  - scope: /a\n    ${block}\n`;
}

describe('quantities', () => {
  it('reads decimal byte units, because a kilobyte on the wire is a thousand bytes', () => {
    expect(parseByteSize('900KB')).toBe(900_000);
    expect(parseByteSize('1.3MB')).toBe(1_300_000);
    expect(parseByteSize('512 B')).toBe(512);
  });

  it('reads binary units when they are asked for by name', () => {
    expect(parseByteSize('1KiB')).toBe(1_024);
  });

  it('refuses a size with no unit, which would be ambiguous', () => {
    expect(parseByteSize('900')).toBeNull();
    expect(parseByteSize('900 kilobytes')).toBeNull();
  });

  it('reads percentages and counts', () => {
    expect(parsePercent('30%')).toBe(30);
    expect(parsePercent('+3%')).toBe(3);
    expect(parseCount('90')).toBe(90);
    expect(parseCount('90.5')).toBeNull();
  });
});

describe('reading balise.yml', () => {
  const config = ok(CANON_YAML);

  it('satisfies the published contract', () => {
    expect(() => BudgetConfig.parse(config)).not.toThrow();
  });

  it('carries the settings the file states', () => {
    expect(config).toMatchObject({
      version: 1,
      service: 'portail-metropolitain',
      runs: 5,
      profiles: ['desktop-fibre', 'mobile-4g'],
      referenceModel: 'swd@4.0',
      noiseFloor: 'auto',
      check: { blockMergeOn: 'fail', annotateFiles: true },
    });
  });

  it('turns every threshold into the metric canonical unit and keeps what was written', () => {
    const first = config.rules[0]!;
    expect(first.metricId).toBe('transferred_bytes');
    expect(first.unit).toBe('bytes');
    expect(first.fail).toMatchObject({ value: 900_000, sourceText: '900KB' });
    expect(first.warn).toMatchObject({ value: 860_000, sourceText: '860KB' });
  });

  it('gives every rule the line it was written on, so a refusal can point at it', () => {
    expect(config.rules[0]!.line).toBe(12);
    expect(config.rules[0]!.fail!.line).toBe(12);
  });

  it('reads the three scope forms', () => {
    expect(config.rules.map((rule) => rule.scope)).toEqual([
      { kind: 'route', pattern: '/accueil' },
      { kind: 'route', pattern: '/demarches/*' },
      { kind: 'route', pattern: '/demarches/*' },
      { kind: 'journey', journey: 'demande-acte' },
      { kind: 'service' },
      { kind: 'service' },
    ]);
  });

  it('separates absolute limits from the growth limit', () => {
    const relative = config.rules.filter((rule) => rule.kind === 'relative');
    expect(relative).toHaveLength(1);
    expect(relative[0]).toMatchObject({ metricId: 'transferred_bytes', unit: 'pct' });
    expect(relative[0]!.warn).toMatchObject({ value: 3, sourceText: '+3%' });
  });

  it('accepts a bare value as the failing threshold', () => {
    const config = ok(withBudget('bytes: 900KB'));
    expect(config.rules[0]!.fail).toMatchObject({ value: 900_000 });
    expect(config.rules[0]!.warn).toBeNull();
  });

  it('defaults the check to blocking on failure, because that is what a budget is for', () => {
    expect(ok(withBudget('bytes: 900KB')).check).toEqual({ blockMergeOn: 'fail', annotateFiles: false });
  });
});

describe('what the reader refuses', () => {
  it('refuses an unknown key rather than ignoring it', () => {
    // a typo in a budget key would otherwise switch a limit off in silence.
    expect(invalid(withBudget('bytez: 900KB'))[0]!.message).toMatch(/not a key/);
    expect(invalid(`${MINIMAL}\nblock_merge: fail\nbudgets:\n  - scope: /a\n    bytes: 900KB`)[0]!.message).toMatch(
      /not a key/,
    );
  });

  it('refuses a run count below three', () => {
    const issues = invalid(`${MINIMAL}\nruns: 2\nbudgets:\n  - scope: /a\n    bytes: 900KB`);
    expect(issues[0]!.message).toMatch(/may not go below 3/);
  });

  it('refuses a profile that is not one of the named ones', () => {
    const issues = invalid('version: 1\nservice: p\nprofiles: [mobile-5g]\nreference_model: swd@4.0\nbudgets:\n  - scope: /a\n    bytes: 900KB');
    expect(issues[0]!.message).toMatch(/not a named profile/);
  });

  it('refuses a written noise floor', () => {
    const issues = invalid(`${MINIMAL}\nnoise_floor: 5%\nbudgets:\n  - scope: /a\n    bytes: 900KB`);
    expect(issues[0]!.message).toMatch(/derived from measured dispersion/);
  });

  it('refuses a threshold with no unit', () => {
    expect(invalid(withBudget('bytes: { fail: 900 }'))[0]!.message).toMatch(/not a threshold in bytes/);
  });

  it('refuses a warning above its failure threshold', () => {
    expect(invalid(withBudget('bytes: { warn: 950KB, fail: 900KB }'))[0]!.message).toMatch(/must be below/);
  });

  it('refuses a budget block with neither warn nor fail', () => {
    expect(invalid(withBudget('bytes: { }'))[0]!.message).toMatch(/at least one/);
  });

  it('refuses a growth allowance of zero or less', () => {
    expect(invalid(withBudget('relative_to_baseline: { fail: 0% }'))[0]!.message).toMatch(/above 0%/);
    expect(invalid(withBudget('relative_to_baseline: { fail: -3% }'))[0]!.message).toMatch(/above 0%/);
  });

  it('refuses a scope it cannot place', () => {
    expect(invalid(`${MINIMAL}\nbudgets:\n  - scope: accueil\n    bytes: 900KB`)[0]!.message).toMatch(/a scope is/);
  });

  it('reports every problem at once, in line order', () => {
    const issues = invalid(
      ['version: 2', 'service: portail', 'profiles: [mobile-4g]', 'reference_model: swd@4.0', 'runs: 1'].join('\n'),
    );
    expect(issues.map((issue) => issue.line)).toEqual([...issues.map((issue) => issue.line)].sort((a, b) => a - b));
    expect(issues.length).toBeGreaterThan(1);
  });

  it('passes a yaml refusal through with its line', () => {
    const issues = invalid('version: 1\nservice: |\n  portail');
    expect(issues).toEqual([{ line: 2, path: 'service', message: expect.stringMatching(/block scalars/) }]);
  });
});
