import type { LedgerEntry, OrganizationId } from '@balise/schemas';

/**
 * the storage the chain sits on. deliberately has no update and no delete:
 * invariant 4 is enforced by the shape of this interface as well as by the
 * database grants behind it.
 */
export interface LedgerStore {
  /** the last entry in a tenant's chain, or undefined when the chain is empty. */
  head(organizationId: OrganizationId): Promise<LedgerEntry | undefined>;
  /** entries in sequence order, from `fromSequence` inclusive. */
  read(organizationId: OrganizationId, fromSequence?: number): Promise<readonly LedgerEntry[]>;
  insert(entry: LedgerEntry): Promise<void>;
}

/**
 * in-memory store, for tests and for the local runner. the postgres store
 * arrives with the api; it holds the same contract, plus grants that make the
 * absence of update and delete true at the database as well.
 */
export function createMemoryStore(): LedgerStore {
  const chains = new Map<string, LedgerEntry[]>();

  const chain = (organizationId: OrganizationId): LedgerEntry[] => {
    const existing = chains.get(organizationId);
    if (existing !== undefined) {
      return existing;
    }
    const created: LedgerEntry[] = [];
    chains.set(organizationId, created);
    return created;
  };

  return {
    head: (organizationId) => Promise.resolve(chain(organizationId).at(-1)),
    read: (organizationId, fromSequence = 0) =>
      Promise.resolve(chain(organizationId).filter((entry) => entry.sequence >= fromSequence)),
    insert: (entry) => {
      chain(entry.organizationId).push(entry);
      return Promise.resolve();
    },
  };
}
