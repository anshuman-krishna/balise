import type { BudgetAssessment, BudgetStatus, DeltaClassification, Unit } from '@balise/schemas';
import { formatInt, formatNumber, formatSigned } from '@balise/ui';
import { fill, t } from '../i18n';
import { budgetCanon } from '../fixtures/budget-canon';

/**
 * what the budgets table and the check comment render. everything here reads
 * assessments the engine produced; no status, headroom or verdict is decided in
 * the frontend.
 */

const SEVERITY: Record<BudgetStatus, number> = { non_evalue: 0, conforme: 1, warn: 2, breach: 3 };

export function formatMeasured(value: number, unit: Unit): string {
  switch (unit) {
    case 'bytes':
      return Math.abs(value) < 1_000 ? `${formatInt(value)} B` : `${formatInt(value / 1_000)} KB`;
    case 'pct':
      return `${formatNumber(value, 1)} %`;
    default:
      return formatInt(value);
  }
}

/**
 * the distance to the threshold. shown as a share of the threshold when there is
 * room, and in the metric's own unit when there is not, because "0%" would hide
 * exactly the case worth seeing.
 */
export function formatHeadroom(headroom: number, threshold: number, unit: Unit): string {
  if (unit === 'pct') return `${formatSigned(headroom, 1)} pt`;
  const share = threshold === 0 ? 0 : headroom / threshold;
  if (Math.abs(share) >= 0.05) return `${formatSigned(share * 100)} %`;
  return unit === 'bytes'
    ? `${formatSigned(headroom / 1_000)} KB`
    : formatSigned(headroom);
}

export function metricLabel(assessment: BudgetAssessment): string {
  if (assessment.rule.kind === 'relative') return t.budgets.relativeMetric;
  return t.budgets.metrics[assessment.metricId];
}

export interface BudgetRow {
  key: string;
  scope: string;
  metric: string;
  /** which scenario the row is reporting, when the rule covers several. */
  scenario: string | null;
  current: string | null;
  /** the limit, in the same unit as the value beside it. */
  threshold: string | null;
  /** the limit exactly as the file writes it, for the title attribute. */
  thresholdSource: string | null;
  headroom: string | null;
  /** how full the budget is, for the bar. null when nothing was decided. */
  barPct: number | null;
  status: BudgetStatus;
  reasonNote: string | null;
  withinNoise: boolean;
  overridden: boolean;
  /** what happens on breach, which is what the file says, not what we assume. */
  action: 'fail' | 'warn';
}

function ruleKey(assessment: BudgetAssessment): string {
  const scope = assessment.rule.scope;
  const label =
    scope.kind === 'service' ? 'service' : scope.kind === 'journey' ? `journey:${scope.journey}` : scope.pattern;
  return `${label} · ${assessment.metricId} · ${assessment.rule.kind}`;
}

function scopeText(assessment: BudgetAssessment): string {
  const scope = assessment.rule.scope;
  if (scope.kind === 'service') return 'service';
  if (scope.kind === 'journey') return `journey: ${scope.journey}`;
  return scope.pattern;
}

/** the worst assessment decides the row, and the row says which one it was. */
function worst(group: readonly BudgetAssessment[]): BudgetAssessment {
  return group.reduce((left, right) => {
    if (SEVERITY[right.status] !== SEVERITY[left.status]) {
      return SEVERITY[right.status] > SEVERITY[left.status] ? right : left;
    }
    return (right.headroom ?? Infinity) < (left.headroom ?? Infinity) ? right : left;
  });
}

