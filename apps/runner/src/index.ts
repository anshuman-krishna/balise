export { measure, type MeasureOptions, type MeasureResult, type RunFailure } from './measure.js';
export { captureRun, launchBrowser, DEFAULT_RUN_TIMEOUT_MS, type CaptureOptions, type CaptureResult } from './capture.js';
export {
  buildFingerprint,
  fingerprintsMatch,
  isAuditable,
  UNPINNED,
  type FingerprintInput,
} from './fingerprint.js';
export {
  PROFILES,
  profileFor,
  userAgentFor,
  USER_AGENT_TAG,
  type ProfileDefinition,
  type NetworkConditions,
} from './profiles.js';
export { DEFAULT_RUNS, MIN_RUNS, resolveRunCount, sufficientForAggregate } from './policy.js';
