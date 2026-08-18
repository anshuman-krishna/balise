import { describe, expect, it } from 'vitest';
import { ledgerCanon } from '../fixtures/ledger-canon';
import { ledgerEntry, REF } from '../fixtures/ledger-refs';
import { lookupLedgerEntry, MIN_HASH_PREFIX } from './ledger-lookup';

const entries = ledgerCanon.entries;
const run = ledgerEntry(REF.run);
const report = ledgerEntry(REF.report);

describe('lookupLedgerEntry', () => {
  it('opens the most recent record when no hash is given', () => {
    expect(lookupLedgerEntry(undefined, entries)).toEqual({ status: 'found', entry: report });
    expect(lookupLedgerEntry('', entries)).toEqual({ status: 'found', entry: report });
  });

  it('matches a full hash', () => {
    expect(lookupLedgerEntry(run.entryHash, entries)).toEqual({ status: 'found', entry: run });
  });

  it('matches the short hash printed in a document footer', () => {
    expect(lookupLedgerEntry(run.entryHash.slice(0, 8), entries)).toEqual({ status: 'found', entry: run });
  });

  it('is case insensitive and tolerates surrounding whitespace', () => {
    expect(lookupLedgerEntry(`  ${run.entryHash.slice(0, 8).toUpperCase()} `, entries)).toEqual({
      status: 'found',
      entry: run,
    });
  });

  it('refuses a prefix too short to identify an entry', () => {
    const short = run.entryHash.slice(0, MIN_HASH_PREFIX - 1);
    expect(lookupLedgerEntry(short, entries)).toEqual({ status: 'not-found', query: short });
  });

  it('reports a miss rather than the nearest record', () => {
    expect(lookupLedgerEntry('f'.repeat(8), entries).status).toBe('not-found');
  });

  it('reports a miss against an empty register', () => {
    expect(lookupLedgerEntry(undefined, [])).toEqual({ status: 'not-found', query: '' });
  });

  it('resolves every hash the interface and the documents print', () => {
    for (const entry of entries) {
      const found = lookupLedgerEntry(entry.entryHash.slice(0, 8), entries);
      expect(found, `${entry.refId} does not resolve by its printed prefix`).toEqual({
        status: 'found',
        entry,
      });
    }
  });
});
