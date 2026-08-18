import type { LedgerRecord } from '../fixtures/canon';

export type LedgerLookup =
  | { status: 'found'; record: LedgerRecord }
  | { status: 'not-found'; query: string };

/** a shorter prefix would match by accident; documents print eight or more. */
export const MIN_HASH_PREFIX = 8;

/**
 * resolves the hash in a /v/:hash permalink against the records we hold. a
 * miss is a miss: the screen says the empreinte is unknown rather than
 * showing the nearest record, because a verification page that guesses is
 * worth nothing to the buyer reading it.
 */
export function lookupLedgerRecord(
  query: string | undefined,
  records: readonly LedgerRecord[],
): LedgerLookup {
  const first = records[0];
  if (query === undefined || query === '') {
    // the nav entry carries no hash and opens the most recent record
    return first === undefined ? { status: 'not-found', query: '' } : { status: 'found', record: first };
  }
  const normalised = query.trim().toLowerCase();
  if (normalised.length < MIN_HASH_PREFIX) {
    return { status: 'not-found', query };
  }
  const record = records.find((candidate) => candidate.hash.toLowerCase().startsWith(normalised));
  return record === undefined ? { status: 'not-found', query } : { status: 'found', record };
}
