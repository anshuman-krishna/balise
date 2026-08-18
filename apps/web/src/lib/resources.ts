import type { ResourceRecord, ResourceType } from '../fixtures/canon';

export interface ResourceGroup {
  type: ResourceType;
  requests: number;
  transferredKb: number;
  /** exact fraction of the run's transferred bytes. rounded at the edge only. */
  share: number;
  unusedDecodedKb: number;
}

export interface ResourceSummary {
  groups: readonly ResourceGroup[];
  totalRequests: number;
  totalTransferredKb: number;
}

export interface ResourceRemainder {
  requests: number;
  transferredKb: number;
}

/**
 * groups the run's resource records by type, heaviest first. the tail we
 * hold no records for is counted as 'other' rather than dropped, so the
 * totals here always equal the waterfall's totals on the same screen.
 */
export function summariseResources(
  records: readonly ResourceRecord[],
  remainder?: ResourceRemainder,
): ResourceSummary {
  const byType = new Map<ResourceType, ResourceGroup>();

  const add = (type: ResourceType, requests: number, transferredKb: number, unused: number) => {
    const existing = byType.get(type);
    if (existing === undefined) {
      byType.set(type, { type, requests, transferredKb, share: 0, unusedDecodedKb: unused });
      return;
    }
    existing.requests += requests;
    existing.transferredKb += transferredKb;
    existing.unusedDecodedKb += unused;
  };

  for (const record of records) {
    add(record.type, 1, record.transferredKb, record.unusedDecodedKb ?? 0);
  }
  if (remainder !== undefined && remainder.requests > 0) {
    add('other', remainder.requests, remainder.transferredKb, 0);
  }

  const groups = [...byType.values()].sort((a, b) => b.transferredKb - a.transferredKb);
  const totalTransferredKb = groups.reduce((sum, group) => sum + group.transferredKb, 0);
  const totalRequests = groups.reduce((sum, group) => sum + group.requests, 0);

  for (const group of groups) {
    group.share = totalTransferredKb === 0 ? 0 : group.transferredKb / totalTransferredKb;
  }

  return { groups, totalRequests, totalTransferredKb };
}
