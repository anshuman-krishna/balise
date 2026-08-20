import type { CapturedResource, RawCapture, ResourceType } from '@balise/schemas';
import { isThirdParty, requireOrigin } from './origin.js';

/**
 * the capture's resources grouped by what the browser did with them. the same
 * capture the metrics are extracted from, reduced a second way, so the
 * inventory on a screen and the transferred figure beside it cannot describe
 * different pages.
 *
 * what is missing is counted rather than dropped: a body the browser could
 * not hand back and a script no coverage was captured for are both reported
 * as unavailable, and neither is filled in from a neighbouring figure.
 */

export interface ResourceGroup {
  resourceType: ResourceType;
  requestCount: number;
  transferredBytes: number;
  /** summed over the members whose decoded size the capture holds. */
  decodedBytes: number;
  /** members with no decoded size. their bytes are not in `decodedBytes`. */
  decodedUnavailableCount: number;
  /** summed over the members coverage was captured for. */
  unusedDecodedBytes: number;
  /** members coverage applies to and was not captured for. */
  coverageUnavailableCount: number;
  /** exact share of the capture's transferred bytes. rounded at the edge only. */
  transferredShare: number;
}

export interface ResourceSummary {
  /** heaviest first, by transferred bytes. */
  groups: readonly ResourceGroup[];
  /** resources held, which can be fewer than the capture's request count. */
  resourceCount: number;
  totalTransferredBytes: number;
  totalDecodedBytes: number;
  firstPartyTransferredBytes: number;
  thirdPartyTransferredBytes: number;
  decodedUnavailableCount: number;
  coverageUnavailableCount: number;
}

/** coverage is a property of executed text, so it applies to these two only. */
const COVERED_TYPES: ReadonlySet<ResourceType> = new Set(['script', 'stylesheet']);

export function coverageApplies(resource: CapturedResource): boolean {
  return COVERED_TYPES.has(resource.resourceType);
}

const EMPTY = (resourceType: ResourceType): ResourceGroup => ({
  resourceType,
  requestCount: 0,
  transferredBytes: 0,
  decodedBytes: 0,
  decodedUnavailableCount: 0,
  unusedDecodedBytes: 0,
  coverageUnavailableCount: 0,
  transferredShare: 0,
});

export function summariseResources(capture: RawCapture): ResourceSummary {
  const serviceOrigin = requireOrigin(capture.serviceOrigin);
  const byType = new Map<ResourceType, ResourceGroup>();

  let firstPartyTransferredBytes = 0;
  let thirdPartyTransferredBytes = 0;

  for (const resource of capture.resources) {
    const group = byType.get(resource.resourceType) ?? EMPTY(resource.resourceType);
    group.requestCount += 1;
    group.transferredBytes += resource.transferredBytes;

    if (resource.decodedBytes === null) {
      group.decodedUnavailableCount += 1;
    } else {
      group.decodedBytes += resource.decodedBytes;
    }

    if (resource.unusedDecodedBytes !== null) {
      group.unusedDecodedBytes += resource.unusedDecodedBytes;
    } else if (coverageApplies(resource)) {
      group.coverageUnavailableCount += 1;
    }

    byType.set(resource.resourceType, group);

    if (isThirdParty(resource.url, serviceOrigin)) {
      thirdPartyTransferredBytes += resource.transferredBytes;
    } else {
      firstPartyTransferredBytes += resource.transferredBytes;
    }
  }

  const groups = [...byType.values()].sort((a, b) => b.transferredBytes - a.transferredBytes);
  const totalTransferredBytes = firstPartyTransferredBytes + thirdPartyTransferredBytes;

  for (const group of groups) {
    group.transferredShare =
      totalTransferredBytes === 0 ? 0 : group.transferredBytes / totalTransferredBytes;
  }

  return {
    groups,
    resourceCount: capture.resources.length,
    totalTransferredBytes,
    totalDecodedBytes: groups.reduce((sum, group) => sum + group.decodedBytes, 0),
    firstPartyTransferredBytes,
    thirdPartyTransferredBytes,
    decodedUnavailableCount: groups.reduce((sum, group) => sum + group.decodedUnavailableCount, 0),
    coverageUnavailableCount: groups.reduce((sum, group) => sum + group.coverageUnavailableCount, 0),
  };
}
