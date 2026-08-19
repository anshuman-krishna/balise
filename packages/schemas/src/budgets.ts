import { z } from 'zod';
import { Delta } from './delta.js';
import { ThrottleProfile } from './fingerprint.js';
import { CachePass, MetricId, Unit } from './metrics.js';
import { NoiseFloor } from './noise.js';

// ---------------------------------------------------------------------------
// what a customer writes in balise.yml
// ---------------------------------------------------------------------------

/**
 * what a budget applies to. a route pattern names pages, a journey names a
 * scripted parcours, and `service` applies to everything measured, because a
 * service-wide limit that only checked an aggregate could hold while a single
 * route breached it.
 */
export const BudgetScope = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('route'), pattern: z.string().min(1) }),
  z.object({ kind: z.literal('journey'), journey: z.string().min(1) }),
  z.object({ kind: z.literal('service') }),
]);
export type BudgetScope = z.infer<typeof BudgetScope>;

/** the keys a budget block may carry. anything else is refused by name. */
export const BudgetMetricKey = z.enum([
  'bytes',
  'requests',
  'dom_nodes',
  'js_time_ms',
  'third_party_bytes',
  'third_party_share',
]);
export type BudgetMetricKey = z.infer<typeof BudgetMetricKey>;

export const BUDGET_METRIC_ID: Record<BudgetMetricKey, MetricId> = {
  bytes: 'transferred_bytes',
  requests: 'request_count',
  dom_nodes: 'dom_node_count',
  js_time_ms: 'js_execution_ms',
  third_party_bytes: 'third_party_bytes',
  third_party_share: 'third_party_share_pct',
};

/** the key for a growth limit against the branch baseline. */
export const RELATIVE_KEY = 'relative_to_baseline';

export const Threshold = z.object({
  /** in the metric's canonical unit. bytes are bytes, never kilobytes. */
  value: z.number().finite(),
  /** what the customer wrote, so the file and the screen cannot disagree. */
  sourceText: z.string().min(1),
  line: z.number().int().positive(),
});
export type Threshold = z.infer<typeof Threshold>;

/**
 * an absolute rule limits the measured value. a relative rule limits growth
 * against the baseline, and is evaluated through classifyDelta first, so it
 * cannot fail on a delta the kernel does not consider a change.
 */
export const BudgetRuleKind = z.enum(['absolute', 'relative']);
export type BudgetRuleKind = z.infer<typeof BudgetRuleKind>;

export const BudgetRule = z.object({
  kind: BudgetRuleKind,
  scope: BudgetScope,
  metricId: MetricId,
  /** the unit of the thresholds: the metric's own unit, or pct when relative. */
  unit: Unit,
  warn: Threshold.nullable(),
  fail: Threshold.nullable(),
  line: z.number().int().positive(),
});
export type BudgetRule = z.infer<typeof BudgetRule>;

/**
 * the floor is derived from measured dispersion. `auto` is the only accepted
 * value: a written floor would be a hand-chosen number, which is exactly what
 * the derived floor exists to avoid.
 */
export const NoiseFloorMode = z.enum(['auto']);
export type NoiseFloorMode = z.infer<typeof NoiseFloorMode>;

export const BlockMergeOn = z.enum(['fail', 'warn', 'never']);
export type BlockMergeOn = z.infer<typeof BlockMergeOn>;

export const CheckPolicy = z.object({
  blockMergeOn: BlockMergeOn,
  annotateFiles: z.boolean(),
});
export type CheckPolicy = z.infer<typeof CheckPolicy>;

export const BudgetConfig = z.object({
  version: z.literal(1),
  service: z.string().min(1),
  /** methodology rule: configurable up, never below three. */
  runs: z.number().int().min(3),
  profiles: z.array(ThrottleProfile).min(1),
  /** the model marked on every band, as `id@version`. */
  referenceModel: z.string().min(1),
  noiseFloor: NoiseFloorMode,
  rules: z.array(BudgetRule),
  check: CheckPolicy,
});
export type BudgetConfig = z.infer<typeof BudgetConfig>;

/** a refusal to read the file, with the line that caused it. */
export const ConfigIssue = z.object({
  line: z.number().int().nonnegative(),
  path: z.string(),
  message: z.string().min(1),
});
export type ConfigIssue = z.infer<typeof ConfigIssue>;

export const ConfigResult = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), config: BudgetConfig }),
  z.object({ status: z.literal('invalid'), issues: z.array(ConfigIssue).min(1) }),
]);
export type ConfigResult = z.infer<typeof ConfigResult>;

