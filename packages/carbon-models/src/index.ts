import type { MetricId, ModelInput } from '@balise/schemas';
import type { CarbonModel } from './types.js';
import { ecoindexModel } from './models/ecoindex.js';
import { swdModel } from './models/swd.js';
import { onebyteModel } from './models/onebyte.js';

export type { CarbonModel } from './types.js';
export { ecoindexModel, computeEcoIndexScore, ecoIndexGrade } from './models/ecoindex.js';
export { swdModel } from './models/swd.js';
export { onebyteModel } from './models/onebyte.js';

// The model index. Registering here is the only step besides creating the
// model file; engine code is never touched (CLAUDE.md section 21).
export const carbonModels: readonly CarbonModel[] = [ecoindexModel, swdModel, onebyteModel];

export function getCarbonModel(id: string): CarbonModel | undefined {
  return carbonModels.find((model) => model.id === id);
}

const INPUT_FIELD: Record<string, (input: ModelInput) => unknown> = {
  transferred_bytes: (input) => input.transferredBytes,
  request_count: (input) => input.requestCount,
  dom_node_count: (input) => input.domNodeCount,
};

/**
 * Validates that an input carries everything a model declares in `inputs`,
 * before the call (CLAUDE.md section 6).
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
