import type { MetricId, ModelInput } from '@balise/schemas';
import type { CarbonModel } from './types.js';
import { ecoindexModel } from './models/ecoindex.js';
import { swdModel } from './models/swd.js';
import { onebyteModel } from './models/onebyte.js';

export type { CarbonModel, ModelMethod, ModelSensitivity } from './types.js';
export {
  ecoindexModel,
  computeEcoIndexScore,
  ecoIndexGrade,
  ecoIndexPercentile,
} from './models/ecoindex.js';
export { swdModel } from './models/swd.js';
export { onebyteModel } from './models/onebyte.js';

// the model index. registering here is the only step besides creating the
// model file; engine code is never touched (the operating manual section 21).
export const carbonModels: readonly CarbonModel[] = [ecoindexModel, swdModel, onebyteModel];

export function getCarbonModel(id: string): CarbonModel | undefined {
  return carbonModels.find((model) => model.id === id);
}

/**
 * the models whose gCO2e output may share one band, from what each declares
 * about itself rather than from a list of names here.
 *
 * an energy model and a score-derived one do not estimate the same quantity,
 * however alike the unit looks, and drawing them on one axis states a
 * comparison that is not true. every model still runs and every model's output
 * is still shown; this governs only which outputs share an axis. see
 * METHODOLOGY.md 10.1.
 */
export function bandModels(models: readonly CarbonModel[] = carbonModels): readonly CarbonModel[] {
  return models.filter((model) => model.method === 'energy');
}

/** the models reported on their own terms, beside the band rather than in it. */
export function asideModels(models: readonly CarbonModel[] = carbonModels): readonly CarbonModel[] {
  const inBand = new Set(bandModels(models).map((model) => model.id));
  return models.filter((model) => !inBand.has(model.id));
}

const INPUT_FIELD: Record<string, (input: ModelInput) => unknown> = {
  transferred_bytes: (input) => input.transferredBytes,
  request_count: (input) => input.requestCount,
  dom_node_count: (input) => input.domNodeCount,
};

/**
 * validates that an input carries everything a model declares in `inputs`,
 * before the call (the operating manual section 6).
 */
export function assertModelInputs(model: CarbonModel, input: ModelInput): void {
  const missing = model.inputs.filter((metricId: MetricId) => {
    const accessor = INPUT_FIELD[metricId];
    return accessor !== undefined && accessor(input) === undefined;
  });
  if (missing.length > 0) {
    throw new Error(`model ${model.id} is missing required inputs: ${missing.join(', ')}`);
  }
}
