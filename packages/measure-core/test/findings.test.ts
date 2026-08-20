import { describe, expect, it } from 'vitest';
import type { CapturedResource, RawCapture, ResourceType } from '@balise/schemas';
import {
  findings,
  PROVISIONAL_FINDING_THRESHOLDS,
  type Finding,
  type FindingId,
  type ReferencePosition,
} from '../src/findings.js';

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

function ids(result: { findings: readonly Finding[] }): FindingId[] {
  return result.findings.map((finding) => finding.id);
}

function get(result: { findings: readonly Finding[] }, id: FindingId): Finding {
  const found = result.findings.find((finding) => finding.id === id);
  if (found === undefined) throw new Error(`no ${id} finding was raised`);
  return found;
}

// 1 000 000 bytes: 700 000 of images, 200 000 of fonts, 100 000 of script.
const IMAGE_HEAVY = capture([
  res('https://sevre-et-loire.fr/', 'document', 20_000, 90_000),
  res('https://sevre-et-loire.fr/a.png', 'image', 400_000),
  res('https://sevre-et-loire.fr/b.png', 'image', 200_000),
  res('https://sevre-et-loire.fr/c.png', 'image', 100_000),
  res('https://sevre-et-loire.fr/f1.woff', 'font', 100_000),
  res('https://sevre-et-loire.fr/f2.woff', 'font', 100_000),
  res('https://sevre-et-loire.fr/app.js', 'script', 80_000, 240_000, 40_000),
]);

describe('findings: weight of a resource type', () => {
  it('raises images at their measured share of the page', () => {
    const result = findings({ capture: IMAGE_HEAVY });
    const images = get(result, 'image-weight');
    expect(images.value).toBe(700_000);
    expect(images.share).toEqual({ value: 0.7, basis: 'page-transferred-bytes' });
    expect(images.severity).toBe('breach');
    expect(images.contributorCount).toBe(3);
    expect(images.unit).toBe('bytes');
  });

  it('names the heaviest contributors and no more than the cap', () => {
    const result = findings({ capture: IMAGE_HEAVY, evidenceLimit: 2 });
    expect(get(result, 'image-weight').evidence.map((entry) => entry.url)).toEqual([
      'https://sevre-et-loire.fr/a.png',
      'https://sevre-et-loire.fr/b.png',
    ]);
  });

  it('raises fonts as caution below the breach share', () => {
    // 200 000 of 1 000 000 is 20 %, which is the font breach threshold, so
    // move it to 15 % by making the page heavier.
    const page = capture([
      ...IMAGE_HEAVY.resources,
      res('https://sevre-et-loire.fr/extra.png', 'image', 333_000),
    ]);
    const fonts = get(findings({ capture: page }), 'font-weight');
    expect(fonts.severity).toBe('caution');
    expect(fonts.share!.value).toBeCloseTo(0.15, 3);
  });

  it('reports what was transferred and not what another format would weigh', () => {
    // the whole point of the engine: the value is the sum of the measured
    // bytes of the type, to the byte, and there is nowhere for a projection
    // to live.
    const images = get(findings({ capture: IMAGE_HEAVY }), 'image-weight');
    const measured = IMAGE_HEAVY.resources
      .filter((resource) => resource.resourceType === 'image')
      .reduce((total, resource) => total + resource.transferredBytes, 0);
    expect(images.value).toBe(measured);
  });
});

describe('findings: the minimum', () => {
  it('raises nothing on a page too small for a share to mean anything', () => {
    // fonts are 80 % of this page and weigh 8 KB. saying so is arithmetic.
    const tiny = capture([
      res('https://sevre-et-loire.fr/', 'document', 2_000, 6_000),
      res('https://sevre-et-loire.fr/f.woff', 'font', 8_000),
    ]);
    expect(ids(findings({ capture: tiny }))).toEqual([]);
  });

  it('raises the same page once it is above the minimum', () => {
    const page = capture([
      res('https://sevre-et-loire.fr/', 'document', 20_000, 60_000),
      res('https://sevre-et-loire.fr/f.woff', 'font', 80_000),
    ]);
    expect(ids(findings({ capture: page }))).toContain('font-weight');
  });
});

