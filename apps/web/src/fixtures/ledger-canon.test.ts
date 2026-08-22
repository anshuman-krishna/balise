import { describe, expect, it } from 'vitest';
import { entryHashOf, payloadHashOf, verifyEntries } from '@balise/ledger';
import { LedgerEntry } from '@balise/schemas';
import { buildCanonChain, CITED_REF_IDS } from '../../scripts/ledger-canon-source';
import { ledgerCanon } from './ledger-canon';
import { REF } from './ledger-refs';

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
    const report = ledgerCanon.entries.find((entry) => entry.refId === REF.report)!;
    expect(report.sequence).toBe(run.sequence + 1);
    expect(report.prevHash).toBe(run.entryHash);
    expect(report.sequence).toBe(ledgerCanon.entryCount - 1);
  });

  // the report the document renders is the second one: the register holds one
  // per generation, and the tracker counts them rather than stating a number.
  it('holds a report for each period the contract has reported on', () => {
    const reports = ledgerCanon.entries.filter((entry) => entry.kind === 'report_generated');
    expect(reports.map((entry) => entry.refId)).toEqual([REF.reportPrevious, REF.report]);
  });

  // both re-baselines used to carry a date picked independently of the run
  // they point at: `main → #4790` was recorded on 3 august, and the register
  // puts run #4790 on 14 august. a chain that verifies and says something
  // impossible is the one failure this product exists to prevent.
  it('records no entry before the run it cites', () => {
    const runAt = new Map(
      ledgerCanon.entries
        .filter((entry) => entry.kind === 'run')
        .map((entry) => [(entry.payload as { runId: string }).runId, entry.createdAt]),
    );
    const citing = ledgerCanon.entries.filter(
      (entry) => typeof (entry.payload as { toRun?: unknown }).toRun === 'string',
    );
    expect(citing.length).toBeGreaterThan(0);
    for (const entry of citing) {
      const cited = (entry.payload as { toRun: string }).toRun;
      const at = runAt.get(cited);
      expect(at, `the register cites ${cited} and does not hold it`).toBeDefined();
      expect(entry.createdAt >= at!).toBe(true);
    }
  });

  it('gives every cited entry a distinct eight character prefix, so a permalink resolves to one entry', () => {
    const prefixes = ledgerCanon.entries.map((entry) => entry.entryHash.slice(0, 8));
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});
