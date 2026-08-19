import { z } from 'zod';

// what changed between two runs, and who did it. every shape here can express
// "could not determine": there is no path in attribution that produces a
// plausible guess.

// ---------------------------------------------------------------------------
// inputs
// ---------------------------------------------------------------------------

/**
 * a resource as attribution sees it. transferred bytes crossed the network;
 * decoded bytes are the uncompressed size. source maps explain decoded bytes,
 * so the two are carried separately and never substituted for one another.
 */
export const AttributedResource = z.object({
  url: z.string().min(1),
  transferredBytes: z.number().finite().nonnegative(),
  decodedBytes: z.number().finite().nonnegative().optional(),
});
export type AttributedResource = z.infer<typeof AttributedResource>;

// 'unknown' is for a url we could not parse an origin from. it is reported as
// unknown rather than assumed to be the service's own.
export const ResourceParty = z.enum(['first', 'third', 'unknown']);
export type ResourceParty = z.infer<typeof ResourceParty>;

export const ResourceSide = z.object({
  // origin of the audited service. anything else is third party.
  serviceOrigin: z.string().min(1),
  resources: z.array(AttributedResource),
});
export type ResourceSide = z.infer<typeof ResourceSide>;

// ---------------------------------------------------------------------------
// resource and origin diff
// ---------------------------------------------------------------------------

export const ChangeStatus = z.enum(['added', 'removed', 'grown', 'shrunk', 'unchanged']);
export type ChangeStatus = z.infer<typeof ChangeStatus>;

export const ResourceChange = z.object({
  url: z.string(),
  party: ResourceParty,
  status: ChangeStatus,
  beforeTransferredBytes: z.number(),
  afterTransferredBytes: z.number(),
  transferredDelta: z.number(),
  // null on either side that did not carry a decoded size. a missing decoded
  // size is never replaced by the transferred one.
  beforeDecodedBytes: z.number().nullable(),
  afterDecodedBytes: z.number().nullable(),
  decodedDelta: z.number().nullable(),
  beforeRequests: z.number().int().nonnegative(),
  afterRequests: z.number().int().nonnegative(),
});
export type ResourceChange = z.infer<typeof ResourceChange>;

export const ByteTotals = z.object({
  before: z.number(),
  after: z.number(),
  delta: z.number(),
  // false when at least one resource did not carry the quantity, so the
  // totals cover part of the page only.
  complete: z.boolean(),
});
export type ByteTotals = z.infer<typeof ByteTotals>;

export const ResourceDiff = z.object({
  changes: z.array(ResourceChange),
  transferred: ByteTotals,
  decoded: ByteTotals,
});
export type ResourceDiff = z.infer<typeof ResourceDiff>;

/**
 * a third-party tag vendor we can name. an origin that matches nothing here is
 * reported by its hostname, never guessed at.
 */
export const VendorMatch = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['analytics', 'consent', 'media', 'advertising', 'support', 'cdn', 'payment', 'monitoring', 'font', 'public-api']),
});
export type VendorMatch = z.infer<typeof VendorMatch>;

export const OriginChange = z.object({
  origin: z.string(),
  party: ResourceParty,
  status: ChangeStatus,
  vendor: VendorMatch.nullable(),
  beforeTransferredBytes: z.number(),
  afterTransferredBytes: z.number(),
  transferredDelta: z.number(),
  beforeRequests: z.number().int().nonnegative(),
  afterRequests: z.number().int().nonnegative(),
});
export type OriginChange = z.infer<typeof OriginChange>;

export const OriginDiff = z.object({
  changes: z.array(OriginChange),
  newThirdPartyOrigins: z.number().int().nonnegative(),
  // third-party origins matching no entry in the vendor list. they are still
  // reported, by hostname.
  unidentifiedThirdPartyOrigins: z.number().int().nonnegative(),
});
export type OriginDiff = z.infer<typeof OriginDiff>;

// ---------------------------------------------------------------------------
// bundle attribution
// ---------------------------------------------------------------------------

/**
 * why a bundle could not be explained. each of these is reported as itself;
 * none of them falls back to a heuristic.
 */
export const AttributionUnavailableReason = z.enum([
  'no-source-map',
  'bundle-content-unavailable',
  'source-map-unreadable',
  'source-map-unsupported-version',
  'source-map-index-map',
  'source-map-mappings-empty',
  'source-map-mappings-malformed',
  'source-map-source-out-of-range',
  // the map does not describe the file we were given: it points past the end
  // of a generated line, or at a line the file does not have.
  'source-map-content-mismatch',
]);
export type AttributionUnavailableReason = z.infer<typeof AttributionUnavailableReason>;

/**
 * where in the original file the bytes came from, in 1-based lines as an
 * editor counts them. both ends are lines a mapping segment named and that
 * carried at least one byte, so the span is measured and not inferred.
 *
 * it says what the bundle takes of the file, which is not what the file
 * contains: a module the build shook down to two exports spans only the lines
 * that survived. nothing here is ever compared across two versions of a file,
 * because an edit above a line moves it without changing it.
 */
export const SourceSpan = z.object({
  firstLine: z.number().int().positive(),
  lastLine: z.number().int().positive(),
});
export type SourceSpan = z.infer<typeof SourceSpan>;

