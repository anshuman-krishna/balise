import { describe, expect, it } from 'vitest';
import type { ModelInput } from '@balise/schemas';
import { asideModels, assertModelInputs, bandModels, carbonModels, getCarbonModel } from '../src/index.js';

const fullInput: ModelInput = {
  transferredBytes: 1_258_000,
  requestCount: 84,
  domNodeCount: 2140,
  gridIntensity: { gCO2ePerKwh: 56, source: 'declared-default', zone: 'FR' },
  greenHostingFactor: 1,
};

describe('model registry', () => {
  it('exposes the three V0 models', () => {
    expect(carbonModels.map((model) => model.id).sort()).toEqual(['ecoindex', 'onebyte', 'swd']);
  });

  it('finds a model by id', () => {
    expect(getCarbonModel('swd')?.specVersion).toBe('4.0');
    expect(getCarbonModel('nope')).toBeUndefined();
  });

  it('every model carries id, versions, assumptions and inputs', () => {
    for (const model of carbonModels) {
      expect(model.id.length).toBeGreaterThan(0);
      expect(model.version.length).toBeGreaterThan(0);
      expect(model.specVersion.length).toBeGreaterThan(0);
      expect(model.assumptions.length).toBeGreaterThan(0);
      expect(model.inputs.length).toBeGreaterThan(0);
    }
  });

  it('models disagree and are not reconciled', () => {
    const values = carbonModels.map((model) => {
      assertModelInputs(model, fullInput);
      return model.estimate(fullInput).value;
    });
    expect(new Set(values).size).toBe(values.length);
  });

  it('assertModelInputs names what is missing', () => {
    const ecoindex = getCarbonModel('ecoindex');
    if (!ecoindex) throw new Error('ecoindex missing');
    const bare: ModelInput = {
      transferredBytes: 1_000,
      gridIntensity: { gCO2ePerKwh: 56, source: 'declared-default', zone: 'FR' },
      greenHostingFactor: 0,
    };
    expect(() => assertModelInputs(ecoindex, bare)).toThrow('request_count');
    expect(() => assertModelInputs(ecoindex, bare)).toThrow('dom_node_count');
    expect(() => assertModelInputs(ecoindex, fullInput)).not.toThrow();
  });
});

describe('what a model declares about what it responds to', () => {
  // a sensitivity is a claim, and these hold every model to its own claim.
  // the band is composed from these declarations, so a model that lies about
  // one would quietly widen or narrow the figure the product is judged on.
  const withGrid = (gCO2ePerKwh: number): ModelInput => ({
    ...fullInput,
    gridIntensity: { ...fullInput.gridIntensity, gCO2ePerKwh },
  });

  it('changes with grid intensity exactly when it says it does', () => {
    for (const model of carbonModels) {
      const low = model.estimate(withGrid(20)).value;
      const high = model.estimate(withGrid(500)).value;
      expect(low !== high, `${model.id} declares gridIntensity ${String(model.sensitivity.gridIntensity)}`).toBe(
        model.sensitivity.gridIntensity,
      );
    }
  });

  it('changes with hosting exactly when it says it does', () => {
    for (const model of carbonModels) {
      const green = model.estimate({ ...fullInput, greenHostingFactor: 1 }).value;
      const grey = model.estimate({ ...fullInput, greenHostingFactor: 0 }).value;
      expect(green !== grey, `${model.id} declares greenHosting ${String(model.sensitivity.greenHosting)}`).toBe(
        model.sensitivity.greenHosting,
      );
    }
  });

  it('every model declares both, so the band is never composed from a default', () => {
    for (const model of carbonModels) {
      expect(typeof model.sensitivity.gridIntensity).toBe('boolean');
      expect(typeof model.sensitivity.greenHosting).toBe('boolean');
      expect(['energy', 'score-derived']).toContain(model.method);
    }
  });

  it('finds only one model that applies the visitor grid at all', () => {
    // stated because it matters: on a french grid the band is carried by the
    // one model that knows the grid is french.
    expect(carbonModels.filter((model) => model.sensitivity.gridIntensity).map((m) => m.id)).toEqual(['swd']);
  });
});

describe('which models share a band', () => {
  it('bands the models that respond to grid and hosting, and only those', () => {
    expect(bandModels().map((model) => model.id).sort()).toEqual(['onebyte', 'swd']);
  });

  it('reports the rest on their own terms, beside the band', () => {
    expect(asideModels().map((model) => model.id)).toEqual(['ecoindex']);
  });

  it('splits every registered model into exactly one of the two', () => {
    expect(bandModels().length + asideModels().length).toBe(carbonModels.length);
  });

  it('selects from the declaration, never from a list of names', () => {
    // a hypothetical score-derived model is kept out of the band without this
    // package being edited.
    const pretend = { ...carbonModels[1]!, id: 'pretend', method: 'score-derived' as const };
    const models = [...carbonModels, pretend];
    expect(bandModels(models).map((model) => model.id)).not.toContain('pretend');
    expect(asideModels(models).map((model) => model.id)).toContain('pretend');
  });

  it('bands a model that hard-codes its intensity, and says it does', () => {
    // 1byte is an energy model that never applies the visitor's grid. that is
    // a caveat carried in its assumptions, not a reason to draw it elsewhere:
    // it still estimates gCO2e from energy, which ecoindex does not.
    const onebyte = getCarbonModel('onebyte')!;
    expect(onebyte.method).toBe('energy');
    expect(onebyte.sensitivity.gridIntensity).toBe(false);
    expect(bandModels().map((model) => model.id)).toContain('onebyte');
    expect(onebyte.assumptions.some((a) => a.textEn.includes('visitor grid intensity is not applied'))).toBe(true);
  });

  it('keeps every score-derived model out of the band', () => {
    for (const model of asideModels()) {
      expect(model.method).toBe('score-derived');
    }
  });

  it('leaves the band narrower than the full disagreement, and says nothing is hidden', () => {
    const all = carbonModels.map((model) => model.estimate(fullInput).value);
    const banded = bandModels().map((model) => model.estimate(fullInput).value);
    expect(Math.max(...banded) - Math.min(...banded)).toBeLessThan(Math.max(...all) - Math.min(...all));
    // and every model still ran: nothing is dropped, only drawn elsewhere.
    expect(all.length).toBe(carbonModels.length);
  });
});
