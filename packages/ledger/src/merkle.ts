import type { LedgerEntry, MerkleRoot, OrganizationId } from '@balise/schemas';
import { sha256 } from './hash.js';
import type { LedgerStore } from './store.js';

/**
 * one level of the tree. an odd node is promoted unchanged rather than
 * duplicated: duplicating the last leaf makes two different leaf sets produce
 * the same root, which is exactly the property a tamper-evident structure
 * must not have.
 */
export function merkleLevel(nodes: readonly string[]): string[] {
  const next: string[] = [];
  for (let index = 0; index < nodes.length; index += 2) {
    const left = nodes[index]!;
    const right = nodes[index + 1];
    next.push(right === undefined ? left : sha256(`${left}${right}`));
  }
  return next;
}

/** the root over a list of leaf hashes, in order. */
export function merkleRoot(leaves: readonly string[]): string {
  if (leaves.length === 0) {
    throw new Error('a merkle root needs at least one leaf');
  }
  let level = [...leaves];
  while (level.length > 1) {
    level = merkleLevel(level);
  }
  return level[0]!;
}

export interface AnchorOptions {
  now?: () => Date;
  fromSequence?: number;
}

/**
 * a periodic root over a tenant's chain, published so that the state of the
 * chain at a point in time can be checked later without trusting us to have
 * kept it unchanged.
 */
export async function anchor(
  store: LedgerStore,
  organizationId: OrganizationId,
  options: AnchorOptions = {},
): Promise<MerkleRoot> {
  const now = options.now ?? (() => new Date());
  const entries = await store.read(organizationId, options.fromSequence ?? 0);
  if (entries.length === 0) {
    throw new Error(`nothing to anchor: ${organizationId} has no entries in range`);
  }
  return {
    organizationId,
    root: merkleRoot(entries.map((entry: LedgerEntry) => entry.entryHash)),
    fromSequence: entries[0]!.sequence,
    toSequence: entries.at(-1)!.sequence,
    leafCount: entries.length,
    anchoredAt: now().toISOString(),
  };
}
