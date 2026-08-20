import type { Confidence, MetricId, Unit } from '@balise/schemas';
import { classifyDelta } from '@balise/measure-core';
import { estimateMeasured, REFERENCE_MODEL_ID } from './carbon-canon-source';
import { canonFloor, canonMetric } from './measurement-canon-source';
import { buildCriteriaCanon } from './criteria-canon-source';

/**
 * the contractual engagements: proposed in the tender, carried by the contract,
 * reported on in the execution report.
 *
 * one object, three surfaces. the version this replaces authored the same four
 * engagements three times over and the copies disagreed:
 *
 * - the tender put 11 % of headroom on 1 258 KB against a 1 400 KB ceiling and
 *   the contract put 10 % on the same pair, because each screen carried a
 *   number rather than a definition.
 * - the tracker filled the conformity gauge to 0 % and the execution report
 *   filled the same gauge to 78 %, both claiming to read the assessments.
 * - and the execution report's table reported the supplier `nonTenu` on the
 *   third-party share, which is a breach of a contractual obligation, for an
 *   engagement the tender left unchecked and the contract does not carry. the
 *   narrative two paragraphs below it on the same page calls that figure a
 *   target "que nous nous fixons". a document that contradicts itself about
 *   whether a supplier is in breach is worse than no document.
 *
 * so an engagement is authored once, with the only two things that are
 * genuinely authored: the wording it carries into the annexe, and the
 * threshold the supplier signs. everything else is derived from what was
 * measured.
 */

/** what an engagement binds. the derivation reads the canons through this. */
export type EngagementBasis =
  | { kind: 'metric'; aggregationId: string; metricId: MetricId }
  | { kind: 'carbon'; pageId: string; aggregationId: string }
  | { kind: 'conformity' }
  | { kind: 'process'; delivered: number; periodsPerYear: number };

export interface AuthoredEngagement {
  id: string;
  /**
   * the wording that appears verbatim in the annexe and in the contract. a
   * claim a buyer reads, so it is authored and never generated.
   */
  labelFr: string;
  basis: EngagementBasis;
  /**
   * the value the supplier signs. authored, because a threshold is signed and
   * not computed: the product's job is to say whether it is met, not to choose
   * it.
   */
  threshold: number;
  /** `lte` is a ceiling, `gte` is a target. */
  direction: 'lte' | 'gte';
  unit: Unit;
  /**
   * whether the bid director put it in the offer. an engagement left out is a
   * proposal and nothing more: it appears in the tender workspace, and no
   * contract surface holds it, because there is nothing to hold.
   */
  inOffer: boolean;
}

/**
 * headroom is the share of the allowance not used, once, here.
 *
 * (threshold - measured) / threshold. the alternative, over the measured value,
 * gives 11.3 % where this gives 10.1 % on the same pair, which is exactly the
 * disagreement between the two screens this replaces. a supplier signs a
 * ceiling, so the ceiling is the denominator.
 */
function headroomPct(measured: number, threshold: number): number {
  return threshold === 0 ? 0 : ((threshold - measured) / threshold) * 100;
}

const ENGAGEMENTS: readonly AuthoredEngagement[] = [
  {
    id: 'page-weight',
    // NOTE: the wording says ten pages and the basis is the service median over
    // fourteen scenarios. changing the wording of a commitment a buyer reads is
    // a decision for the maintainer (operating manual section 29), so the
    // mismatch is carried here and flagged in PLAN.md rather than quietly
    // corrected.
    labelFr: 'Poids médian des 10 pages principales',
    basis: { kind: 'metric', aggregationId: 'service', metricId: 'transferred_bytes' },
    threshold: 1_400_000,
    direction: 'lte',
    unit: 'bytes',
    inOffer: true,
  },
  {
    id: 'carbon-per-visit',
    labelFr: 'Empreinte estimée par visite (SWD v4)',
    basis: { kind: 'carbon', pageId: 'dashboard', aggregationId: 'service' },
    // a placeholder proportionate to the measured figure, flagged in PLAN.md.
    threshold: 0.1,
    direction: 'lte',
    unit: 'gCO2e',
    inOffer: true,
  },
  {
    id: 'rgesn-conformity',
    labelFr: 'Taux de conformité RGESN à 12 mois',
    basis: { kind: 'conformity' },
    threshold: 75,
    direction: 'gte',
    unit: 'pct',
    inOffer: true,
  },
  {
    id: 'quarterly-report',
    labelFr: "Rapport d'exécution trimestriel horodaté",
    basis: { kind: 'process', delivered: 2, periodsPerYear: 4 },
    threshold: 4,
    direction: 'gte',
    unit: 'count',
    inOffer: true,
  },
  {
    // proposed and not taken. the measured value already fails the threshold,
    // so signing it would put the contract in breach in its first month, and
    // the memo states a remediation plan with a dated milestone instead.
    id: 'third-party-share',
    labelFr: 'Part des tiers dans les octets transférés',
    basis: { kind: 'metric', aggregationId: 'service', metricId: 'third_party_share_pct' },
    threshold: 30,
    direction: 'lte',
    unit: 'pct',
    inOffer: false,
  },
];

