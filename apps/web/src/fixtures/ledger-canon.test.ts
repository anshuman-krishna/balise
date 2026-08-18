import { describe, expect, it } from 'vitest';
import { entryHashOf, payloadHashOf, verifyEntries } from '@balise/ledger';
import { LedgerEntry } from '@balise/schemas';
import { buildCanonChain, CITED_REF_IDS } from '../../scripts/ledger-canon-source';
import { ledgerCanon } from './ledger-canon';

// the generated file is data, and data drifts. this rebuilds the chain from
// the generator and holds the checked-in copy to it, so a hand edit or a
// change in the ledger package cannot pass unnoticed.
const chain = await buildCanonChain();

describe('the generated canon', () => {
  it('matches the chain the generator produces', () => {
    expect(ledgerCanon.entryCount).toBe(chain.entryCount);
    expect(ledgerCanon.merkleRoot).toBe(chain.merkleRoot);
    expect(ledgerCanon.anchoredAt).toBe(chain.anchoredAt);
    for (const refId of CITED_REF_IDS) {
      const generated = chain.entries.find((entry) => entry.refId === refId);
      const written = ledgerCanon.entries.find((entry) => entry.refId === refId);
      expect(written, `${refId} is missing from the generated file`).toEqual(generated);
    }
  });

  it('verifies as an intact chain', () => {
    const result = verifyEntries(chain.entries);
    expect(result.status).toBe('intact');
    expect(ledgerCanon.verification).toEqual({ status: 'intact', checkedCount: chain.entryCount });
  });

  it('holds entries that satisfy the schema', () => {
    for (const entry of ledgerCanon.entries) {
      expect(() => LedgerEntry.parse(entry)).not.toThrow();
    }
  });

  it('holds hashes that recompute from the payloads they carry', () => {
    for (const entry of ledgerCanon.entries) {
      expect(payloadHashOf(entry.payload)).toBe(entry.payloadHash);
      expect(entryHashOf(entry)).toBe(entry.entryHash);
    }
  });

  it('places the cited run and its report at the end of the register', () => {
    const run = ledgerCanon.entries.find((entry) => entry.refId === 'run_4812')!;
    const report = ledgerCanon.entries.find((entry) => entry.refId === 'rapport_2026_sl_0417_t3')!;
    expect(report.sequence).toBe(run.sequence + 1);
    expect(report.prevHash).toBe(run.entryHash);
    expect(report.sequence).toBe(ledgerCanon.entryCount - 1);
  });

  it('gives every cited entry a distinct eight character prefix, so a permalink resolves to one entry', () => {
    const prefixes = ledgerCanon.entries.map((entry) => entry.entryHash.slice(0, 8));
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