describe('findings: coverage', () => {
  const UNUSED = capture([
    res('https://sevre-et-loire.fr/', 'document', 20_000, 60_000),
    res('https://sevre-et-loire.fr/a.js', 'script', 157_000, 470_000, 442_000),
    res('https://sevre-et-loire.fr/b.js', 'script', 40_000, 130_000, 30_000),
  ]);

  it('reports unexecuted decoded bytes as a share of the decoded bytes it measured', () => {
    const finding = get(findings({ capture: UNUSED }), 'unused-script-bytes');
    expect(finding.value).toBe(472_000);
    expect(finding.share).toEqual({
      value: 472_000 / 600_000,
      basis: 'group-decoded-bytes',
    });
    expect(finding.severity).toBe('breach');
    expect(finding.contributorCount).toBe(2);
    expect(finding.unavailableCount).toBe(0);
  });

  it('counts the scripts it could not measure rather than dropping them', () => {
    const partial = capture([
      ...UNUSED.resources,
      res('https://sevre-et-loire.fr/c.js', 'script', 60_000, 180_000, null),
    ]);
    const finding = get(findings({ capture: partial }), 'unused-script-bytes');
    expect(finding.value).toBe(472_000);
    expect(finding.unavailableCount).toBe(1);
    expect(finding.contributorCount).toBe(2);
  });

  it('withholds the finding when coverage was not captured at all', () => {
    const noCoverage = capture([
      res('https://sevre-et-loire.fr/', 'document', 20_000, 60_000),
      res('https://sevre-et-loire.fr/a.js', 'script', 157_000, 470_000, null),
    ]);
    const result = findings({ capture: noCoverage });
    expect(ids(result)).not.toContain('unused-script-bytes');
    expect(result.withheld).toEqual([
      { id: 'unused-script-bytes', reason: 'coverage-not-captured', contributorCount: 1 },
    ]);
  });

  it('withholds nothing where there is no script to measure', () => {
    const result = findings({ capture: IMAGE_HEAVY });
    expect(result.withheld.map((entry) => entry.id)).not.toContain('unused-stylesheet-bytes');
  });
});

describe('findings: third parties', () => {
  it('counts distinct origins, not requests', () => {
    const page = capture([
      res('https://sevre-et-loire.fr/', 'document', 200_000, 600_000),
      res('https://player.dailymotion.com/embed.js', 'script', 100_000, 300_000, 10_000),
      res('https://player.dailymotion.com/poster.jpg', 'image', 40_000),
      res('https://tarteaucitron.io/load.js', 'script', 60_000, 200_000, 10_000),
    ]);
    const finding = get(findings({ capture: page }), 'third-party-weight');
    expect(finding.value).toBe(200_000);
    expect(finding.contributorCount).toBe(2);
    expect(finding.share!.value).toBe(0.5);
    expect(finding.severity).toBe('breach');
  });

  it('leaves an opaque origin on the first-party side, as the metric does', () => {
    const page = capture([
      res('https://sevre-et-loire.fr/', 'document', 400_000, 900_000),
      res('data:image/svg+xml;base64,AAAA', 'image', 300_000),
    ]);
    expect(ids(findings({ capture: page }))).not.toContain('third-party-weight');
  });
});

