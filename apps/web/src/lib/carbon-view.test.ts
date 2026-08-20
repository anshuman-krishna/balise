import { describe, expect, it } from 'vitest';
import { carbonCanon } from '../fixtures/carbon-canon';
import {
  allModelBars,
  bandRangeText,
  carbonAsides,
  carbonDeltaRow,
  carbonPage,
  carbonProvenance,
  carbonScale,
  formatCarbon,
  modelsRan,
  referenceLabel,
  referenceModelRef,
} from './carbon-view';

describe('reading a page off the canon', () => {
  it('finds every page the canon holds', () => {
    for (const page of carbonCanon.pages) {
      expect(carbonPage(page.id).id).toBe(page.id);
    }
  });

  it('refuses rather than inventing an estimate for a page it has none for', () => {
    // @ts-expect-error a page id the canon does not carry
    expect(() => carbonPage('nowhere')).toThrow(/no carbon estimate/);
  });
});

describe('what a figure is allowed to look like', () => {
  it('writes three decimals, because two would round two pages to one figure', () => {
    expect(formatCarbon(0.075666184)).toBe('0.076');
    expect(formatCarbon(0.078072104)).toBe('0.078');
    expect(formatCarbon(0.075666184)).not.toBe(formatCarbon(0.078072104));
  });

  it('names the reference model and its version on every figure', () => {
    const label = referenceLabel(carbonPage('dashboard'));
    expect(label).toMatch(/^[a-z0-9-]+@\d+\.\d+\.\d+$/);
    expect(referenceModelRef(carbonPage('dashboard'))).toEqual({
      id: carbonCanon.referenceModelId,
      version: label.split('@')[1],
    });
  });

  it('states the grid on the provenance line, so a low-carbon grid cannot flatter silently', () => {
    const line = carbonProvenance(carbonPage('dashboard'));
    expect(line).toContain(referenceLabel(carbonPage('dashboard')));
    expect(line).toContain(String(carbonCanon.grid.gCO2ePerKwh));
    expect(line).toContain(carbonCanon.grid.zone);
  });

  it('writes the band as a range, never as one number', () => {
    const page = carbonPage('candidate');
    expect(bandRangeText(page)).toBe(`${formatCarbon(page.band.low)} – ${formatCarbon(page.band.high)}`);
  });

  it('scales the axis to hold the band, from a tick a person can name', () => {
    const page = carbonPage('candidate');
    const scale = carbonScale(page);
    expect(scale.min).toBe(0);
    expect(scale.max).toBeGreaterThan(page.band.high);
    expect(Math.round(scale.max * 100) % 5).toBe(0);
  });
});

describe('the models reported beside the band', () => {
  it('reports the score-derived model as its own grade and score', () => {
    const asides = carbonAsides(carbonPage('candidate'));
    expect(asides).toHaveLength(1);
    expect(asides[0]?.id).toBe('ecoindex');
    expect(asides[0]?.headline).toMatch(/^[A-G] · \d+\/100$/);
  });

  it('still gives its own gCO2e figure, so nothing looks dropped', () => {
    const aside = carbonAsides(carbonPage('candidate'))[0];
    const source = carbonPage('candidate').aside[0];
    expect(aside?.ownValue).toContain(formatCarbon(source?.value ?? 0));
    expect(aside?.note.length).toBeGreaterThan(0);
  });

  it('shows every model that ran, marked for whether it shares the band', () => {
    const bars = allModelBars(carbonPage('candidate'));
    expect(bars).toHaveLength(carbonCanon.assumptions.length);
    expect(bars.filter((bar) => bar.inBand).map((bar) => bar.id)).toEqual([...carbonCanon.bandModelIds]);
    expect(bars.filter((bar) => !bar.inBand).map((bar) => bar.id)).toEqual([...carbonCanon.asideModelIds]);
  });

  it('gives a model with no published uncertainty no band of its own', () => {
    for (const bar of allModelBars(carbonPage('candidate'))) {
      // an invented width would read as a stated one.
      if (bar.low === null) expect(bar.high).toBeNull();
    }
  });

  it('names every model that ran, with its version, on the fingerprint row', () => {
    const row = modelsRan();
    for (const entry of carbonCanon.assumptions) {
      expect(row).toContain(`${entry.id}@${entry.version}`);
    }
  });
});

describe('the estimate delta on the comparison table', () => {
  const row = carbonDeltaRow();

  it('reads both sides from the reference model', () => {
    expect(row).not.toBeNull();
    expect(row?.before).toBe(carbonPage('baseline').band.reference);
    expect(row?.after).toBe(carbonPage('candidate').band.reference);
    expect(row?.delta).toBeCloseTo((row?.after ?? 0) - (row?.before ?? 0), 12);
  });

  it('bands the delta on what the models each make of the change', () => {
    // they disagree about the size of a regression as much as about its level,
    // and that disagreement is the band, not an averaged single figure.
    expect(row?.modelCount).toBe(carbonCanon.bandModelIds.length);
    expect(row?.bandLow).toBeLessThan(row?.bandHigh ?? 0);
    expect(row?.bandLow).toBeLessThanOrEqual(row?.delta ?? 0);
    expect(row?.bandHigh).toBeGreaterThanOrEqual(row?.delta ?? 0);
  });

  it('carries the measurement floor through the model rather than inventing one', () => {
    const candidate = carbonPage('candidate').noise;
    const baseline = carbonPage('baseline').noise;
    const expected =
      (candidate === null ? 0 : (candidate.high - candidate.low) / 2) +
      (baseline === null ? 0 : (baseline.high - baseline.low) / 2);
    expect(row?.floor).toBeCloseTo(expected, 12);
    expect(row?.floor).toBeGreaterThan(0);
  });
});
