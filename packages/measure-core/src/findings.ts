import type { CapturedResource, MetricId, RawCapture, ResourceType } from '@balise/schemas';
import { isThirdParty, originOf, requireOrigin } from './origin.js';
import { coverageApplies } from './resources.js';

/**
 * what a capture shows about itself, stated as measured quantities.
 *
 * a finding is never a projected saving. "convert these images and save 214 KB"
 * is a counterfactual about a page nobody measured, and the moment it appears
 * on a public surface the whole product's claim to measure rather than to
 * estimate is gone. so every finding here is a quantity read off the capture
 * (bytes, requests, unexecuted decoded bytes) or a position in a reference
 * distribution someone else published, and the caller supplies the second
 * because this package holds no corpus of its own.
 *
 * the free scan used to carry three authored sentences with authored figures,
 * two of which claimed knowledge the capture does not hold: nothing in a
 * capture says an image is a png at the wrong size, or that a font file is one
 * of six unsubset weights. what a capture does hold is that images are 63 % of
 * the page and that six font files weigh 384 KB, which is the same finding
 * without the invention.
 */

export type FindingId =
  | 'unused-script-bytes'
  | 'unused-stylesheet-bytes'
  | 'third-party-weight'
  | 'image-weight'
  | 'font-weight'
  | 'heaviest-resource'
  | 'reference-dom-node-count'
  | 'reference-request-count'
  | 'reference-transferred-bytes';

/**
 * two levels, not three. a finding below the caution threshold is not raised
 * at all, so there is no severity standing for "we mention it and mean
 * nothing by it".
 */
export type FindingSeverity = 'caution' | 'breach';

/** what a share is a share of. a share with no stated basis is a rumour. */
export type ShareBasis = 'page-transferred-bytes' | 'group-decoded-bytes';

export interface FindingShare {
  /** exact fraction, 0 to 1. rounded at the edge only (invariant 6). */
  value: number;
  basis: ShareBasis;
}

export interface FindingEvidence {
  url: string;
  resourceType: ResourceType;
  transferredBytes: number;
  decodedBytes: number | null;
  unusedDecodedBytes: number | null;
}

/**
 * where this page sits in a distribution someone else published. the source
 * and its version travel with the number, because a percentile against an
 * unnamed corpus says nothing.
 */
export interface ReferencePosition {
  metricId: MetricId;
  /** identifier of the published distribution, e.g. "ecoindex". */
  source: string;
  sourceVersion: string;
  /** 0 to 100: the share of the reference distribution at or below this page. */
  percentile: number;
  /** the measured value the percentile was read for, in the metric's unit. */
  value: number;
}

export interface Finding {
  id: FindingId;
  severity: FindingSeverity;
  /** the measured quantity this finding is. never a saving. */
  value: number;
  unit: 'bytes' | 'count';
  share: FindingShare | null;
  /**
   * how many things the finding is about, defined per finding: covered
   * scripts, distinct third-party origins, files of a type, one resource.
   */
  contributorCount: number;
  /**
   * resources that belong to the finding and carried no usable data, so the
   * reader knows the quantity is a floor rather than the whole of it.
   */
  unavailableCount: number;
  /** the heaviest contributors, capped. never the whole list. */
  evidence: readonly FindingEvidence[];
  reference: ReferencePosition | null;
}

/** a finding that could have been computed and was not, with the reason. */
export interface WithheldFinding {
  id: FindingId;
  reason: 'coverage-not-captured';
  /** the resources it would have been computed from. */
  contributorCount: number;
}

export interface FindingsResult {
  /** most severe first, then heaviest. */
  findings: readonly Finding[];
  withheld: readonly WithheldFinding[];
  /** what the shares are against, so a caller cannot pair them with another page. */
  totalTransferredBytes: number;
}

export interface FindingThreshold {
  caution: number;
  breach: number;
}

export interface FindingThresholds {
  /** share of the covered decoded bytes of a type that never executed. */
  unusedDecodedShare: FindingThreshold;
  /** shares of the page's transferred bytes. */
  thirdPartyShare: FindingThreshold;
  imageShare: FindingThreshold;
  fontShare: FindingThreshold;
  singleResourceShare: FindingThreshold;
  /** position in a published reference distribution, as a percentile. */
  referencePercentile: FindingThreshold;
  /**
   * no weight finding is raised below this, whatever its share. on a 40 KB
   * page the fonts are always most of it and saying so is arithmetic, not a
   * finding.
   */
  minimumBytes: number;
}

