import { describe, expect, it } from 'vitest';
import type { LedgerEntry, OrganizationId } from '@balise/schemas';
import { append, verifyEntries } from '../src/chain.js';
import { entryHashOf, payloadHashOf } from '../src/hash.js';
import { createMemoryStore } from '../src/store.js';

// adversarial: every one of these is someone trying to change the record
// after the fact. each has to be found, and found at the right entry.

const ORG = 'org_sextant' as OrganizationId;
let clock = Date.parse('2026-08-15T14:02:41.000Z');
const now = () => new Date((clock += 1000));

async function chain(count = 5): Promise<LedgerEntry[]> {
  const store = createMemoryStore();
  const entries: LedgerEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    entries.push(
      await append(
        store,
        { organizationId: ORG, kind: 'run', refId: `run_${index}`, payload: { requests: 80 + index } },
        { now },
      ),
    );
  }
  return entries;
}

function reasonsAt(result: ReturnType<typeof verifyEntries>, sequence: number): string[] {
  if (result.status !== 'broken') return [];
  return result.failures.filter((failure) => failure.sequence === sequence).map((f) => f.reason);
}

describe('tampering with the record', () => {
  it('catches an edited payload', async () => {
    const entries = await chain();
    entries[2] = { ...entries[2]!, payload: { requests: 9999 } };
    const result = verifyEntries(entries);
    expect(result.status).toBe('broken');
    expect(reasonsAt(result, 2)).toContain('payload-hash-mismatch');
  });

  it('catches an edited payload whose payload hash was updated to match', async () => {
    const entries = await chain();
    const payload = { requests: 9999 };
    entries[2] = { ...entries[2]!, payload, payloadHash: payloadHashOf(payload) };
    const result = verifyEntries(entries);
    expect(result.status).toBe('broken');
    // the payload hash now agrees; the entry hash is what gives it away
    expect(reasonsAt(result, 2)).toEqual(['entry-hash-mismatch']);
  });

  it('catches a rewritten entry whose own hash was recomputed, through the next link', async () => {
    const entries = await chain();
    const payload = { requests: 9999 };
    const rewritten = { ...entries[2]!, payload, payloadHash: payloadHashOf(payload) };
    entries[2] = { ...rewritten, entryHash: entryHashOf(rewritten) };

    const result = verifyEntries(entries);
    expect(result.status).toBe('broken');
    // entry 2 is now internally consistent. entry 3 still points at the old hash.
    expect(reasonsAt(result, 2)).toEqual([]);
    expect(reasonsAt(result, 3)).toContain('prev-hash-mismatch');
  });

  it('catches a removed entry', async () => {
    const entries = await chain();
    entries.splice(2, 1);
    const result = verifyEntries(entries);
    expect(result.status).toBe('broken');
    expect(reasonsAt(result, 3)).toContain('sequence-out-of-order');
    expect(reasonsAt(result, 3)).toContain('prev-hash-mismatch');
  });

  it('catches two entries swapped', async () => {
    const entries = await chain();
    [entries[1], entries[2]] = [entries[2]!, entries[1]!];
    expect(verifyEntries(entries).status).toBe('broken');
  });

  it('catches an entry spliced in from another chain', async () => {
    const entries = await chain();
    const [foreign] = await chain(1);
    entries.splice(3, 0, foreign!);
    expect(verifyEntries(entries).status).toBe('broken');
  });

  it('catches an entry belonging to another tenant', async () => {
    const entries = await chain();
    entries[2] = { ...entries[2]!, organizationId: 'org_autre' as OrganizationId };
    const result = verifyEntries(entries, ORG);
    expect(result.status).toBe('broken');
    expect(reasonsAt(result, 2)).toContain('organization-mismatch');
  });

  it('catches a backdated entry', async () => {
    const entries = await chain();
    entries[2] = { ...entries[2]!, createdAt: '2020-01-01T00:00:00.000Z' };
    const result = verifyEntries(entries);
    expect(result.status).toBe('broken');
    expect(reasonsAt(result, 2)).toContain('entry-hash-mismatch');
  });

  it('catches a correction reason edited after the fact', async () => {
    const store = createMemoryStore();
    const first = await append(
      store,
      { organizationId: ORG, kind: 'run', refId: 'run_0', payload: { requests: 84 } },
      { now },
    );
    const correction = await append(
      store,
      {
        organizationId: ORG,
        kind: 'run',
        refId: 'run_0',
        payload: { requests: 86 },
        supersedes: { entryHash: first.entryHash, reason: 'recount' },
      },
      { now },
    );
    const entries = [first, { ...correction, supersedes: { entryHash: first.entryHash, reason: 'routine' } }];
    const result = verifyEntries(entries);
    expect(result.status).toBe('broken');
    expect(reasonsAt(result, 1)).toContain('entry-hash-mismatch');
  });

  it('reports every affected entry, not only the first', async () => {
    const entries = await chain();
    entries[1] = { ...entries[1]!, payload: { requests: 1 } };
    entries[3] = { ...entries[3]!, payload: { requests: 2 } };
    const result = verifyEntries(entries);
    if (result.status !== 'broken') throw new Error('expected a broken chain');
    expect(result.failures.map((failure) => failure.sequence)).toEqual([1, 3]);
    expect(result.checkedCount).toBe(5);
  });

  it('reports a genesis entry relinked to something other than the genesis hash', async () => {
    const entries = await chain();
    entries[0] = { ...entries[0]!, prevHash: 'a'.repeat(64) };
    const result = verifyEntries(entries);
    expect(result.status).toBe('broken');
    expect(reasonsAt(result, 0)).toContain('prev-hash-mismatch');
  });
});
