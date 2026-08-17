import { describe, expect, it } from 'vitest';
import type { ModelInput } from '@balise/schemas';
import { assertModelInputs, carbonModels, getCarbonModel } from '../src/index.js';

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
