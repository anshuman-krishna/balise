import type {
  BudgetAssessment,
  BudgetConfig,
  BudgetRule,
  CheckAnnotation,
  CheckRunOutput,
  CheckSummary,
  Delta,
  DeltaClassification,
  MetricId,
  NoiseFloor,
  Unit,
} from '@balise/schemas';
import { formatMeasured, formatMeasuredSigned } from '@balise/schemas';
import { classifyDelta, getAggregatedMetric } from '@balise/measure-core';
import type { Catalog } from '@balise/i18n';
import { fill } from '@balise/i18n';
import { decidingThreshold } from './evaluate.js';
import { scopeLabel, type ScenarioMeasurement } from './scope.js';

/**
 * what the check posts: one line beside its name, a markdown body, and
 * annotations on the lines of the budget file that decided.
 *
 * nothing here re-decides anything. every status comes from the assessments,
 * every per-scenario verdict comes from classifyDelta, and the strings come
 * from the catalog the screen renders, so the mock of the comment and the
 * comment cannot say different things.
 */

/** github accepts fifty annotations per request. the rest are reported, not dropped silently. */
export const ANNOTATION_LIMIT = 50;

export type CheckStrings = Catalog['checkRun'];

const SEVERITY: Record<BudgetAssessment['status'], number> = {
  non_evalue: 0,
  conforme: 1,
  warn: 2,
  breach: 3,
};

// ---------------------------------------------------------------------------
// grouping
// ---------------------------------------------------------------------------

export interface BudgetRuleOutcome {
  rule: BudgetRule;
  /** the assessment that decided the rule: worst status, then tightest headroom. */
  decided: BudgetAssessment;
  /** how many scenarios the rule was evaluated against. */
  scenarioCount: number;
}

function ruleKey(assessment: BudgetAssessment): string {
  return `${scopeLabel(assessment.rule.scope)} ${assessment.metricId} ${assessment.rule.kind}`;
}

/** one assessment: the rule's own line in the file, on one scenario. */
function assessmentKey(assessment: BudgetAssessment): string {
  return `${assessment.scenarioId} ${assessment.rule.line} ${assessment.metricId} ${assessment.rule.kind}`;
}

function worse(left: BudgetAssessment, right: BudgetAssessment): BudgetAssessment {
  if (SEVERITY[right.status] !== SEVERITY[left.status]) {
    return SEVERITY[right.status] > SEVERITY[left.status] ? right : left;
  }
  return (right.headroom ?? Infinity) < (left.headroom ?? Infinity) ? right : left;
}

/**
 * one outcome per rule, in the order the file wrote them. a rule that covers
 * several scenarios is reported by its worst one: a service-wide limit that
 * held on three routes and broke on the fourth is broken.
 */
export function outcomesByRule(assessments: readonly BudgetAssessment[]): BudgetRuleOutcome[] {
  const order: string[] = [];
  const groups = new Map<string, BudgetAssessment[]>();

  for (const assessment of assessments) {
    const key = ruleKey(assessment);
    const group = groups.get(key);
    if (group === undefined) {
      order.push(key);
      groups.set(key, [assessment]);
    } else {
      group.push(assessment);
    }
  }

  return order.map((key) => {
    const group = groups.get(key)!;
    const decided = group.reduce(worse);
    return { rule: decided.rule, decided, scenarioCount: group.length };
  });
}

// ---------------------------------------------------------------------------
// the measurement table
// ---------------------------------------------------------------------------

export interface CheckMeasurementRow {
  scenarioId: string;
  label: string;
  metricId: MetricId;
  unit: Unit;
  /** null when the scenario has no baseline: nothing is compared to nothing. */
  baseline: number | null;
  candidate: number;
  /** dispersion of the candidate, always shown beside it. */
  mad: number;
  delta: Delta | null;
  floor: NoiseFloor;
  classification: DeltaClassification;
  /** the worst budget verdict on this scenario, or null when no rule covers it. */
  status: BudgetAssessment['status'] | null;
}

/**
 * one row per scenario, on the metric the check reports. the verdict is the
 * kernel's, not the check's: a delta under the floor is no change here for the
 * same reason it is no change everywhere else.
 */
