import { describe, expect, it } from 'vitest';
import { GridIntensity } from '@balise/schemas';
import { asideModels, bandModels, carbonModels } from '@balise/carbon-models';
import { buildCarbonCanon } from '../../scripts/carbon-canon-source';
import { carbonCanon } from './carbon-canon';

// the generated file is data, and data drifts. this estimates every page again
// and holds the checked-in copy to it, so a hand edit, a model change or a new
// model cannot pass unnoticed.
const built = buildCarbonCanon();

describe('the generated carbon canon', () => {
  it('matches what the models estimate', () => {
    expect(JSON.parse(JSON.stringify(carbonCanon.pages))).toEqual(built.pages);
    expect(JSON.parse(JSON.stringify(carbonCanon.assumptions))).toEqual(built.assumptions);
  });

  it('states the grid it assumed, in a shape the contract accepts', () => {
    expect(() => GridIntensity.parse(carbonCanon.grid)).not.toThrow();
    expect(carbonCanon.grid.source).toBe('declared-default');
    expect(carbonCanon.grid.zone).toBe('FR');
  });
});

describe('which models share the band', () => {
  it('splits by what each model declares, not by a list of names', () => {
    expect([...carbonCanon.bandModelIds]).toEqual(bandModels().map((model) => model.id));
    expect([...carbonCanon.asideModelIds]).toEqual(asideModels().map((model) => model.id));
  });

  it('bands the energy models and sets the score-derived one aside', () => {
    for (const model of carbonModels) {
      const banded = carbonCanon.bandModelIds.some((id) => id === model.id);
      expect(banded).toBe(model.method === 'energy');
    }
  });

  it('runs every model on every page, whether or not it shares the band', () => {
    for (const page of carbonCanon.pages) {
      const ran = [...page.inBand, ...page.aside].map((output) => output.id).sort();
      expect(ran).toEqual(carbonModels.map((model) => model.id).sort());
    }
  });

  it('never reconciles: the band is the models own spread, marked at the reference', () => {
    for (const page of carbonCanon.pages) {
      const values = page.inBand.map((output) => output.value);
      expect(page.band.low).toBe(Math.min(...values));
      expect(page.band.high).toBe(Math.max(...values));
      expect(page.band.modelCount).toBe(page.inBand.length);
      const reference = page.inBand.find((output) => output.isReference);
      expect(reference).toBeDefined();
      expect(page.band.reference).toBe(reference?.value);
    }
  });

  it('marks exactly one reference model on every page', () => {
    for (const page of carbonCanon.pages) {
      const marked = [...page.inBand, ...page.aside].filter((output) => output.isReference);
      expect(marked).toHaveLength(1);
      expect(marked[0]?.id).toBe(carbonCanon.referenceModelId);
    }
  });
});

describe('what every figure has to carry', () => {
  it('carries a version for every model that produced a value', () => {
    for (const page of carbonCanon.pages) {
      for (const output of [...page.inBand, ...page.aside]) {
        expect(output.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(output.specVersion.length).toBeGreaterThan(0);
      }
    }
  });

  it('publishes every assumption of every model that ran', () => {
    expect(carbonCanon.assumptions.map((entry) => entry.id).sort()).toEqual(
      carbonModels.map((model) => model.id).sort(),
    );
    for (const entry of carbonCanon.assumptions) {
      expect(entry.assumptions.length).toBeGreaterThan(0);
      for (const assumption of entry.assumptions) {
        expect(assumption.textFr.length).toBeGreaterThan(0);
        expect(assumption.textEn.length).toBeGreaterThan(0);
      }
    }
  });

  it('draws a noise region only where a floor is established', () => {
    const scan = carbonCanon.pages.find((page) => page.id === 'scan');
    // one cold pass, no history: the scan reports no noise region rather than
    // one it did not measure.
    expect(scan?.noise).toBeNull();

    for (const page of carbonCanon.pages) {
      if (page.noise === null) continue;
      expect(page.noise.low).toBeLessThan(page.band.reference);
      expect(page.noise.high).toBeGreaterThan(page.band.reference);
      expect(page.noise.floorBytes).toBeGreaterThan(0);
    }
  });
});

describe('the disagreement the band exists to show', () => {
  it('keeps the grid-blind model out of a grid-sensitive band', () => {
    const banded = carbonCanon.pages[0]?.inBand ?? [];
    const aside = carbonCanon.pages[0]?.aside ?? [];
    // ecoindex reads its gCO2e off a score. on a french grid it lands an order
    // of magnitude above the energy models, which is the whole reason 10.1
    // keeps it off the same axis rather than averaging it in.
    const reference = banded.find((output) => output.isReference);
    const scoreDerived = aside.find((output) => output.method === 'score-derived');
    expect(scoreDerived?.value).toBeGreaterThan((reference?.value ?? 0) * 10);
    expect(scoreDerived?.grade).not.toBeNull();
  });
});
