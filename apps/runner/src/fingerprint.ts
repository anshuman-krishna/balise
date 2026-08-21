/**
 * the fingerprint is a comparability question, so it lives in the kernel:
 * `@balise/measure-core` owns building one, deciding whether a run is audit
 * evidence, and invariant 3's field-by-field comparison. the runner re-exports
 * them because it is where they used to live and because an auditor reading
 * the runner should still find them named here.
 *
 * what the runner keeps is the part that touches chromium: the profile's cdp
 * mapping and the user agent, in profiles.ts.
 */
export {
  UNPINNED,
  buildFingerprint,
  isAuditable,
  fingerprintDifferences,
  fingerprintsMatch,
  type FingerprintInput,
} from '@balise/measure-core';
