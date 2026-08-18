import { z } from 'zod';
import { CriterionId } from './ids.js';
import { MetricId } from './metrics.js';

/**
 * every criterion in every pack is in exactly one tier, and the tier is shown
 * openly. claiming a declarative criterion was automated would collapse on
 * first contact with an auditor.
 */
export const CriterionTier = z.enum(['automated', 'assisted', 'declarative']);
export type CriterionTier = z.infer<typeof CriterionTier>;

/**
 * the first four are the official grid and are the only statuses a published
 * declaration may claim. `non_evalue` is the absence of an answer, not a
 * verdict, and it is never published as one.
 */
export const AssessmentStatus = z.enum([
  'conforme',
  'partiellement_conforme',
  'non_conforme',
  'non_applicable',
  'non_evalue',
]);
export type AssessmentStatus = z.infer<typeof AssessmentStatus>;

export const ComparisonOperator = z.enum(['lte', 'lt', 'gte', 'gt', 'eq']);
export type ComparisonOperator = z.infer<typeof ComparisonOperator>;

// the one evaluation shape v1 implements. an unknown type is not an error in
// a pack: it is a criterion this engine cannot answer, and it degrades to
// non_evalue rather than being guessed at.
export const MetricThresholdEvaluation = z.object({
  type: z.literal('metric_threshold'),
  metric: MetricId,
  operator: ComparisonOperator,
  value: z.number().finite(),
  scope: z.string().min(1).optional(),
});
export type MetricThresholdEvaluation = z.infer<typeof MetricThresholdEvaluation>;

export const UnsupportedEvaluation = z
  .object({ type: z.string().min(1) })
  .passthrough();

export const CriterionEvaluation = z.union([MetricThresholdEvaluation, UnsupportedEvaluation]);
export type CriterionEvaluation = z.infer<typeof CriterionEvaluation>;

export const EvidenceRequirement = z.object({
  kind: z.enum(['document', 'attestation', 'measurement', 'analysis']),
  labelFr: z.string().min(1),
});
export type EvidenceRequirement = z.infer<typeof EvidenceRequirement>;

export const Criterion = z.object({
  id: CriterionId,
  family: z.string().min(1),
  tier: CriterionTier,
  /** verbatim from the official referential. never paraphrased, never translated. */
  statementFr: z.string().min(1),
  evaluation: CriterionEvaluation.optional(),
  evidenceRequired: z.array(EvidenceRequirement).default([]),
  notesFr: z.string().optional(),
});
export type Criterion = z.infer<typeof Criterion>;

export const RulePackFamily = z.object({
  id: z.string().min(1),
  labelFr: z.string().min(1),
});
export type RulePackFamily = z.infer<typeof RulePackFamily>;

// a pack is immutable once published. changes create a new version, and an
// assessment made under one version stays bound to it forever.
export const RulePack = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  locale: z.string().min(1),
  source: z.string().min(1),
  families: z.array(RulePackFamily).min(1),
  criteria: z.array(Criterion).min(1),
});
export type RulePack = z.infer<typeof RulePack>;

/** what the engine was given to reason about, for one service. */
export const CriterionEvidence = z.object({
  /**
   * measured values, keyed by metric, from the aggregate under assessment.
   * partial: a metric that was not measured is absent, never zero.
   */
  metrics: z.partialRecord(MetricId, z.number().finite()).default({}),
  /** answers a human has confirmed, keyed by criterion id. */
  attestations: z
    .record(
      z.string(),
      z.object({
        status: AssessmentStatus,
        justification: z.string().optional(),
        attestedBy: z.string().min(1),
        attestedAt: z.string().datetime(),
        evidenceRefs: z.array(z.string()).default([]),
      }),
    )
    .default({}),
});
export type CriterionEvidence = z.infer<typeof CriterionEvidence>;

export const AssessmentSource = z.enum(['measured', 'attested', 'unevaluated']);
export type AssessmentSource = z.infer<typeof AssessmentSource>;

export const CriterionAssessment = z.object({
  criterionId: CriterionId,
  packId: z.string().min(1),
  packVersion: z.string().min(1),
  tier: CriterionTier,
  status: AssessmentStatus,
  source: AssessmentSource,
  /** why the engine answered as it did, in plain language. */
  evidenceFr: z.string().min(1),
  justification: z.string().optional(),
  attestedBy: z.string().optional(),
  attestedAt: z.string().datetime().optional(),
  /**
   * an assisted answer the engine proposed. it does not count until a person
   * confirms it, and nothing may publish it before then.
   */
  requiresConfirmation: z.boolean(),
});
export type CriterionAssessment = z.infer<typeof CriterionAssessment>;

export const TierCompletion = z.object({
  tier: CriterionTier,
  answered: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type TierCompletion = z.infer<typeof TierCompletion>;

export const CompletionByTier = z.object({
  byTier: z.array(TierCompletion),
  /** conformity rate over applicable criteria: conforme / applicable. */
  conforme: z.number().int().nonnegative(),
  applicable: z.number().int().nonnegative(),
});
export type CompletionByTier = z.infer<typeof CompletionByTier>;

export const BlockingReason = z.enum([
  'missing-justification',
  'unassessed-criterion',
  'unconfirmed-proposal',
  'missing-evidence',
]);
export type BlockingReason = z.infer<typeof BlockingReason>;

/** what stands between a draft and a declaration that may be published. */
export const BlockingFinding = z.object({
  criterionId: CriterionId,
  tier: CriterionTier,
  reason: BlockingReason,
  detailFr: z.string().min(1),
});
export type BlockingFinding = z.infer<typeof BlockingFinding>;
