import { describe, expect, it } from 'vitest';
import {
  attributionCoverage,
  attributionLead,
  attributionRows,
  bundleName,
  formatByteDelta,
  originRows,
  shortDate,
  unexplainedOrigin,
} from './attribution-view';

describe('formatByteDelta', () => {
  it('keeps a sub-kilobyte change visible instead of rounding it to zero', () => {
    expect(formatByteDelta(120)).toBe('+120 B');
    expect(formatByteDelta(-120)).toBe('-120 B');
  });

  it('reports larger changes in kilobytes', () => {
    expect(formatByteDelta(160_000)).toBe('+160 KB');
    expect(formatByteDelta(-96_000)).toBe('-96 KB');
  });
});

describe('bundleName and shortDate', () => {
  it('shows the served file name', () => {
    expect(bundleName('https://selo.fr/assets/vendor-dates.c40e.js')).toBe('vendor-dates.c40e.js');
  });

  it('formats a commit date from the catalog, not from the platform', () => {
    expect(shortDate('2026-08-12T11:24:00Z')).toBe('12 Aug');
  });
});

describe('attributionLead', () => {
  const parts = attributionLead();

  it('reads as one sentence with the measured values in place', () => {
    expect(parts.map((part) => part.text).join('')).toBe(
      'vendor-dates.c40e.js gained +184 KB decoded. +160 KB is date-fns, in 3 new modules, introduced by a7f2c91 · c. bellanger.',
    );
  });

  it('marks identifiers and quantities so they are set apart', () => {
    expect(parts.filter((part) => part.token === true).map((part) => part.text)).toEqual([
      'vendor-dates.c40e.js',
      'date-fns',
      'a7f2c91 · c. bellanger',
    ]);
    expect(parts.filter((part) => part.measure === true).map((part) => part.text)).toEqual(['+184 KB', '+160 KB']);
  });
});

describe('attributionRows', () => {
  const rows = attributionRows();

  it('walks from the bundle down to the commit', () => {
    expect(rows.map((row) => row.key)).toEqual(['bundle', 'dependency', 'module', 'file', 'commit', 'remainder']);
  });

  it('carries the measured delta on every row', () => {
    expect(rows.map((row) => row.note)).toEqual(['+184 KB', '+160 KB', '+62 KB', '+120 B', '12 Aug', '+24 KB']);
  });

  it('names the dependency and the first-party file separately', () => {
    expect(rows[1]!.value).toBe('date-fns');
    expect(rows[3]!.value).toBe('src/lib/dates.ts');
  });
});

describe('attributionCoverage', () => {
  it('states what the modules explain and what is left over', () => {
    expect(attributionCoverage()).toContain('160 KB');
    expect(attributionCoverage()).toContain('184 KB');
    expect(attributionCoverage()).toContain('24 KB');
  });
});

describe('originRows', () => {
  const rows = originRows();

  it('lists third-party origins by hostname', () => {
    expect(rows.map((row) => row.origin)).toEqual([
      'geo.api.gouv.fr',
      'matomo.selo.fr',
      'player.dailymotion.com',
      'tarteaucitron.io',
    ]);
  });

  it('marks the origin that appeared between the two runs', () => {
    expect(rows.filter((row) => row.isNew).map((row) => row.origin)).toEqual(['player.dailymotion.com']);
    expect(rows.find((row) => row.isNew)?.transferred).toBe('198 KB');
  });
});

describe('unexplainedOrigin', () => {
  it('names the host we could not explain', () => {
    expect(unexplainedOrigin()).toBe('player.dailymotion.com');
  });
});
