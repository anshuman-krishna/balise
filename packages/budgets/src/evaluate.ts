import {
  type AggregatedMetric,
  type BudgetAssessment,
  type BudgetConfig,
  type BudgetOverride,
  type BudgetRule,
  type BudgetSkipReason,
  type Delta,
  type NoiseFloor,
  type Threshold,
} from '@balise/schemas';
import { NOISE_FLOOR_MIN_HISTORY, classifyDelta, getAggregatedMetric } from '@balise/measure-core';
import { sameScope, scopeMatches, type ScenarioMeasurement } from './scope.js';

export interface BudgetEvaluationInput {
  config: BudgetConfig;
  scenarios: readonly ScenarioMeasurement[];
  /** recorded decisions to let a breach through. they lift the merge block, not the breach. */
  overrides?: readonly BudgetOverride[];
  /** the instant the evaluation is made at. used only to expire overrides. */
  evaluatedAt?: string;
}

function floorFor(scenario: ScenarioMeasurement, rule: BudgetRule): NoiseFloor {
  const found = scenario.floors.find((floor) => floor.metricId === rule.metricId);
  if (found !== undefined) return found;
  return {
    status: 'insufficient-history',
    metricId: rule.metricId,
    sampleCount: 0,
    requiredCount: NOISE_FLOOR_MIN_HISTORY,
  };
}

function activeOverride(
  overrides: readonly BudgetOverride[],
  rule: BudgetRule,
  at: string | undefined,
): BudgetOverride | null {
  for (const override of overrides) {
    if (override.metricId !== rule.metricId) continue;
    if (!sameScope(override.scope, rule.scope)) continue;
    if (override.expiresAt !== undefined && at !== undefined && override.expiresAt <= at) continue;
    return override;
  }
  return null;
}

interface Skeleton {
  scenarioId: string;
  scenarioLabel: string;
  pass: BudgetAssessment['pass'];
  rule: BudgetRule;
  metricId: BudgetRule['metricId'];
  unit: BudgetRule['unit'];
  floor: NoiseFloor;
  override: BudgetOverride | null;
}

function skip(base: Skeleton, reason: BudgetSkipReason): BudgetAssessment {
  return {
    ...base,
    status: 'non_evalue',
    reason,
    observed: null,
    headroom: null,
    withinNoise: false,
    delta: null,
  };
}

/** the threshold a headroom is measured against: the failing one if there is one. */
export function decidingThreshold(rule: BudgetRule): Threshold | null {
  return rule.fail ?? rule.warn;
}

function statusFor(rule: BudgetRule, observed: number): BudgetAssessment['status'] {
  if (rule.fail !== null && observed > rule.fail.value) return 'breach';
  if (rule.warn !== null && observed > rule.warn.value) return 'warn';
  return 'conforme';
}

function absolute(base: Skeleton, metric: AggregatedMetric): BudgetAssessment {
  const observed = metric.median;
  const deciding = decidingThreshold(base.rule);
  if (deciding === null) return skip(base, 'no-threshold');

  const headroom = deciding.value - observed;
  const floorValue = base.floor.status === 'established' ? base.floor.value : 0;

  return {
    ...base,
    status: statusFor(base.rule, observed),
    observed,
    headroom,
    // the median is sitting on the line: which side of it this run landed on is
    // inside the measurement noise, and the screen says so rather than dressing
    // the crossing up as a result.
    withinNoise: Math.abs(headroom) <= floorValue,
    delta: null,
  };
}

function relative(
  base: Skeleton,
  before: AggregatedMetric | undefined,
  after: AggregatedMetric,
): BudgetAssessment {
  if (before === undefined) return skip(base, 'no-baseline');
  if (before.median === 0) return skip(base, 'no-baseline');
  const deciding = decidingThreshold(base.rule);
  if (deciding === null) return skip(base, 'no-threshold');

  // invariant 2 first: a growth limit cannot be broken by a change the kernel
  // does not consider a change. this is the whole reason the rule exists.
  const delta: Delta = classifyDelta(before, after, base.floor);
  const growthPct = ((after.median - before.median) / before.median) * 100;
  const floorPct =
    base.floor.status === 'established' ? (base.floor.value / before.median) * 100 : 0;

  if (delta.classification !== 'regression') {
    return {
      ...base,
      status: 'conforme',
      observed: growthPct,
      headroom: deciding.value - growthPct,
      withinNoise: Math.abs(deciding.value - growthPct) <= floorPct,
      delta,
    };
  }

  return {
    ...base,
    status: statusFor(base.rule, growthPct),
    observed: growthPct,
    headroom: deciding.value - growthPct,
    withinNoise: Math.abs(deciding.value - growthPct) <= floorPct,
    delta,
  };
}

/**
 * every rule against every scenario it names. one assessment per pair, in
 * config order, so a screen and a check comment can be built from the same
 * list without either of them re-deciding anything.
 *
 * the rule that matters: nothing fails on a scenario whose noise floor is not
 * established. budgets activate once there is enough history to know what a
 * change looks like on that scenario, and until then every verdict is
 * `non_evalue` and the check cannot block a merge on it.
 */
export function evaluateBudgets(input: BudgetEvaluationInput): BudgetAssessment[] {
  const overrides = input.overrides ?? [];
  const out: BudgetAssessment[] = [];

  for (const rule of input.config.rules) {
    for (const scenario of input.scenarios) {
      if (!scopeMatches(rule.scope, scenario)) continue;

      const base: Skeleton = {
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        pass: scenario.candidate.pass,
        rule,
        metricId: rule.metricId,
        unit: rule.unit,
        floor: floorFor(scenario, rule),
        override: activeOverride(overrides, rule, input.evaluatedAt),
      };

      const measured = getAggregatedMetric(scenario.candidate, rule.metricId);
      if (measured === undefined) {
        out.push(skip(base, 'metric-not-measured'));
        continue;
      }
      if (base.floor.status !== 'established') {
        out.push(skip(base, 'no-noise-floor'));
        continue;
      }

      out.push(
        rule.kind === 'absolute'
          ? absolute(base, measured)
          : relative(
              base,
              scenario.baseline === undefined
                ? undefined
                : getAggregatedMetric(scenario.baseline, rule.metricId),
              measured,
            ),
      );
    }
  }

  return out;
}