export type EngagementStatus = 'tenu' | 'enCours' | 'nonTenu';

export type EngagementMargin =
  | { kind: 'headroom'; pct: number }
  | { kind: 'stretch'; points: number }
  | { kind: 'notMet'; points: number }
  | { kind: 'process' };

function conformityRate(): number {
  const canon = buildCriteriaCanon();
  const { conforme, applicable } = canon.completion;
  return applicable === 0 ? 0 : (conforme / applicable) * 100;
}

interface Measured {
  value: number;
  confidence: Confidence | null;
  /** the run-to-run dispersion, where the figure is a measured metric. */
  mad: number | null;
  /** the estimate's spread across the models that share an axis. */
  band: { low: number; high: number; modelCount: number } | null;
  /** the reference model, wherever the figure is an estimate (invariant 1). */
  model: { id: string; version: string } | null;
}

function measure(engagement: AuthoredEngagement): Measured {
  switch (engagement.basis.kind) {
    case 'metric': {
      const metric = canonMetric(engagement.basis.aggregationId, engagement.basis.metricId);
      return {
        value: metric.median,
        confidence: metric.confidence,
        mad: metric.mad,
        band: null,
        model: null,
      };
    }
    case 'carbon': {
      const { aggregationId } = engagement.basis;
      const floor = canonFloor(aggregationId, 'transferred_bytes');
      const estimate = estimateMeasured(
        {
          transferredBytes: canonMetric(aggregationId, 'transferred_bytes').median,
          requestCount: canonMetric(aggregationId, 'request_count').median,
          domNodeCount: canonMetric(aggregationId, 'dom_node_count').median,
        },
        { greenHostingFactor: 1, ...(floor === undefined ? {} : { floorBytes: floor }) },
      );
      const reference = estimate.inBand.find((output) => output.isReference)!;
      return {
        value: estimate.band.reference,
        confidence: canonMetric(aggregationId, 'transferred_bytes').confidence,
        mad: null,
        band: {
          low: estimate.band.low,
          high: estimate.band.high,
          modelCount: estimate.band.modelCount,
        },
        model: { id: reference.id, version: reference.version },
      };
    }
    case 'conformity':
      // no dispersion and no band: a conformity rate is a count over a count,
      // and the assessments behind it are attestations rather than runs.
      return { value: conformityRate(), confidence: null, mad: null, band: null, model: null };
    case 'process':
      return {
        value: engagement.basis.delivered,
        confidence: null,
        mad: null,
        band: null,
        model: null,
      };
  }
}

function marginOf(engagement: AuthoredEngagement, measured: number): EngagementMargin {
  if (engagement.basis.kind === 'process') return { kind: 'process' };
  const met =
    engagement.direction === 'lte' ? measured <= engagement.threshold : measured >= engagement.threshold;
  if (engagement.direction === 'lte') {
    return met
      ? { kind: 'headroom', pct: headroomPct(measured, engagement.threshold) }
      : { kind: 'notMet', points: measured - engagement.threshold };
  }
  return met
    ? { kind: 'headroom', pct: headroomPct(engagement.threshold, measured) }
    : { kind: 'stretch', points: engagement.threshold - measured };
}

function statusOf(engagement: AuthoredEngagement, margin: EngagementMargin): EngagementStatus {
  switch (margin.kind) {
    case 'headroom':
      return 'tenu';
    case 'notMet':
      return 'nonTenu';
    case 'stretch':
      // a target with a review date is not a breach until the date. it is in
      // progress, which is the state the official grid and the contract both
      // use, and the tracker used to call it "at risk" while the report called
      // it "en cours".
      return 'enCours';
    case 'process':
      return engagement.basis.kind === 'process' &&
        engagement.basis.delivered >= periodsElapsed(engagement.basis.periodsPerYear)
        ? 'tenu'
        : 'nonTenu';
  }
}

/** how many quarterly reports were due by the period this canon describes. */
const PERIODS_ELAPSED = 2;
function periodsElapsed(_perYear: number): number {
  return PERIODS_ELAPSED;
}