export const SourceBytes = z.object({
  // normalised path, with any bundler scheme removed and . and .. resolved.
  path: z.string(),
  // exactly what the source map said, kept so the normalisation is auditable.
  rawPath: z.string(),
  packageName: z.string().nullable(),
  bytes: z.number().nonnegative(),
  // null when the map names the file and attributes no byte to it, which is
  // a map naming a file the bundle did not take anything from.
  span: SourceSpan.nullable(),
});
export type SourceBytes = z.infer<typeof SourceBytes>;

export const BundleAttribution = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('resolved'),
    url: z.string(),
    // decoded bytes of the served file, as counted from its own text.
    totalBytes: z.number().nonnegative(),
    sources: z.array(SourceBytes),
    // bytes the map covers no source for: bundler prelude, runtime, banners.
    // reported, never distributed across the sources.
    unattributedBytes: z.number().nonnegative(),
  }),
  z.object({
    status: z.literal('unavailable'),
    url: z.string(),
    reason: AttributionUnavailableReason,
    detail: z.string().optional(),
  }),
]);
export type BundleAttribution = z.infer<typeof BundleAttribution>;

// ---------------------------------------------------------------------------
// module diff
// ---------------------------------------------------------------------------

export const ModuleChange = z.object({
  path: z.string(),
  packageName: z.string().nullable(),
  beforeBytes: z.number().nonnegative(),
  afterBytes: z.number().nonnegative(),
  delta: z.number(),
  status: ChangeStatus,
  /**
   * where the candidate bundles take the module from. read from the candidate
   * maps alone: line numbers from two builds of one file describe two files,
   * and subtracting them would report every line below an edit as changed.
   * null for a module the candidate does not carry.
   */
  span: SourceSpan.nullable(),
});
export type ModuleChange = z.infer<typeof ModuleChange>;

export const PackageChange = z.object({
  packageName: z.string(),
  beforeBytes: z.number().nonnegative(),
  afterBytes: z.number().nonnegative(),
  delta: z.number(),
  status: ChangeStatus,
  moduleCount: z.number().int().nonnegative(),
});
export type PackageChange = z.infer<typeof PackageChange>;

export const BundleCoverage = z.object({
  resolvedBundles: z.number().int().nonnegative(),
  attributedBytes: z.number().nonnegative(),
  unattributedBytes: z.number().nonnegative(),
  unavailable: z.array(z.object({ url: z.string(), reason: AttributionUnavailableReason })),
});
export type BundleCoverage = z.infer<typeof BundleCoverage>;

export const ModuleDiff = z.object({
  // empty when `comparable` is false. a bundle readable on one side and not on
  // the other would otherwise make every module it contains look removed,
  // which is a finding we would be inventing rather than measuring.
  modules: z.array(ModuleChange),
  packages: z.array(PackageChange),
  unattributed: z.object({ before: z.number(), after: z.number(), delta: z.number() }),
  before: BundleCoverage,
  after: BundleCoverage,
  /**
   * whether the two sides can be compared at all. true when the same bundle
   * urls failed on both sides, so an unreadable bundle contributes nothing to
   * either total and no module can appear to have been removed. false as soon
   * as the failures are asymmetric, and then no module changes are emitted.
   */
  comparable: z.boolean(),
  // true only when every bundle on both sides resolved. a comparable diff that
  // is not complete explains part of the change; the rest is reported as
  // unexplained rather than absorbed.
  complete: z.boolean(),
});
export type ModuleDiff = z.infer<typeof ModuleDiff>;

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

/**
 * how much of the measured change the modules account for. source maps explain
 * decoded bytes, so this reconciles against the decoded delta of the bundles
 * that were submitted for attribution, never against transferred bytes.
 */
export const Reconciliation = z.object({
  measuredDelta: z.number().nullable(),
  explainedDelta: z.number(),
  unexplainedDelta: z.number().nullable(),
  complete: z.boolean(),
});
export type Reconciliation = z.infer<typeof Reconciliation>;

export const AttributionReport = z.object({
  resources: ResourceDiff,
  origins: OriginDiff,
  // per-bundle outcome, so a surface can name the one bundle that could not be
  // read instead of reporting the whole page as unexplained.
  bundles: z.object({
    before: z.array(BundleAttribution),
    after: z.array(BundleAttribution),
  }),
  modules: ModuleDiff,
  reconciliation: Reconciliation,
});
export type AttributionReport = z.infer<typeof AttributionReport>;

// ---------------------------------------------------------------------------
// blame
// ---------------------------------------------------------------------------

export const CommitInfo = z.object({
  sha: z.string().min(1),
  shortSha: z.string().min(1),
  author: z.string(),
  authoredAt: z.string(),
  subject: z.string(),
});
export type CommitInfo = z.infer<typeof CommitInfo>;

export const BlameUnavailableReason = z.enum([
  // the bytes belong to a dependency. the commit that changed it is a manifest
  // change, which is a different question and is not answered by guessing.
  'third-party-module',
  'path-not-in-repository',
  'no-commits-in-range',
  'git-unavailable',
]);
export type BlameUnavailableReason = z.infer<typeof BlameUnavailableReason>;

export const ModuleBlame = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('attributed'),
    path: z.string(),
    packageName: z.string().nullable(),
    commits: z.array(CommitInfo).min(1),
  }),
  z.object({
    status: z.literal('unavailable'),
    path: z.string(),
    packageName: z.string().nullable(),
    reason: BlameUnavailableReason,
    detail: z.string().optional(),
  }),
]);
export type ModuleBlame = z.infer<typeof ModuleBlame>;
