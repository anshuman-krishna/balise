import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '@balise/schemas';
import { formatInt } from '@balise/ui';
import { ledgerCanon } from '../fixtures/ledger-canon';
import { ledgerEntry, REF } from '../fixtures/ledger-refs';
import { describeKind, formatRecordedAt, toRecordView } from './ledger-view';

describe('describeKind', () => {
  it('names the kind and the one detail that identifies it', () => {
    expect(describeKind(ledgerEntry(REF.run))).toBe('run · /demarches/acte-naissance · mobile-4g');
    expect(describeKind(ledgerEntry(REF.report))).toBe('report_generated · T3 2026');
    expect(describeKind(ledgerEntry(REF.declarationV2))).toBe('declaration_version · v2');
    expect(describeKind(ledgerEntry(REF.override))).toBe('budget_override · PR #401');
    expect(describeKind(ledgerEntry(REF.rebaseline4790))).toBe('rebaseline · #4790');
  });

  it('falls back to the kind alone when the payload carries no detail', () => {
    const bare: LedgerEntry = { ...ledgerEntry(REF.run), payload: {} };
    expect(describeKind(bare)).toBe('run');
  });
});

describe('formatRecordedAt', () => {
  it('states the zone, and reads the timestamp in it', () => {
    expect(formatRecordedAt('2026-08-15T14:02:41.000Z')).toBe('15/08/2026 14:02:41 UTC');
  });

  it('pads every component', () => {
    expect(formatRecordedAt('2026-03-04T09:05:07.000Z')).toBe('04/03/2026 09:05:07 UTC');
  });
});

describe('toRecordView', () => {
  it('reads the recorded values off the run entry', () => {
    const view = toRecordView(ledgerEntry(REF.run));
    // run #4812 is the candidate on /demarches/acte-naissance, so the register
    // carries that run's figures and not the service median's.
    expect(view.values).toEqual({
      transferredKb: formatInt(1298),
      madKb: '9',
      requests: '84',
      domNodes: formatInt(2140),
      carbon: '0,078',
      low: '0,078',
      high: '0,301',
    });
    expect(view.fingerprint).toContain('chromium 127.0.6533.88');
    expect(view.models).toBe('ecoindex@0.1.0 · swd@0.1.0 · onebyte@0.1.0');
  });

  it('omits what an entry does not carry rather than filling it in', () => {
    const view = toRecordView(ledgerEntry(REF.declarationV2));
    expect(view.values).toBeUndefined();
    expect(view.fingerprint).toBeUndefined();
    expect(view.models).toBeUndefined();
  });

  it('counts the position from one and names the previous entry', () => {
    const entry = ledgerEntry(REF.report);
    const view = toRecordView(entry);
    expect(view.position.startsWith(formatInt(entry.sequence + 1))).toBe(true);
    expect(view.position).toContain(entry.prevHash.slice(0, 8));
  });

  it('builds a view for every entry the canon cites', () => {
    for (const entry of ledgerCanon.entries) {
      const view = toRecordView(entry);
      expect(view.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(view.shortHash).toHaveLength(8);
      expect(view.type).not.toBe('');
    }
  });
});
