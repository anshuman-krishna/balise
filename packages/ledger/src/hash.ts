import { createHash } from 'node:crypto';
import type { LedgerEntry, LedgerEntryInput } from '@balise/schemas';
import { canonicalise } from './canonical.js';

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** the hash of the recorded facts alone. */
export function payloadHashOf(payload: Record<string, unknown>): string {
  return sha256(canonicalise(payload));
}

/**
 * the hash of the entry as a link in the chain. everything that identifies
 * the entry and its position goes in, so no field can be altered after the
 * fact without the hash moving.
 */
export function entryHashOf(entry: Omit<LedgerEntry, 'entryHash'>): string {
  return sha256(
    canonicalise({
      organizationId: entry.organizationId,
      sequence: entry.sequence,
      kind: entry.kind,
      refId: entry.refId,
      createdAt: entry.createdAt,
      payloadHash: entry.payloadHash,
      prevHash: entry.prevHash,
      supersedes: entry.supersedes,
    }),
  );
}

export type { LedgerEntryInput };
