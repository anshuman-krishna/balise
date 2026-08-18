import type { LedgerEntry } from '@balise/schemas';
import { ledgerCanon } from './ledger-canon';

/**
 * every hash any surface shows comes from here, and every one of them is a
 * real entry in the generated chain. nothing displays a hash that was typed
 * in by hand.
 */
export function ledgerEntry(refId: string): LedgerEntry {
  const entry = ledgerCanon.entries.find((candidate) => candidate.refId === refId);
  if (entry === undefined) {
    throw new Error(`the canon register has no entry for ${refId}`);
  }
  return entry;
}

/** the eight character prefix a document footer and a permalink carry. */
export function shortHash(refId: string): string {
  return ledgerEntry(refId).entryHash.slice(0, 8);
}

export function verifyUrl(refId: string): string {
  return `balise.fr/v/${shortHash(refId)}`;
}

/** head…tail, the way a printed footer elides a digest it cannot fit. */
export function elidedHash(refId: string, head = 12, tail = 4): string {
  const hash = ledgerEntry(refId).entryHash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

/** the same digest in four character groups, for a document that has room. */
export function groupedHash(refId: string, groups = 3, size = 4, tail = 2): string {
  const hash = ledgerEntry(refId).entryHash;
  const head = Array.from({ length: groups }, (_, index) =>
    hash.slice(index * size, (index + 1) * size),
  ).join(' ');
  return `${head} …${hash.slice(-tail)}`;
}

/** position in the register, as a reader counts it: from one. */
export function registerPosition(refId: string): number {
  return ledgerEntry(refId).sequence + 1;
}

export const REF = {
  run: 'run_4812',
  report: 'rapport_2026_sl_0417_t3',
  declarationV1: 'declaration_v1',
  declarationV2: 'declaration_v2',
  declarationV3: 'declaration_v3',
  override: 'override_pr_401',
  rebaseline4790: 'rebaseline_4790',
  rebaseline4612: 'rebaseline_4612',
  methodology: 'methodology_v1.2',
} as const;
