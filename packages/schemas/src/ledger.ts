import { z } from 'zod';
import { OrganizationId } from './ids.js';

// the kinds of thing that get recorded. an entry kind is added deliberately,
// never as a string literal at a call site.
export const LedgerEntryKind = z.enum([
  'run',
  'attestation',
  'declaration_version',
  'budget_override',
  'rebaseline',
  'report_generated',
  'methodology_version',
]);
export type LedgerEntryKind = z.infer<typeof LedgerEntryKind>;

// a sha-256 digest, lowercase hex.
export const Sha256 = z.string().regex(/^[0-9a-f]{64}$/);
export type Sha256 = z.infer<typeof Sha256>;

/**
 * a correction never replaces an entry. it is appended, referencing what it
 * supersedes and carrying the reason, and the original stays readable.
 */
export const Supersedes = z.object({
  entryHash: Sha256,
  reason: z.string().min(1),
});
export type Supersedes = z.infer<typeof Supersedes>;

export const LedgerEntryInput = z.object({
  organizationId: OrganizationId,
  kind: LedgerEntryKind,
  // what the entry is about: a run id, a declaration version, a report id.
  refId: z.string().min(1),
  // the recorded facts. hashed canonically, so key order cannot change the
  // digest and a reordered payload cannot look like a different one.
  payload: z.record(z.string(), z.unknown()),
  supersedes: Supersedes.optional(),
});
export type LedgerEntryInput = z.infer<typeof LedgerEntryInput>;

export const LedgerEntry = LedgerEntryInput.extend({
  // position in the tenant's chain, from zero.
  sequence: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  payloadHash: Sha256,
  // the hash of the previous entry in this tenant's chain. the genesis entry
  // carries 64 zeroes.
  prevHash: Sha256,
  entryHash: Sha256,
});
export type LedgerEntry = z.infer<typeof LedgerEntry>;

export const GENESIS_PREV_HASH = '0'.repeat(64);

export const VerificationFailure = z.object({
  sequence: z.number().int().nonnegative(),
  entryHash: Sha256,
  reason: z.enum([
    'payload-hash-mismatch',
    'entry-hash-mismatch',
    'prev-hash-mismatch',
    'sequence-out-of-order',
    'organization-mismatch',
  ]),
  detail: z.string().min(1),
});
export type VerificationFailure = z.infer<typeof VerificationFailure>;

// a broken chain is a finding, not something to repair. verification reports
// what it found and where.
export const VerificationResult = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('intact'),
    checkedCount: z.number().int().nonnegative(),
    fromHash: Sha256.optional(),
    toHash: Sha256.optional(),
  }),
  z.object({
    status: z.literal('broken'),
    checkedCount: z.number().int().nonnegative(),
    failures: z.array(VerificationFailure).min(1),
  }),
]);
export type VerificationResult = z.infer<typeof VerificationResult>;

export const MerkleRoot = z.object({
  organizationId: OrganizationId,
  root: Sha256,
  // the range of the chain this root covers, inclusive.
  fromSequence: z.number().int().nonnegative(),
  toSequence: z.number().int().nonnegative(),
  leafCount: z.number().int().positive(),
  anchoredAt: z.string().datetime(),
});
export type MerkleRoot = z.infer<typeof MerkleRoot>;