/**
 * how full the gauge draws, as a share of the allowance consumed. one
 * computation, so the bar and the number beside it cannot disagree, which they
 * did on every surface that carried both.
 */
function gaugePct(engagement: AuthoredEngagement, measured: number): number {
  if (engagement.basis.kind === 'process') {
    return (engagement.basis.delivered / engagement.threshold) * 100;
  }
  if (engagement.threshold === 0) return 0;
  const raw =
    engagement.direction === 'lte'
      ? (measured / engagement.threshold) * 100
      : (measured / engagement.threshold) * 100;
  return Math.min(100, Math.max(0, raw));
}

/**
 * the measured history behind an engagement, where the scenario kept one.
 *
 * a metric engagement draws its own metric's history; a carbon engagement
 * draws the same bytes carried through the reference model, because the
 * estimate has no history of its own and inventing one would be a second
 * measurement. everything else returns null and the surface draws no line.
 */
function historyOf(engagement: AuthoredEngagement): number[] | null {
  if (engagement.basis.kind === 'metric') {
    const history = canonMetric(engagement.basis.aggregationId, engagement.basis.metricId).history;
    return history === undefined ? null : history.map((point) => point.median);
  }
  if (engagement.basis.kind === 'carbon') {
    const { aggregationId } = engagement.basis;
    const history = canonMetric(aggregationId, 'transferred_bytes').history;
    if (history === undefined) return null;
    const requestCount = canonMetric(aggregationId, 'request_count').median;
    const domNodeCount = canonMetric(aggregationId, 'dom_node_count').median;
    return history.map(
      (point) =>
        estimateMeasured(
          { transferredBytes: point.median, requestCount, domNodeCount },
          { greenHostingFactor: 1 },
        ).band.reference,
    );
  }
  return null;
}

/**
 * whether the engagement's own figure has moved since the oldest aggregation
 * the history holds, through the kernel and against the scenario's floor. a
 * tracker that colours a flat line is the noise floor rule lost on a sparkline.
 */
function trendOf(engagement: AuthoredEngagement) {
  if (engagement.basis.kind !== 'metric' && engagement.basis.kind !== 'carbon') return null;
  const aggregationId = engagement.basis.aggregationId;
  const metricId: MetricId =
    engagement.basis.kind === 'metric' ? engagement.basis.metricId : 'transferred_bytes';
  const metric = canonMetric(aggregationId, metricId);
  if (metric.history === undefined || metric.history.length === 0) return null;

  const oldest = metric.history[0]!;
  const shared = { metricId, unit: metric.unit, sampleCount: metric.sampleCount };
  const delta = classifyDelta(
    { ...shared, median: oldest.median, mad: oldest.mad, min: oldest.low, max: oldest.high },
    { ...shared, median: metric.median, mad: metric.mad, min: metric.min, max: metric.max },
    metric.floor,
  );
  return {
    classification: delta.classification,
    before: delta.before,
    after: delta.after,
    periods: metric.history.length,
  };
}

function build(engagement: AuthoredEngagement) {
  const measured = measure(engagement);
  const margin = marginOf(engagement, measured.value);
  return {
    id: engagement.id,
    labelFr: engagement.labelFr,
    basis: engagement.basis,
    threshold: engagement.threshold,
    direction: engagement.direction,
    unit: engagement.unit,
    inOffer: engagement.inOffer,
    measured,
    margin,
    /**
     * an engagement nobody signed has no status. there is nothing to hold, so
     * the contract surfaces do not carry it at all and the tender shows it as
     * the proposal it is.
     */
    status: engagement.inOffer ? statusOf(engagement, margin) : null,
    gaugePct: engagement.inOffer ? gaugePct(engagement, measured.value) : null,
    history: historyOf(engagement),
    trend: trendOf(engagement),
  };
}

export type Engagement = ReturnType<typeof build>;

export function buildEngagementCanon() {
  const engagements = ENGAGEMENTS.map(build);
  return {
    referenceModelId: REFERENCE_MODEL_ID,
    periodsElapsed: PERIODS_ELAPSED,
    /** the definition, published with the numbers it produced. */
    headroomDefinitionFr:
      "Marge = (seuil - valeur mesurée) / seuil. Le dénominateur est le seuil signé, jamais la valeur mesurée.",
    engagements,
    offered: engagements.filter((entry) => entry.inOffer),
    proposedOnly: engagements.filter((entry) => !entry.inOffer),
  };
}

export type EngagementCanon = ReturnType<typeof buildEngagementCanon>;
