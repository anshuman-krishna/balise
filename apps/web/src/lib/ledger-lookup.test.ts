import { describe, expect, it } from 'vitest';
import { ledgerFixture } from '../fixtures/canon';
import { lookupLedgerRecord, MIN_HASH_PREFIX } from './ledger-lookup';

const records = ledgerFixture.records;
const [run, report] = records;

describe('lookupLedgerRecord', () => {
  it('opens the most recent record when no hash is given', () => {
    expect(lookupLedgerRecord(undefined, records)).toEqual({ status: 'found', record: run });
    expect(lookupLedgerRecord('', records)).toEqual({ status: 'found', record: run });
  });

  it('matches a full hash', () => {
    expect(lookupLedgerRecord(report!.hash, records)).toEqual({ status: 'found', record: report });
  });

  it('matches the short hash printed in a document footer', () => {
    expect(lookupLedgerRecord(report!.shortHash, records)).toEqual({ status: 'found', record: report });
  });

  it('is case insensitive and tolerates surrounding whitespace', () => {
    expect(lookupLedgerRecord(`  ${run!.shortHash.toUpperCase()} `, records)).toEqual({
      status: 'found',
      record: run,
    });
  });

  it('refuses a prefix too short to identify an entry', () => {
    const short = run!.hash.slice(0, MIN_HASH_PREFIX - 1);
    expect(lookupLedgerRecord(short, records)).toEqual({ status: 'not-found', query: short });
  });

  it('reports a miss rather than the nearest record', () => {
    expect(lookupLedgerRecord('9f4c8e22', records)).toEqual({ status: 'not-found', query: '9f4c8e22' });
  });

  it('reports a miss against an empty register', () => {
    expect(lookupLedgerRecord(undefined, [])).toEqual({ status: 'not-found', query: '' });
  });
});