// ---------------------------------------------------------------------------
// what the engine returns
// ---------------------------------------------------------------------------

export const BudgetStatus = z.enum(['conforme', 'warn', 'breach', 'non_evalue']);
export type BudgetStatus = z.infer<typeof BudgetStatus>;

/**
 * why a rule produced no verdict. every one of these is a refusal to decide,
 * never a pass and never a failure.
 */
export const BudgetSkipReason = z.enum([
  // budgets activate once the floor is established (operating manual, statistics).
  'no-noise-floor',
  'metric-not-measured',
  'no-baseline',
  'no-threshold',
]);
export type BudgetSkipReason = z.infer<typeof BudgetSkipReason>;

/**
 * a recorded decision to let a breach through. the breach is still reported as
 * a breach; what the override lifts is the merge block, and it appears in the
 * execution report. teams bypass a check that has no escape hatch.
 */
export const BudgetOverride = z.object({
  scope: BudgetScope,
  metricId: MetricId,
  reason: z.string().min(1),
  by: z.string().min(1),
  recordedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  /** where it was asked for: a pull request or an issue reference. */
  requestedIn: z.string().optional(),
  /** the ledger entry that carries it. */
  ledgerRef: z.string().optional(),
});
export type BudgetOverride = z.infer<typeof BudgetOverride>;

export const BudgetAssessment = z.object({
  scenarioId: z.string().min(1),
  scenarioLabel: z.string().min(1),
  pass: CachePass,
  rule: BudgetRule,
  metricId: MetricId,
  unit: Unit,
  status: BudgetStatus,
  /** set when, and only when, the status is non_evalue. */
  reason: BudgetSkipReason.optional(),
  /** the measured median, in the rule's unit. null when nothing was measured. */
  observed: z.number().finite().nullable(),
  /** distance to the threshold that decided the status. negative once past it. */
  headroom: z.number().finite().nullable(),
  /**
   * true when the headroom is smaller than the measurement noise: the value is
   * sitting on the line, whichever side of it this run's median fell.
   */
  withinNoise: z.boolean(),
  floor: NoiseFloor,
  /** relative rules only: the kernel's verdict on the change. */
  delta: Delta.nullable(),
  override: BudgetOverride.nullable(),
});
export type BudgetAssessment = z.infer<typeof BudgetAssessment>;

export const CheckConclusion = z.enum(['success', 'neutral', 'failure']);
export type CheckConclusion = z.infer<typeof CheckConclusion>;

export const CheckSummary = z.object({
  conclusion: CheckConclusion,
  counts: z.object({
    conforme: z.number().int().nonnegative(),
    warn: z.number().int().nonnegative(),
    breach: z.number().int().nonnegative(),
    nonEvalue: z.number().int().nonnegative(),
  }),
  /** the assessments that hold the merge, in the order they were evaluated. */
  blocking: z.array(BudgetAssessment),
  /** breaches a recorded override let through. reported, never hidden. */
  overridden: z.array(BudgetAssessment),
});
export type CheckSummary = z.infer<typeof CheckSummary>;

// ---------------------------------------------------------------------------
// what the check posts
// ---------------------------------------------------------------------------

/**
 * failure is the only level that holds a merge. a breach a recorded override
 * covers is a warning here and stays a breach everywhere else: what the
 * override lifts is the block, never the finding.
 */
export const CheckAnnotationLevel = z.enum(['failure', 'warning', 'notice']);
export type CheckAnnotationLevel = z.infer<typeof CheckAnnotationLevel>;

/**
 * a note attached to a line of a file in the diff view. every annotation names
 * a line we actually read: the budget file records a line per threshold, so an
 * annotation points at the rule that decided, not at a guess. nothing is
 * annotated on a source file until attribution can place a line in it.
 */
export const CheckAnnotation = z.object({
  path: z.string().min(1),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  level: CheckAnnotationLevel,
  title: z.string().min(1),
  message: z.string().min(1),
});
export type CheckAnnotation = z.infer<typeof CheckAnnotation>;

export const CheckRunOutput = z.object({
  conclusion: CheckConclusion,
  /** the one line shown beside the check name. */
  title: z.string().min(1),
  /** markdown, above the fold: the verdict and what caused it. */
  summary: z.string().min(1),
  /** markdown: the measurements, the budgets, the attribution, the provenance. */
  text: z.string().min(1),
  annotations: z.array(CheckAnnotation),
  /** annotations dropped to stay under the api limit, reported not hidden. */
  annotationsOmitted: z.number().int().nonnegative(),
});
export type CheckRunOutput = z.infer<typeof CheckRunOutput>;
