import { describe, expect, it } from 'vitest';
import { catalogs } from '@balise/i18n';
import { engagementCanon } from '../fixtures/engagement-canon';
import {
  deliverySquares,
  engagement,
  marginColor,
  marginText,
  measuredText,
  proposedEngagements,
  signedEngagements,
  statusText,
  thresholdText,
  trendColor,
  trendLine,
  valueText,
} from './engagement-view';

const fr = catalogs.fr;

describe('the engagements, read for a screen', () => {
  it('shows the contract only what was signed, and the tender everything proposed', () => {
    expect(signedEngagements().length).toBeLessThan(proposedEngagements().length);
    for (const row of signedEngagements()) {
      expect(row.inOffer).toBe(true);
    }
    expect(proposedEngagements().map((row) => row.id)).toContain('third-party-share');
    expect(signedEngagements().map((row) => row.id)).not.toContain('third-party-share');
  });

  it('never gives an unsigned proposal a word from the contract', () => {
    const proposal = engagement('third-party-share');
    expect(statusText(proposal, fr)).toBe(fr.engagements.notSigned);
    expect(statusText(proposal, fr)).not.toBe(fr.engagements.status.nonTenu);
  });

  it('writes every measured value through the shared formatter', () => {
    expect(measuredText(engagement('page-weight'))).toBe('1 258 KB');
    expect(thresholdText(engagement('page-weight'), fr)).toBe('≤ 1 400 KB');
    expect(valueText(engagement('carbon-per-visit'), 0.076)).toBe('0.076');
    // a process engagement has no measured value, and says so rather than
    // printing a zero.
    expect(measuredText(engagement('quarterly-report'))).toBe('–');
    expect(thresholdText(engagement('quarterly-report'), fr)).toContain('4');
  });

  it('states one margin per engagement, in the colour its kind earns', () => {
    expect(marginText(engagement('page-weight'), fr)).toContain('10');
    expect(marginColor(engagement('page-weight'))).toBe('var(--conforme)');
    expect(marginColor(engagement('rgesn-conformity'))).toBe('var(--caution)');
    expect(marginColor(engagement('third-party-share'))).toBe('var(--breach)');
  });

  it('draws a trend only where a history exists, and colours it only on a change', () => {
    const weight = engagement('page-weight');
    const line = trendLine(weight, 100, 20)!;
    expect(line).not.toBeNull();
    expect(line.points.split(' ')).toHaveLength(weight.history!.length);
    // a plateau is not a change, so it is not coloured as one.
    expect(line.classification).toBe('no-significant-change');
    expect(trendColor(line.classification)).toBe('var(--text-secondary)');

    // no conformity history is held, so no line is offered to draw.
    expect(trendLine(engagement('rgesn-conformity'), 100, 20)).toBeNull();
    expect(trendLine(engagement('quarterly-report'), 100, 20)).toBeNull();
  });

  it('keeps every trend point inside the box it was given', () => {
    const line = trendLine(engagement('carbon-per-visit'), 106, 16)!;
    for (const pair of line.points.split(' ')) {
      const [x, y] = pair.split(',').map(Number) as [number, number];
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(106);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(16);
    }
  });

  it('counts deliveries for a process engagement and nothing else', () => {
    expect(deliverySquares(engagement('quarterly-report'))).toEqual({ delivered: 2, total: 4 });
    expect(deliverySquares(engagement('page-weight'))).toBeNull();
  });

  it('publishes the definition the margins were computed with', () => {
    expect(engagementCanon.headroomDefinitionFr).toContain('seuil');
  });
});
