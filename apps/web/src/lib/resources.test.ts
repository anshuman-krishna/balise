import { describe, expect, it } from 'vitest';
import { runDetailFixture } from '../fixtures/canon';
import { summariseResources } from './resources';

const { resources, remainder } = runDetailFixture;

describe('summariseResources', () => {
  it('reproduces the totals the waterfall states on the same screen', () => {
    const summary = summariseResources(resources, remainder);
    expect(summary.totalRequests).toBe(runDetailFixture.requests);
    expect(summary.totalTransferredKb).toBe(runDetailFixture.totalKb);
  });

  it('counts the tail we hold no records for rather than dropping it', () => {
    const withTail = summariseResources(resources, remainder);
    const withoutTail = summariseResources(resources);
    expect(withTail.totalRequests - withoutTail.totalRequests).toBe(remainder.requests);
    expect(withTail.groups.find((group) => group.type === 'other')?.requests).toBe(remainder.requests);
    expect(withoutTail.groups.some((group) => group.type === 'other')).toBe(false);
  });

  it('groups by type, heaviest first', () => {
    const summary = summariseResources(resources, remainder);
    expect(summary.groups.map((group) => group.type)).toEqual([
      'script',
      'image',
      'media',
      'font',
      'document',
      'other',
    ]);
    const script = summary.groups[0]!;
    expect(script.requests).toBe(4);
    expect(script.transferredKb).toBe(764);
  });

  it('sums coverage only where coverage exists', () => {
    const summary = summariseResources(resources, remainder);
    expect(summary.groups.find((group) => group.type === 'script')?.unusedDecodedKb).toBe(1193);
    expect(summary.groups.find((group) => group.type === 'image')?.unusedDecodedKb).toBe(0);
  });

  it('leaves share exact, for the edge to round', () => {
    const summary = summariseResources(resources, remainder);
    const total = summary.groups.reduce((sum, group) => sum + group.share, 0);
    expect(total).toBeCloseTo(1, 12);
    expect(summary.groups[0]!.share).toBeCloseTo(764 / 1298, 12);
  });

  it('returns nothing to draw for an empty capture', () => {
    expect(summariseResources([])).toEqual({ groups: [], totalRequests: 0, totalTransferredKb: 0 });
  });

  it('ignores a remainder with no requests in it', () => {
    const summary = summariseResources(resources, { requests: 0, transferredKb: 0 });
    expect(summary.groups.some((group) => group.type === 'other')).toBe(false);
  });
});