export function measurementRows(
  scenarios: readonly ScenarioMeasurement[],
  assessments: readonly BudgetAssessment[],
  metricId: MetricId = 'transferred_bytes',
): CheckMeasurementRow[] {
  const rows: CheckMeasurementRow[] = [];

  for (const scenario of scenarios) {
    const candidate = getAggregatedMetric(scenario.candidate, metricId);
    if (candidate === undefined) continue;

    const floor = scenario.floors.find((entry) => entry.metricId === metricId) ?? {
      status: 'insufficient-history' as const,
      metricId,
      sampleCount: 0,
      requiredCount: 0,
    };
    const baseline =
      scenario.baseline === undefined ? undefined : getAggregatedMetric(scenario.baseline, metricId);
    const delta = baseline === undefined ? null : classifyDelta(baseline, candidate, floor);

    const covering = assessments.filter((assessment) => assessment.scenarioId === scenario.id);
    const decided = covering.length === 0 ? null : covering.reduce(worse);

    rows.push({
      scenarioId: scenario.id,
      label: scenario.label,
      metricId,
      unit: candidate.unit,
      baseline: baseline?.median ?? null,
      candidate: candidate.median,
      mad: candidate.mad,
      delta,
      floor,
      classification: delta?.classification ?? 'indeterminate',
      status: decided?.status ?? null,
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// the one line beside the check name
// ---------------------------------------------------------------------------

/**
 * counts what the engine found. a scenario that regressed on two metrics is
 * one regression, because a developer reads this as "how many places did this
 * change something", not as a count of rows.
 */
export function checkTitle(
  summary: CheckSummary,
  assessments: readonly BudgetAssessment[],
  strings: CheckStrings,
): string {
  const regressions = new Set(
    assessments
      .filter((assessment) => assessment.delta?.classification === 'regression')
      .map((assessment) => assessment.scenarioId),
  ).size;

  const parts: string[] = [];
  if (summary.counts.breach > 0) {
    parts.push(
      summary.counts.breach === 1
        ? strings.statusBreachOne
        : fill(strings.statusBreachMany, { count: summary.counts.breach }),
    );
  }
  if (regressions > 0) {
    parts.push(
      regressions === 1
        ? strings.statusRegressionOne
        : fill(strings.statusRegressionMany, { count: regressions }),
    );
  }
  if (summary.counts.nonEvalue > 0) {
    parts.push(fill(strings.statusUndecided, { count: summary.counts.nonEvalue }));
  }
  return parts.length === 0 ? strings.statusClean : parts.join(', ');
}

// ---------------------------------------------------------------------------
// markdown
// ---------------------------------------------------------------------------

/** a table cell. a pipe in a route would otherwise end the column early. */
function cell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

function code(text: string): string {
  return `\`${text.replace(/`/g, '')}\``;
}

type Align = 'left' | 'right';

function table(headers: readonly string[], align: readonly Align[], rows: readonly string[][]): string {
  const rule = align.map((side) => (side === 'right' ? '--:' : '---'));
  return [headers, rule, ...rows].map((row) => `| ${row.join(' | ')} |`).join('\n');
}

function verdictText(classification: DeltaClassification, strings: CheckStrings): string {
  switch (classification) {
    case 'regression':
      return strings.verdictRegression;
    case 'improvement':
      return strings.verdictImprovement;
    case 'no-significant-change':
      return strings.verdictNoSig;
    case 'indeterminate':
      return strings.verdictIndeterminate;
  }
}

function floorText(floor: NoiseFloor, unit: Unit, strings: CheckStrings): string {
  return floor.status === 'established'
    ? `± ${formatMeasured(floor.value, unit)}`
    : strings.notEvaluated['no-noise-floor'];
}

function metricText(
  assessment: BudgetAssessment,
  strings: CheckStrings,
  labels: Record<MetricId, string>,
): string {
  return assessment.rule.kind === 'relative' ? strings.relativeMetric : labels[assessment.metricId];
}

// ---------------------------------------------------------------------------
// the check run
// ---------------------------------------------------------------------------

export interface CheckProvenance {
  methodologyVersion: string;
  /** every model that ran, as `id@version`. */
  models: readonly string[];
  runId: string;
  ledgerRef: string;
  verificationUrl: string;
  /**
   * invariant 3: two runs with different fingerprints are not comparable
   * without a flag. the comment carries the flag; it never omits it.
   */
  fingerprintMatched: boolean;
}

export interface CheckReportInput {
  config: BudgetConfig;
  /** the scenarios the evaluation ran on. */
  scenarios: readonly ScenarioMeasurement[];
  assessments: readonly BudgetAssessment[];
  summary: CheckSummary;
  strings: CheckStrings;
  /** what a metric is called in the interface. the same labels the screens use. */
  metricLabels: Record<MetricId, string>;
  provenance: CheckProvenance;
  /** where the budgets were read from, relative to the repository root. */
  configPath?: string;
  /** the metric the measurement table reports. */
  headlineMetric?: MetricId;
  /**
   * the attribution sentence, already composed by the caller. advisory: it
   * explains a breach and never decides one, and it is absent rather than
   * guessed when attribution could not resolve.
   */
  attribution?: string | null;
  /** a served rendering of the delta bands, when the api is serving one. */
  bandImageUrl?: string;
}

function summaryMarkdown(input: CheckReportInput): string {
  const { summary, strings } = input;
  const lines: string[] = [];

  if (summary.blocking.length > 0) {
    lines.push(
      summary.blocking.length === 1
        ? `**${strings.summaryBlockedOne}**`
        : `**${fill(strings.summaryBlockedMany, { count: summary.blocking.length })}**`,
    );
  } else if (summary.conclusion === 'success') {
    lines.push(`**${strings.summaryClean}**`);
  } else {
    lines.push(`**${strings.summaryNeutral}**`);
  }

  const items: string[] = [];
  for (const assessment of summary.blocking) {
    const limit = decidingThreshold(assessment.rule);
    items.push(
      `- ${fill(strings.summaryBlockingItem, {
        scope: scopeLabel(assessment.rule.scope),
        metric: metricText(assessment, strings, input.metricLabels),
        observed: assessment.observed === null ? '' : formatMeasured(assessment.observed, assessment.unit),
        threshold: limit === null ? '' : formatMeasured(limit.value, assessment.unit),
        headroom:
          assessment.headroom === null ? '' : formatMeasuredSigned(assessment.headroom, assessment.unit),
      })}`,
    );
  }
  for (const assessment of summary.overridden) {
    if (assessment.override === null) continue;
    items.push(
      `- ${fill(strings.summaryOverriddenItem, {
        scope: scopeLabel(assessment.rule.scope),
        metric: metricText(assessment, strings, input.metricLabels),
        by: assessment.override.by,
        date: assessment.override.recordedAt.slice(0, 10),
      })}`,
    );
  }
  if (summary.counts.nonEvalue > 0) {
    items.push(
      `- ${
        summary.counts.nonEvalue === 1
          ? strings.summaryUndecidedOne
          : fill(strings.summaryUndecidedMany, { count: summary.counts.nonEvalue })
      }`,
    );
  }
  if (items.length > 0) lines.push('', ...items);

  lines.push('', strings.noiseRule);
  return lines.join('\n');
}

function measurementSection(input: CheckReportInput): string[] {
  const { strings } = input;
  const rows = measurementRows(input.scenarios, input.assessments, input.headlineMetric);
  if (rows.length === 0) return [];

  const body = rows.map((row) => [
    cell(code(row.label)),
    row.baseline === null ? strings.noBaseline : cell(formatMeasured(row.baseline, row.unit)),
    cell(`${formatMeasured(row.candidate, row.unit)} ± ${formatMeasured(row.mad, row.unit)}`),
    row.delta === null ? '' : cell(formatMeasuredSigned(row.delta.value, row.unit)),
    cell(floorText(row.floor, row.unit, strings)),
    cell(verdictText(row.classification, strings)),
  ]);

  const measurementLine = fill(strings.measurementLine, {
    runs: input.config.runs,
    profiles: input.config.profiles.join(', '),
  });

  const out = [
    `### ${strings.measurementHeading}`,
    '',
    input.provenance.fingerprintMatched
      ? `${measurementLine} · ${strings.fingerprintMatched}`
      : `${measurementLine}\n\n**${strings.fingerprintDiffers}**`,
    '',
    table(
      [
        strings.tableScenario,
        strings.tableBase,
        strings.tableHead,
        strings.tableDelta,
        strings.tableFloor,
        strings.tableVerdict,
      ],
      ['left', 'right', 'right', 'right', 'right', 'left'],
      body,
    ),
  ];

  if (input.bandImageUrl !== undefined) {
    out.push('', `![${strings.measurementHeading}](${input.bandImageUrl})`);
  }
  return out;
}

function budgetsSection(input: CheckReportInput): string[] {
  const { strings } = input;
  const outcomes = outcomesByRule(input.assessments);
  if (outcomes.length === 0) return [];

  const body = outcomes.map(({ decided }) => {
    const limit = decidingThreshold(decided.rule);
    const tags = [
      decided.withinNoise ? strings.withinNoiseTag : null,
      decided.override !== null ? strings.overriddenTag : null,
      decided.reason === undefined ? null : strings.notEvaluated[decided.reason],
    ].filter((tag): tag is string => tag !== null);

    return [
      cell(`${code(scopeLabel(decided.rule.scope))} · ${metricText(decided, strings, input.metricLabels)}`),
      decided.observed === null ? '' : cell(formatMeasured(decided.observed, decided.unit)),
      limit === null ? '' : cell(formatMeasured(limit.value, decided.unit)),
      // the absolute distance to the limit, in the metric's own unit. the
      // screen shows a share of the limit beside a bar; a text artifact has no
      // bar, and a share with nothing to read it against is worse than a figure.
      decided.headroom === null ? '' : cell(formatMeasuredSigned(decided.headroom, decided.unit)),
      cell(
        [strings.statusLabels[decided.status], ...tags].join(' · '),
      ),
    ];
  });

  return [
    `### ${strings.budgetsHeading}`,
    '',
    table(
      [
        strings.tableScopeMetric,
        strings.tableMeasured,
        strings.tableThreshold,
        strings.tableHeadroom,
        strings.tableStatus,
      ],
      ['left', 'right', 'right', 'right', 'left'],
      body,
    ),
  ];
}

function attributionSection(input: CheckReportInput): string[] {
  const sentence = input.attribution;
  if (sentence === undefined || sentence === null || sentence.length === 0) return [];
  return [`### ${input.strings.attributionHeading}`, '', sentence, '', input.strings.attributionAdvisory];
}

function provenanceSection(input: CheckReportInput): string[] {
  const { strings, provenance } = input;
  const line = [
    fill(strings.provenanceMethodology, { version: provenance.methodologyVersion }),
    fill(strings.provenanceModels, { models: provenance.models.join(', ') }),
    fill(strings.provenanceRun, { run: provenance.runId }),
    fill(strings.provenanceLedger, { hash: provenance.ledgerRef, url: provenance.verificationUrl }),
    fill(strings.provenanceConfig, { file: input.configPath ?? 'balise.yml' }),
  ].join(' · ');

  return ['---', '', line, '', strings.overrideHowTo];
}

// ---------------------------------------------------------------------------
// annotations
// ---------------------------------------------------------------------------

function annotationFor(
  outcome: BudgetRuleOutcome,
  level: CheckAnnotation['level'],
  path: string,
  input: CheckReportInput,
): CheckAnnotation | null {
  const assessment = outcome.decided;
  const strings = input.strings;
  const limit = decidingThreshold(assessment.rule);
  const line = limit?.line ?? assessment.rule.line;
  // a rule that covered several scenarios names the one it was decided by:
  // the annotation sits on one line of the file and must not report a figure
  // without saying where it was measured.
  const scope =
    outcome.scenarioCount > 1
      ? `${scopeLabel(assessment.rule.scope)} ${fill(strings.annotationWorstOn, { scenario: assessment.scenarioLabel })}`
      : scopeLabel(assessment.rule.scope);
  const metric = metricText(assessment, strings, input.metricLabels);
  const observed = assessment.observed === null ? '' : formatMeasured(assessment.observed, assessment.unit);
  const threshold = limit === null ? '' : formatMeasured(limit.value, assessment.unit);

  if (assessment.status === 'non_evalue') {
    if (assessment.reason === undefined) return null;
    return {
      path,
      startLine: line,
      endLine: line,
      level,
      title: strings.annotationUndecidedTitle,
      message: fill(strings.annotationUndecidedBody, {
        scope,
        metric,
        reason: strings.notEvaluated[assessment.reason],
      }),
    };
  }

  if (assessment.override !== null) {
    return {
      path,
      startLine: line,
      endLine: line,
      level,
      title: strings.annotationOverriddenTitle,
      message: fill(strings.annotationOverriddenBody, {
        scope,
        metric,
        observed,
        threshold,
        by: assessment.override.by,
        reason: assessment.override.reason,
      }),
    };
  }

  return {
    path,
    startLine: line,
    endLine: line,
    level,
    title: assessment.status === 'breach' ? strings.annotationBreachTitle : strings.annotationWarnTitle,
    message: fill(strings.annotationBody, {
      scope,
      metric,
      observed,
      threshold,
      headroom:
        assessment.headroom === null ? '' : formatMeasuredSigned(assessment.headroom, assessment.unit),
    }),
  };
}

/**
 * annotations on the budget file, at the line of the limit that decided. the
 * yaml reader records a line per threshold for exactly this: an annotation
 * points at the rule, never at a guessed position. a source file is not
 * annotated at all, because attribution resolves bytes to a file and not yet
 * to a line, and pointing at line 1 would be an invention.
 */
export function checkAnnotations(input: CheckReportInput): {
  annotations: CheckAnnotation[];
  omitted: number;
} {
  if (!input.config.check.annotateFiles) return { annotations: [], omitted: 0 };

  const path = input.configPath ?? 'balise.yml';
  // matched by value, never by object identity: the summary and the
  // assessments reach a renderer through json as often as through memory, and
  // an identity check would quietly stop recognising what is blocking.
  const blocking = new Set(input.summary.blocking.map(assessmentKey));
  const overridden = new Set(input.summary.overridden.map(assessmentKey));
  const failures: CheckAnnotation[] = [];
  const warnings: CheckAnnotation[] = [];
  const notices: CheckAnnotation[] = [];

  // one annotation per rule, not per rule and scenario: an annotation marks a
  // line of the file, and the same line noted four times is noise.
  for (const outcome of outcomesByRule(input.assessments)) {
    const assessment = outcome.decided;
    const key = assessmentKey(assessment);
    if (blocking.has(key)) {
      const annotation = annotationFor(outcome, 'failure', path, input);
      if (annotation !== null) failures.push(annotation);
      continue;
    }
    if (overridden.has(key) || assessment.status === 'breach' || assessment.status === 'warn') {
      const annotation = annotationFor(outcome, 'warning', path, input);
      if (annotation !== null) warnings.push(annotation);
      continue;
    }
    // the developer has to know a budget is not protecting them yet. the other
    // refusals to decide are stated in the body and would only be noise here.
    if (assessment.status === 'non_evalue' && assessment.reason === 'no-noise-floor') {
      const annotation = annotationFor(outcome, 'notice', path, input);
      if (annotation !== null) notices.push(annotation);
    }
  }

  const ordered = [...failures, ...warnings, ...notices];
  return {
    annotations: ordered.slice(0, ANNOTATION_LIMIT),
    omitted: Math.max(0, ordered.length - ANNOTATION_LIMIT),
  };
}

export function buildCheckRun(input: CheckReportInput): CheckRunOutput {
  const { annotations, omitted } = checkAnnotations(input);
  const attribution = attributionSection(input);
  const sections = [
    ...measurementSection(input),
    '',
    ...budgetsSection(input),
    '',
    ...attribution,
    ...(attribution.length > 0 ? [''] : []),
    ...provenanceSection(input),
  ];
  if (omitted > 0) {
    sections.push('', fill(input.strings.annotationsOmitted, { count: omitted, limit: ANNOTATION_LIMIT }));
  }

  return {
    conclusion: input.summary.conclusion,
    title: checkTitle(input.summary, input.assessments, input.strings),
    summary: summaryMarkdown(input),
    text: sections.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    annotations,
    annotationsOmitted: omitted,
  };
}