export function budgetRows(assessments: readonly BudgetAssessment[] = budgetCanon.main.assessments): BudgetRow[] {
  const groups = new Map<string, BudgetAssessment[]>();
  for (const assessment of assessments) {
    const key = ruleKey(assessment);
    const group = groups.get(key);
    if (group === undefined) groups.set(key, [assessment]);
    else group.push(assessment);
  }

  return [...groups.entries()].map(([key, group]) => {
    const decided = worst(group);
    const rule = decided.rule;
    const threshold = rule.fail ?? rule.warn;
    const blocks = budgetCanon.config.check.blockMergeOn !== 'never' && rule.fail !== null;

    return {
      key,
      scope: scopeText(decided),
      metric: metricLabel(decided),
      // naming a scenario is only useful when one of them is worse than the
      // others. on a rule where everything passed, or nothing was decided, it
      // would just be noise.
      scenario:
        group.length > 1 && (decided.status === 'breach' || decided.status === 'warn')
          ? decided.scenarioLabel
          : null,
      current: decided.observed === null ? null : formatMeasured(decided.observed, decided.unit),
      threshold: threshold === null ? null : formatMeasured(threshold.value, decided.unit),
      thresholdSource: threshold === null ? null : threshold.sourceText,
      headroom:
        decided.headroom === null || threshold === null
          ? null
          : formatHeadroom(decided.headroom, threshold.value, decided.unit),
      barPct:
        decided.observed === null || threshold === null || threshold.value === 0
          ? null
          : Math.min(100, Math.max(0, (decided.observed / threshold.value) * 100)),
      status: decided.status,
      reasonNote: decided.reason === undefined ? null : t.budgets.notEvaluated[decided.reason],
      withinNoise: decided.withinNoise,
      overridden: decided.override !== null,
      action: blocks ? 'fail' : 'warn',
    };
  });
}

// ---------------------------------------------------------------------------
// the check
// ---------------------------------------------------------------------------

export type CheckVerdict = 'fail' | 'warn' | 'noSig' | 'pass';

export interface CheckRow {
  scenarioId: string;
  label: string;
  baseKb: number;
  headKb: number;
  deltaKb: number;
  madKb: number;
  floorKb: number;
  classification: DeltaClassification;
  verdict: CheckVerdict;
}

function kb(bytes: number): number {
  return Math.round(bytes / 1_000);
}

export function checkRows(): CheckRow[] {
  return budgetCanon.measurements.map((measured) => {
    const forScenario = budgetCanon.pull.assessments.filter(
      (assessment) => assessment.scenarioId === measured.scenarioId,
    );
    const decided = forScenario.length === 0 ? null : worst(forScenario);
    const delta = forScenario.find((assessment) => assessment.delta !== null)?.delta ?? null;
    const classification: DeltaClassification = delta?.classification ?? 'indeterminate';

    const verdict: CheckVerdict =
      decided?.status === 'breach'
        ? 'fail'
        : decided?.status === 'warn'
          ? 'warn'
          : classification === 'no-significant-change'
            ? 'noSig'
            : 'pass';

    return {
      scenarioId: measured.scenarioId,
      label: measured.label,
      baseKb: kb(measured.baseBytes),
      headKb: kb(measured.headBytes),
      deltaKb: kb(measured.headBytes - measured.baseBytes),
      madKb: kb(measured.madBytes),
      floorKb: kb(measured.floorBytes),
      classification,
      verdict,
    };
  });
}

/** the one line the check reports next to its name, from the counts. */
export function checkStatusText(): string {
  const { counts } = budgetCanon.pull.summary;
  const regressions = new Set(
    budgetCanon.pull.assessments
      .filter((assessment) => assessment.delta?.classification === 'regression')
      .map((assessment) => assessment.scenarioId),
  ).size;

  const parts: string[] = [];
  if (counts.breach > 0) {
    parts.push(
      counts.breach === 1 ? t.prCheck.statusBreachOne : fill(t.prCheck.statusBreachMany, { count: counts.breach }),
    );
  }
  if (regressions > 0) {
    parts.push(
      regressions === 1
        ? t.prCheck.statusRegressionOne
        : fill(t.prCheck.statusRegressionMany, { count: regressions }),
    );
  }
  if (counts.nonEvalue > 0) {
    parts.push(fill(t.prCheck.statusUndecided, { count: counts.nonEvalue }));
  }
  return parts.length === 0 ? t.prCheck.statusClean : parts.join(', ');
}

export function checkFailed(): boolean {
  return budgetCanon.pull.summary.conclusion === 'failure';
}

/** the recorded override, with what it is letting through stated in figures. */
export function overrideCard() {
  const override = budgetCanon.override;
  const covered = budgetCanon.main.summary.overridden[0] ?? null;
  const past =
    covered?.headroom === null || covered === null
      ? null
      : formatMeasured(Math.abs(covered.headroom), covered.unit);

  return {
    requestedIn: override.requestedIn ?? null,
    scope: covered === null ? null : scopeText(covered),
    metric: covered === null ? null : metricLabel(covered),
    past,
    reason: override.reason,
    by: override.by,
    recordedAt: override.recordedAt,
    ledgerRef: override.ledgerRef ?? null,
  };
}
