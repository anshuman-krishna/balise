import type { AssessmentStatus, CriterionTier } from '@balise/schemas';
import { fill, t } from '../i18n';
import { criteriaCanon, type CriteriaRow } from '../fixtures/criteria-canon';
import { shortDate } from './attribution-view';

/**
 * what the criteria workspace and the declaration editor render. every figure
 * here is read off assessments @balise/criteria-engine answered from the
 * rgesn-2024-v2 pack; nothing is a status decided in the frontend.
 */

export const STATUS_COLOR: Record<AssessmentStatus, string> = {
  conforme: 'var(--conforme)',
  partiellement_conforme: 'var(--caution)',
  non_conforme: 'var(--breach)',
  non_evalue: 'var(--text-secondary)',
  non_applicable: 'var(--text-tertiary)',
};

export const TIER_COLOR: Record<CriterionTier, string> = {
  automated: 'var(--measured)',
  assisted: 'var(--text-secondary)',
  declarative: 'var(--caution)',
};

/** the official grid's own words, which stay french in every locale. */
export function statusLabel(status: AssessmentStatus): string {
  switch (status) {
    case 'conforme':
      return t.criteria.statuses.conforme;
    case 'partiellement_conforme':
      return t.criteria.statuses.partiellement;
    case 'non_conforme':
      return t.criteria.statuses.nonConforme;
    case 'non_applicable':
      return t.criteria.statuses.nonApplicable;
    case 'non_evalue':
      return t.criteria.statuses.nonEvalue;
  }
}

export function tierShort(tier: CriterionTier): string {
  return tier === 'automated' ? 'AUTO' : tier === 'assisted' ? 'ASSIST' : 'DECL';
}

/** the conformity rate, over applicable criteria. rounded for display only. */
export function conformityPct(): number {
  const conforme: number = criteriaCanon.completion.conforme;
  const applicable: number = criteriaCanon.completion.applicable;
  return applicable === 0 ? 0 : Math.round((conforme / applicable) * 100);
}

export interface TierCard {
  tier: CriterionTier;
  label: string;
  desc: string;
  /** how many criteria the pack proposes at this tier. */
  total: number;
  /** how many of them carry an answer that counts. */
  answered: number;
  color: string;
}

export function tierCards(): TierCard[] {
  const labels: Record<CriterionTier, { label: string; desc: string }> = {
    automated: { label: t.dashboard.completeness.automated, desc: t.criteria.tiers.automatedDesc },
    assisted: { label: t.dashboard.completeness.assisted, desc: t.criteria.tiers.assistedDesc },
    declarative: { label: t.dashboard.completeness.declarative, desc: t.criteria.tiers.declarativeDesc },
  };

  return criteriaCanon.completion.byTier.map((entry) => ({
    tier: entry.tier,
    label: labels[entry.tier].label,
    desc: labels[entry.tier].desc,
    total: entry.total,
    answered: entry.answered,
    color: TIER_COLOR[entry.tier],
  }));
}

/** declarative criteria still without an answer, which is where the gap is. */
export function pendingDeclarative(): number {
  const row = criteriaCanon.completion.byTier.find((entry) => entry.tier === 'declarative');
  return row === undefined ? 0 : row.total - row.answered;
}

/**
 * where the answers came from. the reason this is on the screen at all: a
 * criterion the pack proposes as automated, answered by a person, is not an
 * automated answer, and the tier card alone cannot say which it was.
 */
export function sourceLine(): string {
  const { measured, attested, unevaluated } = criteriaCanon.bySource;
  return [
    fill(t.criteria.signOff.sourceMeasured, { count: measured }),
    fill(t.criteria.signOff.sourceAttested, { count: attested }),
    fill(t.criteria.signOff.sourceUnevaluated, { count: unevaluated }),
  ].join(' · ');
}

/** the sign-off the pack is waiting for, or null once it has one. */
export function signOffNotice(): { title: string; body: string } | null {
  if (criteriaCanon.pack.tiersSignedOff) return null;
  return {
    title: t.criteria.signOff.title,
    body: fill(t.criteria.signOff.body, {
      pack: criteriaCanon.pack.label,
      automated: criteriaCanon.byTier.automated,
      assisted: criteriaCanon.byTier.assisted,
      declarative: criteriaCanon.byTier.declarative,
      withEvaluation: criteriaCanon.pack.withEvaluation,
      criteria: criteriaCanon.pack.criteriaCount,
    }),
  };
}

/** who answered a criterion, and when. never a system name. */
export function attestedText(row: CriteriaRow): string {
  if (row.attestedBy === null || row.attestedAt === null) return t.criteria.notLookedAt;
  return fill(t.criteria.attestedOn, { who: row.attestedBy, date: shortDate(row.attestedAt) });
}

/**
 * what the row shows as its evidence. a justification the reviewer wrote is
 * the better answer to "why"; the engine's own sentence is the fallback, and
 * is what an unanswered criterion has.
 */
export function evidenceText(row: CriteriaRow): string {
  return row.justification ?? row.evidenceFr;
}

export function rowsForTier(tier: CriterionTier | 'all'): readonly CriteriaRow[] {
  return tier === 'all' ? criteriaCanon.rows : criteriaCanon.rows.filter((row) => row.tier === tier);
}

export interface FamilyBar {
  /** the family's official number and its label, as the declaration prints it. */
  name: string;
  /** widths in percent of the family's criteria, conforme first. */
  ok: number;
  warn: number;
  bad: number;
  /** conforme over applicable, which is the rate everywhere else too. */
  label: string;
}

/** per-family conformity, for the bars on the published declaration. */
export function familyBars(): FamilyBar[] {
  return criteriaCanon.families.map((family, index) => {
    const total: number = family.total;
    const share = (count: number) => (total === 0 ? 0 : (count / total) * 100);
    return {
      name: `${index + 1} ${family.labelFr}`,
      ok: share(family.conforme),
      warn: share(family.partiel),
      bad: share(family.nonConforme),
      // a family every criterion of which is out of scope has no rate to
      // report, and printing 0/0 beside an empty bar would read as a failure.
      label: family.applicable === 0 ? t.criteria.summary.na : `${family.conforme}/${family.applicable}`,
    };
  });
}

export interface BlockingRow {
  key: string;
  criterionId: string;
  reason: string;
  detailFr: string;
}

/**
 * what stands between the draft and a publishable declaration, as
 * `blockingFindings` reported it. the list is the engine's, not a summary of
 * it: a finding that is not here is not blocking.
 */
export function blockingRows(): BlockingRow[] {
  return criteriaCanon.blocking.map((finding) => ({
    key: `${finding.criterionId}-${finding.reason}`,
    criterionId: finding.criterionId,
    reason: t.declaration.blockingReasons[finding.reason],
    detailFr: finding.detailFr,
  }));
}

export interface NonConformeRow {
  id: string;
  /** the referential's own wording, verbatim. never a short label we wrote. */
  statementFr: string;
  /** the reviewer's text. the official grid requires one, and empty says so. */
  justification: string | null;
}

/**
 * the non conformities a published declaration has to list. taken from the
 * assessments, so the declaration cannot name a criterion the referential
 * does not have, or omit one the workspace shows.
 */
export function nonConformeRows(): NonConformeRow[] {
  return criteriaCanon.rows
    .filter((row) => row.status === 'non_conforme')
    .map((row) => ({ id: row.id, statementFr: row.statementFr, justification: row.justification }));
}
