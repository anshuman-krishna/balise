export { median, medianAbsoluteDeviation } from './statistics.js';
export { extractMetrics } from './extract.js';
export { isThirdParty, originOf } from './origin.js';
export {
  summariseResources,
  coverageApplies,
  type ResourceGroup,
  type ResourceSummary,
} from './resources.js';
export {
  executedRanges,
  unusedBytes,
  unusedBytesFromCoverage,
  type CoverageFunction,
  type SourceRange,
} from './coverage.js';
export { aggregateRuns, getAggregatedMetric, medianRunIndex } from './aggregate.js';
export {
  computeNoiseFloor,
  PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR,
  NOISE_FLOOR_MIN_HISTORY,
  type NoiseFloorOptions,
} from './noise-floor.js';
export { classifyDelta } from './classify-delta.js';
export { gradeConfidence, CONFIDENCE_THRESHOLDS, type ConfidenceContext } from './confidence.js';
