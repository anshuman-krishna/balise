import { describe, expect, it } from 'vitest';
import type { OrganizationId } from '@balise/schemas';
import { append } from '../src/chain.js';
import { sha256 } from '../src/hash.js';
import { anchor, merkleLevel, merkleRoot } from '../src/merkle.js';
import { createMemoryStore } from '../src/store.js';

const ORG = 'org_sextant' as OrganizationId;
let clock = Date.parse('2026-08-15T04:00:00.000Z');
const now = () => new Date((clock += 1000));

describe('merkleRoot', () => {
  it('is the leaf itself for a single leaf', () => {
    expect(merkleRoot(['a'.repeat(64)])).toBe('a'.repeat(64));
  });

  it('pairs left to right', () => {
    const [a, b] = ['a'.repeat(64), 'b'.repeat(64)];
    expect(merkleRoot([a!, b!])).toBe(sha256(`${a}${b}`));
  });

  it('promotes an odd node rather than duplicating it', () => {
    const [a, b, c] = ['a'.repeat(64), 'b'.repeat(64), 'c'.repeat(64)];
    expect(merkleLevel([a!, b!, c!])).toEqual([sha256(`${a}${b}`), c]);
    // duplicating the last leaf would make these two leaf sets share a root
    expect(merkleRoot([a!, b!, c!])).not.toBe(merkleRoot([a!, b!, c!, c!]));
  });

  it('changes when any leaf changes', () => {
    const leaves = ['a', 'b', 'c', 'd', 'e'].map((c) => c.repeat(64));
    const before = merkleRoot(leaves);
    const after = merkleRoot([...leaves.slice(0, 3), 'f'.repeat(64), leaves[4]!]);
    expect(after).not.toBe(before);
  });

  it('changes when two leaves are swapped', () => {
    const leaves = ['a', 'b', 'c', 'd'].map((c) => c.repeat(64));
    const swapped = [leaves[1]!, leaves[0]!, leaves[2]!, leaves[3]!];
    expect(merkleRoot(swapped)).not.toBe(merkleRoot(leaves));
  });

  it('refuses to root an empty set', () => {
    expect(() => merkleRoot([])).toThrow(/at least one leaf/);
  });
});

describe('anchor', () => {
  it('covers the range it says it covers', async () => {
    const store = createMemoryStore();
    for (let index = 0; index < 6; index += 1) {
      await append(
        store,
        { organizationId: ORG, kind: 'run', refId: `run_${index}`, payload: { i: index } },
        { now },
      );
    }
    const root = await anchor(store, ORG, { now });
    expect(root.fromSequence).toBe(0);
    expect(root.toSequence).toBe(5);
    expect(root.leafCount).toBe(6);
    expect(root.root).toMatch(/^[0-9a-f]{64}$/);
    expect(root.organizationId).toBe(ORG);
  });

  it('produces a different root once another entry is appended', async () => {
    const store = createMemoryStore();
    await append(store, { organizationId: ORG, kind: 'run', refId: 'a', payload: {} }, { now });
    const first = await anchor(store, ORG, { now });
    await append(store, { organizationId: ORG, kind: 'run', refId: 'b', payload: {} }, { now });
    const second = await anchor(store, ORG, { now });
    expect(second.root).not.toBe(first.root);
    expect(second.leafCount).toBe(2);
  });

  it('refuses to anchor an empty range', async () => {
    await expect(anchor(createMemoryStore(), ORG, { now })).rejects.toThrow(/nothing to anchor/);
  });
});
