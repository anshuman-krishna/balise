import type { Assumption, MetricId, ModelInput, ModelOutput } from '@balise/schemas';

/**
 * every model implements this interface. adding a model never requires
 * touching engine code. a model never reaches outside its inputs: no
 * fetching, no config lookups, no environment variables.
 */
export interface CarbonModel {
  /** stable identifier: 'ecoindex', 'swd', 'onebyte'. */
  readonly id: string;
  /** semver of our implementation. */
  readonly version: string;
  /** version of the published model itself. */
  readonly specVersion: string;
  /** rendered verbatim on every surface where the model's output appears. */
  readonly assumptions: readonly Assumption[];
  /** what the model needs; validated before the call. */
  readonly inputs: readonly MetricId[];
  estimate(input: ModelInput): ModelOutput;
}
