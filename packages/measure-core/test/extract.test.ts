import { describe, expect, it } from 'vitest';
import type { RawCapture } from '@balise/schemas';
import { extractMetrics } from '../src/extract.js';

function capture(overrides: Partial<RawCapture> = {}): RawCapture {
  return {
    serviceOrigin: 'https://sevre-et-loire.fr',
    pass: 'cold',
    resources: [
      { url: 'https://sevre-et-loire.fr/', transferredBytes: 42_000 },
      { url: 'https://sevre-et-loire.fr/app.js', transferredBytes: 412_000 },
      { url: 'https://player.dailymotion.com/player.js', transferredBytes: 198_000 },
      { url: 'https://matomo.selo.fr/matomo.js', transferredBytes: 72_000 },
    ],
    requestCount: 84,
    domNodeCountAtLoad: 2_050,
    domNodeCountAtNetworkIdle: 2_140,
    jsExecutionMs: 548,
    ...overrides,
  };
}

function value(result: ReturnType<typeof extractMetrics>, metricId: string): number {
  const found = result.values.find((v) => v.metricId === metricId);
  if (!found) throw new Error(`metric ${metricId} missing`);
  return found.value;
}

describe('extractMetrics', () => {
  it('sums transferred bytes across all resources', () => {
    expect(value(extractMetrics(capture()), 'transferred_bytes')).toBe(724_000);
  });

  it('attributes bytes on foreign origins to third parties', () => {
    const result = extractMetrics(capture());
    expect(value(result, 'third_party_bytes')).toBe(270_000);
    expect(value(result, 'third_party_share_pct')).toBeCloseTo((270_000 / 724_000) * 100, 10);
  });

  it('treats a subdomain as a different origin, not first party', () => {
    const result = extractMetrics(
      capture({
        resources: [
          { url: 'https://sevre-et-loire.fr/', transferredBytes: 100 },
          { url: 'https://cdn.sevre-et-loire.fr/a.js', transferredBytes: 50 },
        ],
      }),
    );
    expect(value(result, 'third_party_bytes')).toBe(50);
  });

  it('counts unparsable resource URLs as first party rather than guessing', () => {
    const result = extractMetrics(
      capture({
        resources: [
          { url: 'https://sevre-et-loire.fr/', transferredBytes: 100 },
          { url: 'data:image/png;base64,AAAA', transferredBytes: 10 },
        ],
      }),
    );
    expect(value(result, 'transferred_bytes')).toBe(110);
    expect(value(result, 'third_party_bytes')).toBe(0);
  });

  it('reports zero third-party share for an empty page instead of dividing by zero', () => {
    const result = extractMetrics(capture({ resources: [] }));
    expect(value(result, 'transferred_bytes')).toBe(0);
    expect(value(result, 'third_party_share_pct')).toBe(0);
  });

  it('uses the network-idle DOM count as the canonical dom_node_count', () => {
    expect(value(extractMetrics(capture()), 'dom_node_count')).toBe(2_140);
  });

  it('carries the pass through unchanged', () => {
    expect(extractMetrics(capture({ pass: 'warm' })).pass).toBe('warm');
  });

  it('throws on an invalid service origin', () => {
    expect(() => extractMetrics(capture({ serviceOrigin: 'not a url' }))).toThrow('serviceOrigin');
  });
});
