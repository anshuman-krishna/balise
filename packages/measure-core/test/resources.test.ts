import { describe, expect, it } from 'vitest';
import type { CapturedResource, RawCapture, ResourceType } from '@balise/schemas';
import { extractMetrics } from '../src/extract.js';
import { coverageApplies, summariseResources } from '../src/resources.js';

function res(
  url: string,
  resourceType: ResourceType,
  transferredBytes: number,
  decodedBytes: number | null = null,
  unusedDecodedBytes: number | null = null,
): CapturedResource {
  return {
    url,
    resourceType,
    transferredBytes,
    decodedBytes,
    unusedDecodedBytes,
    startMs: null,
    durationMs: null,
  };
}

function capture(resources: CapturedResource[]): RawCapture {
  return {
    serviceOrigin: 'https://sevre-et-loire.fr',
    pass: 'cold',
    resources,
    requestCount: resources.length,
    domNodeCountAtLoad: 2_050,
    domNodeCountAtNetworkIdle: 2_140,
    jsExecutionMs: 548,
  };
}

const PAGE = capture([
  res('https://sevre-et-loire.fr/', 'document', 42_000, 210_000),
  res('https://sevre-et-loire.fr/app.js', 'script', 412_000, 1_180_000, 402_000),
  res('https://sevre-et-loire.fr/hero.jpg', 'image', 224_000, 224_000),
  res('https://matomo.selo.fr/matomo.js', 'script', 72_000, 214_000, 96_000),
]);

describe('summariseResources', () => {
  it('groups by type, heaviest first', () => {
    const summary = summariseResources(PAGE);
    expect(summary.groups.map((group) => group.resourceType)).toEqual([
      'script',
      'image',
      'document',
    ]);
    expect(summary.groups[0]!.requestCount).toBe(2);
    expect(summary.groups[0]!.transferredBytes).toBe(484_000);
  });

  it('totals the same transferred bytes the metric extraction does', () => {
    // the inventory on a screen and the figure printed above it are two
    // reductions of one capture, and this is the assertion that keeps them so.
    const summary = summariseResources(PAGE);
    const extracted = extractMetrics(PAGE).values.find(
      (value) => value.metricId === 'transferred_bytes',
    )!;
    expect(summary.totalTransferredBytes).toBe(extracted.value);
  });

  it('splits first from third party the way the third-party metric does', () => {
    const summary = summariseResources(PAGE);
    const extracted = extractMetrics(PAGE).values.find(
      (value) => value.metricId === 'third_party_bytes',
    )!;
    expect(summary.thirdPartyTransferredBytes).toBe(extracted.value);
    expect(summary.firstPartyTransferredBytes + summary.thirdPartyTransferredBytes).toBe(
      summary.totalTransferredBytes,
    );
  });

  it('gives each group its exact share, unrounded', () => {
    const summary = summariseResources(PAGE);
    expect(summary.groups[0]!.transferredShare).toBeCloseTo(484_000 / 750_000, 12);
    const shares = summary.groups.reduce((sum, group) => sum + group.transferredShare, 0);
    expect(shares).toBeCloseTo(1, 12);
  });

  it('counts a body it could not read rather than filling it in', () => {
    const summary = summariseResources(
      capture([
        res('https://sevre-et-loire.fr/a.js', 'script', 1_000, 4_000),
        res('https://sevre-et-loire.fr/b.js', 'script', 2_000, null),
      ]),
    );
    expect(summary.groups[0]!.decodedBytes).toBe(4_000);
    expect(summary.decodedUnavailableCount).toBe(1);
    expect(summary.totalDecodedBytes).toBe(4_000);
  });

  it('counts a script with no coverage, and never a resource coverage cannot apply to', () => {
    const summary = summariseResources(
      capture([
        res('https://sevre-et-loire.fr/a.js', 'script', 1_000, 4_000, null),
        res('https://sevre-et-loire.fr/hero.jpg', 'image', 9_000, 9_000, null),
        res('https://sevre-et-loire.fr/a.css', 'stylesheet', 500, 2_000, 1_200),
      ]),
    );
    expect(summary.coverageUnavailableCount).toBe(1);
    expect(coverageApplies(PAGE.resources[2]!)).toBe(false);
  });

  it('sums unused decoded bytes only over what was measured', () => {
    const summary = summariseResources(PAGE);
    const scripts = summary.groups.find((group) => group.resourceType === 'script')!;
    expect(scripts.unusedDecodedBytes).toBe(498_000);
    expect(scripts.coverageUnavailableCount).toBe(0);
  });

  it('reports an empty capture without dividing by zero', () => {
    const summary = summariseResources(capture([]));
    expect(summary.groups).toEqual([]);
    expect(summary.totalTransferredBytes).toBe(0);
    expect(summary.resourceCount).toBe(0);
  });

  it('throws on an invalid service origin', () => {
    expect(() => summariseResources({ ...PAGE, serviceOrigin: 'not a url' })).toThrow(
      'serviceOrigin',
    );
  });
});