/**
 * provisional, and provisional in the same sense as the noise floor scaling
 * factor: these numbers decide what a public surface calls a problem, which is
 * a methodology decision and not an engineering one. METHODOLOGY.md section 12
 * carries them as open decision 15 and nothing is presented as evidence under
 * v1.0 until they are signed off.
 */
export const PROVISIONAL_FINDING_THRESHOLDS: FindingThresholds = {
  unusedDecodedShare: { caution: 0.4, breach: 0.6 },
  thirdPartyShare: { caution: 0.2, breach: 0.35 },
  imageShare: { caution: 0.5, breach: 0.65 },
  fontShare: { caution: 0.1, breach: 0.2 },
  singleResourceShare: { caution: 0.15, breach: 0.25 },
  referencePercentile: { caution: 50, breach: 75 },
  minimumBytes: 50_000,
};

const DEFAULT_EVIDENCE_LIMIT = 3;

export interface FindingsInput {
  capture: RawCapture;
  /**
   * positions in published reference distributions, supplied by the caller.
   * this package compares a page to nothing it cannot show you the table for.
   */
  reference?: readonly ReferencePosition[];
  thresholds?: FindingThresholds;
  evidenceLimit?: number;
}

const REFERENCE_FINDING: Partial<Record<MetricId, FindingId>> = {
  dom_node_count: 'reference-dom-node-count',
  request_count: 'reference-request-count',
  transferred_bytes: 'reference-transferred-bytes',
};

const REFERENCE_UNIT: Partial<Record<MetricId, Finding['unit']>> = {
  dom_node_count: 'count',
  request_count: 'count',
  transferred_bytes: 'bytes',
};

function severityFor(value: number, threshold: FindingThreshold): FindingSeverity | null {
  if (value >= threshold.breach) return 'breach';
  if (value >= threshold.caution) return 'caution';
  return null;
}

function evidenceOf(resource: CapturedResource): FindingEvidence {
  return {
    url: resource.url,
    resourceType: resource.resourceType,
    transferredBytes: resource.transferredBytes,
    decodedBytes: resource.decodedBytes,
    unusedDecodedBytes: resource.unusedDecodedBytes,
  };
}

function heaviest(
  resources: readonly CapturedResource[],
  limit: number,
  by: (resource: CapturedResource) => number,
): FindingEvidence[] {
  return [...resources]
    .sort((a, b) => by(b) - by(a))
    .slice(0, limit)
    .map(evidenceOf);
}

/**
 * how findings are ordered inside one severity: what this page is made of
 * before where this page sits among other people's pages, and inside each,
 * the larger share first. a percentile and a share are not the same quantity
 * and are never sorted against each other. this decides display order and
 * nothing else.
 */
function orderKey(finding: Finding): [number, number] {
  if (finding.share !== null) return [0, finding.share.value];
  if (finding.reference !== null) return [1, finding.reference.percentile / 100];
  return [2, 0];
}

