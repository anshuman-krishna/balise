import { describe, expect, it } from 'vitest';
import { capture, inventory, resourceRows, waterfall } from './capture-view';
import { attributionCanon } from '../fixtures/attribution-canon';

const runCapture = capture('candidate');
const rows = resourceRows(runCapture);

describe('capture', () => {
  it('refuses an aggregation that publishes none', () => {
    expect(() => capture('service')).toThrow('publishes no capture');
  });
});

describe('resourceRows', () => {
  it('names one row per captured resource', () => {
    expect(rows.length).toBe(runCapture.resources.length);
  });

  it('marks a foreign origin as third party and names its host', () => {
    const player = rows.find((row) => row.url.includes('dailymotion.com/embed.js'))!;
    expect(player.kind).toBe('third-party');
    expect(player.origin).toBe('player.dailymotion.com');
  });

  it('leaves the service its own origin unnamed', () => {
    const document = rows.find((row) => row.resourceType === 'document')!;
    expect(document.origin).toBeNull();
    expect(document.name).toBe('/demarches/acte-naissance');
  });

  it('marks the bundle the attribution engine named, and no other', () => {
    const marked = rows.filter((row) => row.kind === 'regression');
    expect(marked).toHaveLength(1);
    expect(marked[0]!.url).toBe(attributionCanon.bundle.after);
  });

  it('places every bar inside the load it measured', () => {
    for (const row of rows) {
      if (row.startFraction === null || row.durationFraction === null) continue;
      expect(row.startFraction).toBeGreaterThanOrEqual(0);
      expect(row.startFraction + row.durationFraction).toBeLessThanOrEqual(1.000001);
    }
  });

  it('carries coverage only where it applies', () => {
    for (const row of rows) {
      if (row.unusedDecodedBytes === null) continue;
      expect(['script', 'stylesheet']).toContain(row.resourceType);
      expect(row.unusedDecodedBytes).toBeLessThanOrEqual(row.decodedBytes!);
    }
  });
});

describe('waterfall', () => {
  const drawn = waterfall(rows, 12);

  it('draws the heaviest resources and counts the rest', () => {
    expect(drawn.rows).toHaveLength(12);
    expect(drawn.remainder.count).toBe(rows.length - 12);
  });

  it('accounts for every byte of the capture between the two', () => {
    const shown = drawn.rows.reduce((sum, row) => sum + row.transferredBytes, 0);
    const total = rows.reduce((sum, row) => sum + row.transferredBytes, 0);
    expect(shown + drawn.remainder.transferredBytes).toBe(total);
  });

  it('draws them in the order they were requested', () => {
    const starts = drawn.rows.map((row) => row.startFraction ?? 0);
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('keeps the third parties, which weight selects and arrival order would not', () => {
    expect(drawn.rows.some((row) => row.kind === 'third-party')).toBe(true);
    expect(drawn.rows.some((row) => row.kind === 'regression')).toBe(true);
  });
});

describe('inventory', () => {
  it('totals what the rows total', () => {
    const summary = inventory(runCapture);
    expect(summary.totalTransferredBytes).toBe(
      rows.reduce((sum, row) => sum + row.transferredBytes, 0),
    );
    expect(summary.resourceCount).toBe(rows.length);
  });

  it('gives the groups shares that add to the whole', () => {
    const summary = inventory(runCapture);
    const shares = summary.groups.reduce((sum, group) => sum + group.transferredShare, 0);
    expect(shares).toBeCloseTo(1, 12);
  });
});
