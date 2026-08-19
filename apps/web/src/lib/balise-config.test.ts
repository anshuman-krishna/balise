import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readConfig } from '@balise/budgets';

// the repository carries its own balise.yml, and the web app is what it measures.
// this holds that file to the reader: our own config cannot be the one that never
// gets parsed until a customer's build fails on it.
const source = readFileSync(fileURLToPath(new URL('../../../../balise.yml', import.meta.url)), 'utf8');

describe('our own balise.yml', () => {
  const result = readConfig(source);

  it('reads without a single refusal', () => {
    if (result.status !== 'ok') {
      throw new Error(result.issues.map((issue) => `line ${issue.line}: ${issue.message}`).join('\n'));
    }
    expect(result.config.service).toBe('balise-web');
  });

  it('carries the budgets the operating manual sets for our screens', () => {
    if (result.status !== 'ok') throw new Error('expected a readable config');
    const limits = new Map(
      result.config.rules.map((rule) => [`${JSON.stringify(rule.scope)}:${rule.metricId}`, rule.fail?.value]),
    );
    expect(limits.get('{"kind":"route","pattern":"/"}:transferred_bytes')).toBe(350_000);
    expect(limits.get('{"kind":"route","pattern":"/"}:dom_node_count')).toBe(1_500);
    expect(limits.get('{"kind":"route","pattern":"/public/scan"}:transferred_bytes')).toBe(120_000);
    expect(limits.get('{"kind":"route","pattern":"/public/observatory"}:request_count')).toBe(25);
  });
});