export function findings(input: FindingsInput): FindingsResult {
  const { capture } = input;
  const thresholds = input.thresholds ?? PROVISIONAL_FINDING_THRESHOLDS;
  const limit = input.evidenceLimit ?? DEFAULT_EVIDENCE_LIMIT;
  const serviceOrigin = requireOrigin(capture.serviceOrigin);

  const totalTransferredBytes = capture.resources.reduce(
    (sum, resource) => sum + resource.transferredBytes,
    0,
  );

  const raised: Finding[] = [];
  const withheld: WithheldFinding[] = [];

  const byType = (type: ResourceType): CapturedResource[] =>
    capture.resources.filter((resource) => resource.resourceType === type);

  // weight of a resource type as a share of the page.
  const weightFinding = (
    id: FindingId,
    type: ResourceType,
    threshold: FindingThreshold,
  ): void => {
    const members = byType(type);
    if (members.length === 0) return;
    const bytes = members.reduce((sum, resource) => sum + resource.transferredBytes, 0);
    if (bytes < thresholds.minimumBytes || totalTransferredBytes === 0) return;
    const share = bytes / totalTransferredBytes;
    const severity = severityFor(share, threshold);
    if (severity === null) return;
    raised.push({
      id,
      severity,
      value: bytes,
      unit: 'bytes',
      share: { value: share, basis: 'page-transferred-bytes' },
      contributorCount: members.length,
      unavailableCount: 0,
      evidence: heaviest(members, limit, (resource) => resource.transferredBytes),
      reference: null,
    });
  };

  weightFinding('image-weight', 'image', thresholds.imageShare);
  weightFinding('font-weight', 'font', thresholds.fontShare);

  // decoded bytes coverage found unexecuted, per type coverage applies to.
  const coverageFinding = (id: FindingId, type: ResourceType): void => {
    const members = byType(type).filter(coverageApplies);
    if (members.length === 0) return;
    const covered = members.filter((resource) => resource.unusedDecodedBytes !== null);
    const unavailableCount = members.length - covered.length;
    if (covered.length === 0) {
      withheld.push({ id, reason: 'coverage-not-captured', contributorCount: members.length });
      return;
    }
    const unused = covered.reduce((sum, resource) => sum + (resource.unusedDecodedBytes ?? 0), 0);
    const decoded = covered.reduce((sum, resource) => sum + (resource.decodedBytes ?? 0), 0);
    if (unused < thresholds.minimumBytes || decoded === 0) return;
    const share = unused / decoded;
    const severity = severityFor(share, thresholds.unusedDecodedShare);
    if (severity === null) return;
    raised.push({
      id,
      severity,
      value: unused,
      unit: 'bytes',
      share: { value: share, basis: 'group-decoded-bytes' },
      contributorCount: covered.length,
      unavailableCount,
      evidence: heaviest(covered, limit, (resource) => resource.unusedDecodedBytes ?? 0),
      reference: null,
    });
  };

  coverageFinding('unused-script-bytes', 'script');
  coverageFinding('unused-stylesheet-bytes', 'stylesheet');

  // everything the page loaded from an origin that is not the service's.
  const thirdParty = capture.resources.filter((resource) =>
    isThirdParty(resource.url, serviceOrigin),
  );
  if (thirdParty.length > 0 && totalTransferredBytes > 0) {
    const bytes = thirdParty.reduce((sum, resource) => sum + resource.transferredBytes, 0);
    const share = bytes / totalTransferredBytes;
    const severity = severityFor(share, thresholds.thirdPartyShare);
    if (severity !== null && bytes >= thresholds.minimumBytes) {
      const origins = new Set(thirdParty.map((resource) => originOf(resource.url)));
      raised.push({
        id: 'third-party-weight',
        severity,
        value: bytes,
        unit: 'bytes',
        share: { value: share, basis: 'page-transferred-bytes' },
        contributorCount: origins.size,
        unavailableCount: 0,
        evidence: heaviest(thirdParty, limit, (resource) => resource.transferredBytes),
        reference: null,
      });
    }
  }

  // one response carrying a large share of the page on its own.
  if (capture.resources.length > 0 && totalTransferredBytes > 0) {
    const largest = [...capture.resources].sort(
      (a, b) => b.transferredBytes - a.transferredBytes,
    )[0]!;
    const share = largest.transferredBytes / totalTransferredBytes;
    const severity = severityFor(share, thresholds.singleResourceShare);
    if (severity !== null && largest.transferredBytes >= thresholds.minimumBytes) {
      raised.push({
        id: 'heaviest-resource',
        severity,
        value: largest.transferredBytes,
        unit: 'bytes',
        share: { value: share, basis: 'page-transferred-bytes' },
        contributorCount: 1,
        unavailableCount: 0,
        evidence: [evidenceOf(largest)],
        reference: null,
      });
    }
  }

  for (const position of input.reference ?? []) {
    const id = REFERENCE_FINDING[position.metricId];
    const unit = REFERENCE_UNIT[position.metricId];
    if (id === undefined || unit === undefined) continue;
    const severity = severityFor(position.percentile, thresholds.referencePercentile);
    if (severity === null) continue;
    raised.push({
      id,
      severity,
      value: position.value,
      unit,
      share: null,
      contributorCount: 0,
      unavailableCount: 0,
      evidence: [],
      reference: position,
    });
  }

  const order: Record<FindingSeverity, number> = { breach: 0, caution: 1 };
  raised.sort((a, b) => {
    const [aKind, aSize] = orderKey(a);
    const [bKind, bSize] = orderKey(b);
    return order[a.severity] - order[b.severity] || aKind - bKind || bSize - aSize;
  });

  return { findings: raised, withheld, totalTransferredBytes };
}
