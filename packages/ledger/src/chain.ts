import {
  GENESIS_PREV_HASH,
  type LedgerEntry,
  type LedgerEntryInput,
  type OrganizationId,
  type VerificationFailure,
  type VerificationResult,
} from '@balise/schemas';
import { entryHashOf, payloadHashOf } from './hash.js';
import type { LedgerStore } from './store.js';

export interface AppendOptions {
  /** injected so a record is reproducible in tests and in a rebuild. */
  now?: () => Date;
}

/**
 * the only write. there is no update, no delete, no admin override and no
 * utility that repairs a chain: if the chain is broken, that fact is the
 * finding, and it is surfaced rather than fixed.
 */
export async function append(
  store: LedgerStore,
  input: LedgerEntryInput,
  options: AppendOptions = {},
): Promise<LedgerEntry> {
  const now = options.now ?? (() => new Date());
  const head = await store.head(input.organizationId);

  const payloadHash = payloadHashOf(input.payload);
  const withoutHash = {
    ...input,
    sequence: head === undefined ? 0 : head.sequence + 1,
    createdAt: now().toISOString(),
    payloadHash,
    prevHash: head?.entryHash ?? GENESIS_PREV_HASH,
  };

  const entry: LedgerEntry = { ...withoutHash, entryHash: entryHashOf(withoutHash) };
  await store.insert(entry);
  return entry;
}

/**
 * recomputes every hash and every link. reports what it found rather than
 * throwing on the first problem, because which entries are affected is the
 * useful answer.
 */
export function verifyEntries(
  entries: readonly LedgerEntry[],
  organizationId?: OrganizationId,
): VerificationResult {
  const failures: VerificationFailure[] = [];

  entries.forEach((entry, index) => {
    const fail = (reason: VerificationFailure['reason'], detail: string) => {
      failures.push({ sequence: entry.sequence, entryHash: entry.entryHash, reason, detail });
    };

    if (organizationId !== undefined && entry.organizationId !== organizationId) {
      fail('organization-mismatch', `entry belongs to ${entry.organizationId}`);
    }

    const expectedPayloadHash = payloadHashOf(entry.payload);
    if (expectedPayloadHash !== entry.payloadHash) {
      fail('payload-hash-mismatch', `payload hashes to ${expectedPayloadHash}`);
    }

    const { entryHash, ...rest } = entry;
    const expectedEntryHash = entryHashOf(rest);
    if (expectedEntryHash !== entryHash) {
      fail('entry-hash-mismatch', `entry hashes to ${expectedEntryHash}`);
    }

    const previous = entries[index - 1];
    if (previous === undefined) {
      // the first entry of a range links to whatever came before it, which
      // this range does not contain; only a genesis entry is checked here.
      if (entry.sequence === 0 && entry.prevHash !== GENESIS_PREV_HASH) {
        fail('prev-hash-mismatch', 'the first entry of a chain must link to the genesis hash');
      }
      return;
    }

    if (entry.sequence !== previous.sequence + 1) {
      fail(
        'sequence-out-of-order',
        `sequence ${entry.sequence} follows ${previous.sequence}`,
      );
    }
    if (entry.prevHash !== previous.entryHash) {
      fail('prev-hash-mismatch', `expected ${previous.entryHash}`);
    }
  });

  if (failures.length > 0) {
    return { status: 'broken', checkedCount: entries.length, failures };
  }

  const first = entries[0];
  const last = entries.at(-1);
  return {
    status: 'intact',
    checkedCount: entries.length,
    ...(first === undefined ? {} : { fromHash: first.entryHash }),
    ...(last === undefined ? {} : { toHash: last.entryHash }),
  };
}

/** verifies a tenant's chain from storage, end to end by default. */
export async function verify(
  store: LedgerStore,
  organizationId: OrganizationId,
  fromSequence = 0,
): Promise<VerificationResult> {
  const entries = await store.read(organizationId, fromSequence);
  return verifyEntries(entries, organizationId);
}

/** finds one entry by its hash, or by a prefix of at least eight characters. */
export async function findByHash(
  store: LedgerStore,
  organizationId: OrganizationId,
  hashOrPrefix: string,
): Promise<LedgerEntry | undefined> {
  const query = hashOrPrefix.trim().toLowerCase();
  if (query.length < 8) {
    return undefined;
  }
  const entries = await store.read(organizationId);
  return entries.find((entry) => entry.entryHash.startsWith(query));
}