describe('findings: one heavy response', () => {
  it('raises a single resource carrying a quarter of the page', () => {
    const page = capture([
      res('https://sevre-et-loire.fr/', 'document', 100_000, 300_000),
      res('https://sevre-et-loire.fr/video-poster.png', 'image', 300_000),
      res('https://sevre-et-loire.fr/a.js', 'script', 300_000, 800_000, 100_000),
      res('https://sevre-et-loire.fr/b.js', 'script', 300_000, 800_000, 100_000),
    ]);
    const finding = get(findings({ capture: page }), 'heaviest-resource');
    expect(finding.contributorCount).toBe(1);
    expect(finding.evidence).toHaveLength(1);
    expect(finding.evidence[0]!.url).toBe('https://sevre-et-loire.fr/video-poster.png');
    expect(finding.share!.value).toBe(0.3);
  });
});

describe('findings: a published reference distribution', () => {
  const position = (percentile: number): ReferencePosition => ({
    metricId: 'dom_node_count',
    source: 'ecoindex',
    sourceVersion: '1.0',
    percentile,
    value: 1_830,
  });

  it('carries the source and version with the number', () => {
    const result = findings({ capture: IMAGE_HEAVY, reference: [position(90.2)] });
    const finding = get(result, 'reference-dom-node-count');
    expect(finding.severity).toBe('breach');
    expect(finding.value).toBe(1_830);
    expect(finding.share).toBeNull();
    expect(finding.reference).toEqual(position(90.2));
  });

  it('raises nothing for a page inside the reference distribution', () => {
    const result = findings({ capture: IMAGE_HEAVY, reference: [position(38.6)] });
    expect(ids(result)).not.toContain('reference-dom-node-count');
  });

  it('ignores a metric no finding is defined for', () => {
    const result = findings({
      capture: IMAGE_HEAVY,
      reference: [{ ...position(99), metricId: 'js_execution_ms' }],
    });
    expect(result.findings.filter((finding) => finding.reference !== null)).toEqual([]);
  });

  it('compares against nothing the caller did not supply', () => {
    const result = findings({ capture: IMAGE_HEAVY });
    expect(result.findings.every((finding) => finding.reference === null)).toBe(true);
  });
});

describe('findings: order and totals', () => {
  it('puts breaches before cautions and the heaviest first inside each', () => {
    const result = findings({ capture: IMAGE_HEAVY });
    const severities = result.findings.map((finding) => finding.severity);
    expect(severities).toEqual([...severities].sort((a, b) => (a === b ? 0 : a === 'breach' ? -1 : 1)));
    expect(ids(result)[0]).toBe('image-weight');
  });

  it('states what the shares are against', () => {
    expect(findings({ capture: IMAGE_HEAVY }).totalTransferredBytes).toBe(1_000_000);
  });

  it('takes the thresholds it is given', () => {
    const relaxed = findings({
      capture: IMAGE_HEAVY,
      thresholds: { ...PROVISIONAL_FINDING_THRESHOLDS, imageShare: { caution: 0.9, breach: 0.95 } },
    });
    expect(ids(relaxed)).not.toContain('image-weight');
  });

  it('refuses a capture whose service origin is not a url', () => {
    expect(() =>
      findings({ capture: { ...IMAGE_HEAVY, serviceOrigin: 'sevre-et-loire' } }),
    ).toThrow(/not a valid URL/);
  });

  it('raises nothing on an empty capture', () => {
    const empty = findings({ capture: capture([]) });
    expect(empty.findings).toEqual([]);
    expect(empty.withheld).toEqual([]);
    expect(empty.totalTransferredBytes).toBe(0);
  });
});

describe('findings: a share and a percentile are not sorted against each other', () => {
  it('puts what the page is made of before where it sits among other pages', () => {
    const result = findings({
      capture: IMAGE_HEAVY,
      reference: [
        {
          metricId: 'dom_node_count',
          source: 'ecoindex',
          sourceVersion: '1.0',
          percentile: 99,
          value: 4_000,
        },
      ],
    });
    // the percentile is the larger number and the images are the larger fact
    // about this page. it is not sorted first because 0.99 exceeds 0.7.
    expect(ids(result)[0]).toBe('image-weight');
    expect(ids(result)).toContain('reference-dom-node-count');
  });
});
