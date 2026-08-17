import type { Assumption, MetricId, ModelInput, ModelOutput } from '@balise/schemas';

/**
 * Every model implements this interface. Adding a model never requires
 * touching engine code. A model never reaches outside its inputs: no
 * fetching, no config lookups, no environment variables.
 */
export interface CarbonModel {
  /** Stable identifier: 'ecoindex', 'swd', 'onebyte'. */
  readonly id: string;
  /** Semver of our implementation. */
  readonly version: string;
  /** Version of the published model itself. */
  readonly specVersion: string;
  /** Rendered verbatim on every surface where the model's output appears. */
  readonly assumptions: readonly Assumption[];
  /** What the model needs; validated before the call. */
  readonly inputs: readonly MetricId[];
  estimate(input: ModelInput): ModelOutput;
}
