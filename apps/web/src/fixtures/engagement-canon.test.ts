import { describe, expect, it } from 'vitest';
import { classifyDelta } from '@balise/measure-core';
import { buildEngagementCanon } from '../../scripts/engagement-canon-source';
import { canonMetric } from '../../scripts/measurement-canon-source';
import { engagementCanon } from './engagement-canon';
import { criteriaCanon } from './criteria-canon';
import { carbonCanon } from './carbon-canon';

const built = buildEngagementCanon();

function engagement(id: string) {
  const found = engagementCanon.engagements.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`no engagement ${id}`);
  return found;
}

describe('the generated engagement canon', () => {
  it('matches what the derivation produces', () => {
    expect(JSON.parse(JSON.stringify(engagementCanon))).toEqual(JSON.parse(JSON.stringify(built)));
  });

  it('gives an engagement nobody signed no status and no gauge', () => {
    // the execution report reported the supplier nonTenu on this one, which is
    // a breach of a contractual obligation, for a commitment the tender left
    // unchecked and the contract never carried.
    const proposal = engagement('third-party-share');
    expect(proposal.inOffer).toBe(false);
    expect(proposal.status).toBeNull();
    expect(proposal.gaugePct).toBeNull();
    // it is still shown, and still says plainly that it is not met today.
    expect(proposal.margin.kind).toBe('notMet');
  });

  it('carries every signed engagement on all three surfaces and nothing else', () => {
    expect(engagementCanon.offered.map((entry) => entry.id)).toEqual(
      engagementCanon.engagements.filter((entry) => entry.inOffer).map((entry) => entry.id),
    );
    for (const entry of engagementCanon.offered) {
      expect(entry.status).not.toBeNull();
      expect(entry.gaugePct).not.toBeNull();
    }
    expect(engagementCanon.proposedOnly).toHaveLength(1);
  });

  it('computes every margin from one definition', () => {
    // the tender said 11 % of headroom on the pair the contract said 10 % on.
    // (1400 - 1258) / 1400 is 10.1; over the measured value it is 11.3, which
    // is where the other number came from.
    const weight = engagement('page-weight');
    expect(weight.margin).toEqual({
      kind: 'headroom',
      pct: ((weight.threshold - weight.measured.value) / weight.threshold) * 100,
    });
    expect((weight.margin as { pct: number }).pct).toBeCloseTo(10.14, 2);
  });

  it('never lets a gauge and the number beside it disagree', () => {
    for (const entry of engagementCanon.offered) {
      expect(entry.gaugePct!).toBeGreaterThanOrEqual(0);
      expect(entry.gaugePct!).toBeLessThanOrEqual(100);
    }
    // the tracker filled the conformity gauge to 0 and the report filled the
    // same gauge to 78, both claiming to read the assessments.
    const conformity = engagement('rgesn-conformity');
    expect(conformity.gaugePct).toBeCloseTo((conformity.measured.value / 75) * 100, 10);
    expect(Math.round(conformity.gaugePct!)).toBe(78);
  });

  it('reads the conformity rate off the assessments, unrounded', () => {
    const conformity = engagement('rgesn-conformity');
    expect(conformity.measured.value).toBeCloseTo(
      (criteriaCanon.completion.conforme / criteriaCanon.completion.applicable) * 100,
      10,
    );
    // stored raw; the 59 % on the screens is a rounding at the edge.
    expect(Number.isInteger(conformity.measured.value)).toBe(false);
  });

  it('states a band and a reference model wherever the figure is an estimate', () => {
    const carbon = engagement('carbon-per-visit');
    expect(carbon.measured.band).not.toBeNull();
    expect(carbon.measured.model).not.toBeNull();
    expect(carbon.measured.model!.id).toBe(engagementCanon.referenceModelId);
    // and it is the same estimate the rest of the product shows for that page.
    const page = carbonCanon.pages.find((entry) => entry.id === 'dashboard')!;
    expect(carbon.measured.value).toBeCloseTo(page.band.reference, 10);
    expect(carbon.measured.band!.low).toBeCloseTo(page.band.low, 10);
    expect(carbon.measured.band!.high).toBeCloseTo(page.band.high, 10);

    // a measured metric is not an estimate and carries no band at all.
    expect(engagement('page-weight').measured.band).toBeNull();
    expect(engagement('page-weight').measured.mad).toBe(
      canonMetric('service', 'transferred_bytes').mad,
    );
  });

  it('draws a line only from a history the scenario kept', () => {
    expect(engagement('page-weight').history).toHaveLength(24);
    expect(engagement('carbon-per-visit').history).toHaveLength(24);
    // no conformity history is held, so no line and no trend.
    expect(engagement('rgesn-conformity').history).toBeNull();
    expect(engagement('rgesn-conformity').trend).toBeNull();
    expect(engagement('quarterly-report').history).toBeNull();
  });

  it('classifies every trend through the kernel against the scenario floor', () => {
    const weight = engagement('page-weight');
    const metric = canonMetric('service', 'transferred_bytes');
    const oldest = metric.history![0]!;
    const shared = { metricId: metric.metricId, unit: metric.unit, sampleCount: metric.sampleCount };
    const delta = classifyDelta(
      { ...shared, median: oldest.median, mad: oldest.mad, min: oldest.low, max: oldest.high },
      { ...shared, median: metric.median, mad: metric.mad, min: metric.min, max: metric.max },
      metric.floor,
    );
    expect(weight.trend!.classification).toBe(delta.classification);
  });

  it('derives the points a proposal falls short by', () => {
    // the tender carried `warningPoints: 8` beside a sentence that reads it.
    const proposal = engagement('third-party-share');
    expect(proposal.margin.kind).toBe('notMet');
    expect((proposal.margin as { points: number }).points).toBeCloseTo(
      proposal.measured.value - proposal.threshold,
      10,
    );
    expect(Math.round((proposal.margin as { points: number }).points)).toBe(8);
  });
});
