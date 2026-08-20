import { describe, expect, it } from 'vitest';
import { findings } from '@balise/measure-core';
import { ecoIndexPercentile } from '@balise/carbon-models';
import { buildFindingsCanon } from '../../scripts/findings-canon-source';
import { canonCapture } from '../../scripts/measurement-canon-source';
import { findingsCanon } from './findings-canon';
import { measurementCanon } from './measurement-canon';

// the generated file is data, and data drifts. this raises the findings again
// from the same captures and holds the checked-in copy to it.
const built = buildFindingsCanon();

describe('the generated findings canon', () => {
  it('matches what the engine raises', () => {
    expect(JSON.parse(JSON.stringify(findingsCanon.pages))).toEqual(
      JSON.parse(JSON.stringify(built.pages)),
    );
  });

  it('reads every finding off the capture the same run publishes', () => {
    for (const [id, page] of Object.entries(findingsCanon.pages)) {
      const capture = canonCapture(id);
      const recomputed = findings({ capture, reference: page.reference });
      expect(JSON.parse(JSON.stringify(recomputed))).toEqual(
        JSON.parse(JSON.stringify(page.result)),
      );
      // the page the shares are against is the page the metric row states.
      const aggregation = measurementCanon.aggregations.find((entry) => entry.id === id)!;
      const transferred = aggregation.metrics.find(
        (metric) => metric.metricId === 'transferred_bytes',
      )!;
      expect(page.result.totalTransferredBytes).toBe(transferred.median);
    }
  });

  it('names the published distribution beside every position read against it', () => {
    for (const page of Object.values(findingsCanon.pages)) {
      for (const position of page.reference) {
        expect(position.source).toBe(findingsCanon.referenceSource.id);
        expect(position.sourceVersion).toBe(findingsCanon.referenceSource.specVersion);
        expect(position.percentile).toBeCloseTo(
          ecoIndexPercentile(position.metricId, position.value)!,
          10,
        );
      }
    }
  });

  it('states no saving anywhere', () => {
    // the engine has nowhere to put one; this holds the shape of the published
    // data to that, because a saving is the one number this surface must not
    // carry.
    const serialised = JSON.stringify(findingsCanon);
    expect(serialised).not.toContain('saving');
    expect(serialised).not.toContain('potential');
  });
});

describe('the free scan', () => {
  const scan = findingsCanon.pages.scan!;

  it('withholds the coverage findings rather than reporting zero unused bytes', () => {
    // coverage is off by default on a measured run, so the scan measured no
    // execution. reporting 0 unused bytes would be a claim; withholding is
    // what happened.
    expect(scan.result.withheld.map((entry) => entry.reason)).toEqual([
      'coverage-not-captured',
      'coverage-not-captured',
    ]);
    expect(scan.result.findings.map((finding) => finding.id)).not.toContain('unused-script-bytes');
  });

  it('raises what the capture holds and nothing about formats or dimensions', () => {
    // the sentences this replaced said "four unresized png images" and "six
    // unsubset font weights". a capture holds neither a format decision nor a
    // rendered size.
    expect(scan.result.findings.map((finding) => finding.id)).toEqual([
      'image-weight',
      'heaviest-resource',
      'reference-dom-node-count',
      'font-weight',
    ]);
  });

  it('carries evidence that is in the capture', () => {
    const urls = new Set(canonCapture('scan').resources.map((resource) => resource.url));
    for (const finding of scan.result.findings) {
      for (const entry of finding.evidence) {
        expect(urls.has(entry.url)).toBe(true);
      }
    }
  });
});
