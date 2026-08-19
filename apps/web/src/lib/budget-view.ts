import type { BudgetAssessment, BudgetStatus, CheckRunOutput, DeltaClassification, Unit } from '@balise/schemas';
import { buildCheckRun, checkTitle, measurementRows, outcomesByRule } from '@balise/budgets';
import { formatMeasured, formatSigned } from '@balise/ui';
import { t } from '../i18n';
import { budgetCanon } from '../fixtures/budget-canon';
import { attributionCoverage, attributionLead } from './attribution-view';

/**
 * what the budgets table and the check comment render. everything here reads
 * assessments the engine produced; no status, headroom or verdict is decided in
 * the frontend.
 */

// the measured value is formatted once, in @balise/schemas, so the table, the
// check comment and the documents cannot render the same figure differently.
export { formatMeasured };

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
  return t.metrics[assessment.metricId];
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

function scopeText(assessment: BudgetAssessment): string {
  const scope = assessment.rule.scope;
  if (scope.kind === 'service') return 'service';
  if (scope.kind === 'journey') return `journey: ${scope.journey}`;
  return scope.pattern;
}

export function budgetRows(assessments: readonly BudgetAssessment[] = budgetCanon.main.assessments): BudgetRow[] {
  // one row per rule, decided by its worst scenario, grouped in @balise/budgets
  // so the table and the check comment cannot group the same rules differently.
  return outcomesByRule(assessments).map(({ rule, decided, scenarioCount }) => {
    const threshold = rule.fail ?? rule.warn;
    const blocks = budgetCanon.config.check.blockMergeOn !== 'never' && rule.fail !== null;

    return {
      key: `${scopeText(decided)} · ${decided.metricId} · ${rule.kind}`,
      scope: scopeText(decided),
      metric: metricLabel(decided),
      // naming a scenario is only useful when one of them is worse than the
      // others. on a rule where everything passed, or nothing was decided, it
      // would just be noise.
      scenario:
        scenarioCount > 1 && (decided.status === 'breach' || decided.status === 'warn')
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

/**
 * the check's measurement rows. the figures and the classification come from
 * @balise/budgets, which takes the classification from the kernel; the verdict
 * word is the only thing decided here, and only from a status the engine set.
 */
export function checkRows(): CheckRow[] {
  const rows = measurementRows(budgetCanon.pullScenarios, budgetCanon.pull.assessments);

  return rows.map((row) => {
    const verdict: CheckVerdict =
      row.status === 'breach'
        ? 'fail'
        : row.status === 'warn'
          ? 'warn'
          : row.classification === 'no-significant-change'
            ? 'noSig'
            : 'pass';

    return {
      scenarioId: row.scenarioId,
      label: row.label,
      baseKb: kb(row.baseline ?? row.candidate),
      headKb: kb(row.candidate),
      deltaKb: kb(row.delta?.value ?? 0),
      madKb: kb(row.mad),
      floorKb: kb(row.floor.status === 'established' ? row.floor.value : 0),
      classification: row.classification,
      verdict,
    };
  });
}

/** the one line the check reports next to its name, from the counts. */
export function checkStatusText(): string {
  return checkTitle(budgetCanon.pull.summary, budgetCanon.pull.assessments, t.checkRun);
}

export function checkFailed(): boolean {
  return budgetCanon.pull.summary.conclusion === 'failure';
}

/**
 * the artifact itself: what the check would post, built from the same
 * assessments the screen renders and in the interface locale. the screen shows
 * it verbatim, so the mock of the comment cannot drift from the comment.
 */
export function checkRunOutput(): CheckRunOutput {
  const lead = attributionLead()
    .map((part) => part.text)
    .join('');

  return buildCheckRun({
    config: budgetCanon.config,
    scenarios: budgetCanon.pullScenarios,
    assessments: budgetCanon.pull.assessments,
    summary: budgetCanon.pull.summary,
    strings: t.checkRun,
    metricLabels: t.metrics,
    provenance: budgetCanon.provenance,
    configPath: budgetCanon.file,
    attribution: `${lead} ${attributionCoverage()}`,
  });
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
