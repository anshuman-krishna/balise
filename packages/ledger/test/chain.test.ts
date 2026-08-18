import { describe, expect, it } from 'vitest';
import { GENESIS_PREV_HASH, type LedgerEntry, type OrganizationId } from '@balise/schemas';
import { append, findByHash, verify, verifyEntries } from '../src/chain.js';
import { createMemoryStore, type LedgerStore } from '../src/store.js';

const ORG = 'org_sextant' as OrganizationId;
const OTHER = 'org_autre' as OrganizationId;

let clock = Date.parse('2026-08-15T14:02:41.000Z');
const now = () => new Date((clock += 1000));

function input(refId: string, payload: Record<string, unknown> = { transferredBytes: 1_258_000 }) {
  return { organizationId: ORG, kind: 'run' as const, refId, payload };
}

async function chainOf(store: LedgerStore, count: number): Promise<LedgerEntry[]> {
  const entries: LedgerEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    entries.push(await append(store, input(`run_${index}`), { now }));
  }
  return entries;
}

describe('append', () => {
  it('starts a chain at sequence zero, linked to the genesis hash', async () => {
    const store = createMemoryStore();
    const entry = await append(store, input('run_0'), { now });
    expect(entry.sequence).toBe(0);
    expect(entry.prevHash).toBe(GENESIS_PREV_HASH);
    expect(entry.entryHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('links each entry to the one before it', async () => {
    const store = createMemoryStore();
    const entries = await chainOf(store, 4);
    for (let index = 1; index < entries.length; index += 1) {
      expect(entries[index]!.prevHash).toBe(entries[index - 1]!.entryHash);
      expect(entries[index]!.sequence).toBe(index);
    }
  });

  it('hashes the payload canonically, so key order does not change the digest', async () => {
    const store = createMemoryStore();
    const a = await append(store, { ...input('run_0'), payload: { a: 1, b: 2 } }, { now });
    const b = await append(store, { ...input('run_1'), payload: { b: 2, a: 1 } }, { now });
    expect(b.payloadHash).toBe(a.payloadHash);
    // the entries themselves still differ: position and reference are hashed too
    expect(b.entryHash).not.toBe(a.entryHash);
  });

  it('keeps one chain per tenant', async () => {
    const store = createMemoryStore();
    await append(store, input('run_0'), { now });
    const other = await append(
      store,
      { organizationId: OTHER, kind: 'run', refId: 'run_0', payload: {} },
      { now },
    );
    expect(other.sequence).toBe(0);
    expect(other.prevHash).toBe(GENESIS_PREV_HASH);
  });

  it('records a correction as a new entry that names what it supersedes', async () => {
    const store = createMemoryStore();
    const original = await append(store, input('run_0', { requests: 84 }), { now });
    const correction = await append(
      store,
      {
        ...input('run_0', { requests: 86 }),
        supersedes: { entryHash: original.entryHash, reason: 'recount after a dropped response' },
      },
      { now },
    );

    expect(correction.sequence).toBe(1);
    expect(correction.supersedes?.entryHash).toBe(original.entryHash);
    // the original is still there, unchanged, and still verifies
    const entries = await store.read(ORG);
    expect(entries[0]).toEqual(original);
    expect((await verify(store, ORG)).status).toBe('intact');
  });
});

describe('verify', () => {
  it('reports an untouched chain as intact', async () => {
    const store = createMemoryStore();
    const entries = await chainOf(store, 5);
    const result = await verify(store, ORG);
    expect(result.status).toBe('intact');
    if (result.status !== 'intact') return;
    expect(result.checkedCount).toBe(5);
    expect(result.fromHash).toBe(entries[0]!.entryHash);
    expect(result.toHash).toBe(entries[4]!.entryHash);
  });

  it('reports an empty chain as intact, having checked nothing', async () => {
    const result = await verify(createMemoryStore(), ORG);
    expect(result).toEqual({ status: 'intact', checkedCount: 0 });
  });

  it('verifies a range that does not start at the genesis entry', async () => {
    const store = createMemoryStore();
    await chainOf(store, 5);
    const result = await verify(store, ORG, 2);
    expect(result.status).toBe('intact');
    if (result.status === 'intact') expect(result.checkedCount).toBe(3);
  });
});

describe('findByHash', () => {
  it('finds an entry by its full hash or an eight character prefix', async () => {
    const store = createMemoryStore();
    const entries = await chainOf(store, 3);
    const target = entries[1]!;
    expect(await findByHash(store, ORG, target.entryHash)).toEqual(target);
    expect(await findByHash(store, ORG, target.entryHash.slice(0, 8).toUpperCase())).toEqual(target);
  });

  it('refuses a prefix too short to identify an entry', async () => {
    const store = createMemoryStore();
    const entries = await chainOf(store, 3);
    expect(await findByHash(store, ORG, entries[0]!.entryHash.slice(0, 7))).toBeUndefined();
  });

  it('reports a miss rather than the nearest entry', async () => {
    const store = createMemoryStore();
    await chainOf(store, 3);
    expect(await findByHash(store, ORG, 'ffffffff')).toBeUndefined();
  });
});

describe('verifyEntries on a range with no context', () => {
  it('does not demand a genesis link from a mid-chain range', async () => {
    const store = createMemoryStore();
    const entries = await chainOf(store, 4);
    expect(verifyEntries(entries.slice(2)).status).toBe('intact');
  });
});
