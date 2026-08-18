import type { LedgerEntry } from '@balise/schemas';

export type LedgerLookup =
  | { status: 'found'; entry: LedgerEntry }
  | { status: 'not-found'; query: string };

/** a shorter prefix would match by accident; documents print eight or more. */
export const MIN_HASH_PREFIX = 8;

/**
 * resolves the hash in a /v/:hash permalink against the register. a miss is a
 * miss: the screen says the empreinte is unknown rather than showing the
 * nearest entry, because a verification page that guesses is worth nothing to
 * the buyer reading it.
 */
export function lookupLedgerEntry(
  query: string | undefined,
  entries: readonly LedgerEntry[],
): LedgerLookup {
  if (query === undefined || query === '') {
    // the nav entry carries no hash and opens the most recent record
    const newest = [...entries].sort((a, b) => a.sequence - b.sequence).at(-1);
    return newest === undefined ? { status: 'not-found', query: '' } : { status: 'found', entry: newest };
  }
  const normalised = query.trim().toLowerCase();
  if (normalised.length < MIN_HASH_PREFIX) {
    return { status: 'not-found', query };
  }
  const entry = entries.find((candidate) => candidate.entryHash.toLowerCase().startsWith(normalised));
  return entry === undefined ? { status: 'not-found', query } : { status: 'found', entry };
}
