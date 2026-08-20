import { describe, expect, it } from 'vitest';
import { PROVISIONAL_FINDING_THRESHOLDS } from '@balise/measure-core';
import { catalogs } from '@balise/i18n';
import { corpusCanon } from '../fixtures/corpus-canon';
import {
  alertFor,
  AUDITED_DOMAIN,
  benchmark,
  confidenceTone,
  corpusRow,
  corpusRows,
  declarationText,
  declarationTone,
  fleetRows,
  fleetSummary,
  hostingText,
  trendColor,
  trendText,
  weightText,
} from './corpus-view';

const fr = catalogs.fr;

describe('the corpus, read for a screen', () => {
  it('shows the agency its own services and no others', () => {
    const fleet = fleetRows();
    expect(fleet.length).toBeGreaterThan(0);
    expect(fleet.length).toBeLessThan(corpusRows().length);
    for (const row of fleet) {
      expect(row.inFleet).toBe(true);
    }
    // another agency's service is in the public index and not in the fleet.
    expect(fleet.map((row) => row.domain)).not.toContain('musees-selo.fr');
  });

  it('writes every weight through the one measured-value formatter', () => {
    // the same floor used to read 7.4 KB on one screen and 7 KB on another.
    expect(weightText(corpusRow(AUDITED_DOMAIN))).toBe('842 KB');
    expect(weightText(corpusRow('craonnais.fr'))).toBe('210 KB');
  });

  it('never draws a confidence grade in the pass colour', () => {
    for (const row of corpusRows()) {
      expect(confidenceTone(row.confidence)).not.toBe('ok');
    }
  });

  it('prints no percentage at all for a sub-floor movement', () => {
    const flat = corpusRows().find((row) => row.trend.classification === 'no-significant-change')!;
    expect(trendText(flat, fr)).toBe(fr.observatory.trendFlat);
    expect(trendText(flat, fr)).not.toMatch(/[0-9]/);
    // it did move, and the floor says the movement is not readable.
    expect(flat.trend.after).not.toBe(flat.trend.before);
    expect(trendColor(flat.trend.classification)).toBe('var(--text-secondary)');
    expect(trendColor('regression')).toBe('var(--breach)');
    expect(trendColor('improvement')).toBe('var(--conforme)');
  });

  it('reports no percentage at all where there is no floor', () => {
    const undetermined = corpusRows().find((row) => row.trend.classification === 'indeterminate')!;
    expect(trendText(undetermined, fr)).toBe(fr.observatory.trendNa);
    // the movement is real and is still not reported, because nothing on that
    // scenario can be told from noise yet.
    expect(undetermined.trend.after).not.toBe(undetermined.trend.before);
  });

  it('reads a declaration against the year the referential gives it', () => {
    const expired = corpusRows().find((row) => row.declaration.state === 'expired')!;
    expect(expired.declaration.ageDays).toBeGreaterThan(corpusCanon.declarationExpiredDays);
    expect(declarationTone(expired)).toBe('breach');
    // the version this replaced drew 426 days in caution.
    expect(declarationText(expired, fr)).toContain(String(expired.declaration.ageDays));
    expect(declarationTone(corpusRow('craonnais.fr'))).toBe('ok');
  });

  it('says plainly when a host was never checked', () => {
    const unchecked = corpusRows().find((row) => row.hosting.state === 'unchecked')!;
    expect(hostingText(unchecked, fr)).toBe(fr.observatory.hosting.unchecked);
    expect(unchecked.hosting.checkedAt).toBeNull();
  });

  it('raises the alert from something measured or something recorded', () => {
    const heavy = corpusRow('eau-selo.fr');
    expect(heavy.measured.thirdPartySharePct / 100).toBeGreaterThanOrEqual(
      PROVISIONAL_FINDING_THRESHOLDS.thirdPartyShare.breach,
    );
    expect(alertFor(heavy, fr).text).toContain('41');

    // no floor on the scenario, so the alert says that and not "runner
    // unstable 3 d", which is what the column carried before.
    const noFloor = corpusRows().find((row) => row.trend.classification === 'indeterminate')!;
    expect([fr.fleet.alerts.noFloor, fr.fleet.alerts.declarationExpired.split(' ·')[0]!]).toContain(
      alertFor(noFloor, fr).text.split(' ·')[0],
    );
  });

  it('counts the summary strip off the rows under it', () => {
    const summary = fleetSummary(fr);
    const rows = fleetRows();
    expect(summary.breaches).toBe(rows.filter((row) => alertFor(row, fr).tone === 'breach').length);
    expect(summary.staleDeclarations).toBe(
      rows.filter((row) => row.declaration.state === 'expired' || row.declaration.state === 'none')
        .length,
    );
  });

  it('places every bar, the marker and the median on one computed axis', () => {
    const chart = benchmark(fr);
    expect(chart.bars.reduce((sum, bar) => sum + bar.count, 0)).toBe(corpusRows().length);
    for (const bar of chart.bars) {
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.x + bar.width).toBeLessThanOrEqual(1.0000001);
      expect(bar.height).toBeLessThanOrEqual(1);
    }
    expect(chart.marker).toBeGreaterThan(0);
    expect(chart.marker).toBeLessThanOrEqual(1);
    // the marker is where the audited service actually sits on that axis.
    expect(chart.marker).toBeCloseTo(
      corpusRow(AUDITED_DOMAIN).measured.transferredBytes / corpusCanon.benchmark.max,
      10,
    );
    // the caption states the corpus, and the corpus is what was measured.
    expect(chart.caption).toContain(String(corpusCanon.size));
    expect(chart.caption).toContain(String(corpusRow(AUDITED_DOMAIN).rank));
  });
});
