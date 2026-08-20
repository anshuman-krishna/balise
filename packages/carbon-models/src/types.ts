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
  /**
   * what the estimate actually responds to, declared as data in the same way
   * assumptions are. two models share a gCO2e band only when they estimate the
   * same quantity, and a model blind to where the electricity came from is not
   * estimating the same quantity as one that is not.
   *
   * this is a claim the model makes about itself, and the package's tests hold
   * it to it: a model that declares a sensitivity it does not have fails.
   */
  readonly sensitivity: ModelSensitivity;
  /**
   * how the model arrives at its figure. an energy model multiplies data
   * volume by an energy intensity and an emissions intensity. a score-derived
   * one reads the figure off its own rating of the page, which is a different
   * quantity however similar the unit looks.
   *
   * only energy models share a gCO2e band. see METHODOLOGY.md 10.1.
   */
  readonly method: ModelMethod;
  estimate(input: ModelInput): ModelOutput;
}

export type ModelMethod = 'energy' | 'score-derived';

export interface ModelSensitivity {
  /** the estimate changes when grid intensity changes. */
  readonly gridIntensity: boolean;
  /** the estimate changes when the hosting is green rather than grey. */
  readonly greenHosting: boolean;
}
