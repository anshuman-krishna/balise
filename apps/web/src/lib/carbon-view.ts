import { formatNumber } from '@balise/ui';
import { fill, t } from '../i18n';
import { carbonCanon, type CarbonModelOutput, type CarbonPage } from '../fixtures/carbon-canon';

/**
 * what the carbon surfaces render. every figure is read off estimates
 * @balise/carbon-models produced; nothing here estimates, rounds a stored
 * value, or reconciles two models.
 *
 * the band carries the energy models only and ecoindex sits beside it as the
 * score and grade it publishes. that split is METHODOLOGY.md 10.1, applied in
 * the package and recorded in the canon.
 */

export function carbonPage(id: CarbonPage['id']): CarbonPage {
  const page = carbonCanon.pages.find((candidate) => candidate.id === id);
  if (page === undefined) throw new Error(`no carbon estimate for page ${id}`);
  return page;
}

/**
 * three decimals on gCO2e per visit. at a french grid the reference model
 * lands near 0.08, where two decimals would round two different pages to the
 * same figure. display precision only: the stored value is untouched.
 */
export function formatCarbon(value: number): string {
  return formatNumber(value, 3);
}

/**
 * an axis wide enough to hold the band with room to read it, rounded out to a
 * tick a person can name. derived from the band, never chosen per screen.
 */
export function carbonScale(page: CarbonPage): { min: number; max: number } {
  const step = 0.05;
  return { min: 0, max: Math.ceil((page.band.high * 1.15) / step) * step };
}

export function referenceModel(page: CarbonPage): CarbonModelOutput {
  const model = page.inBand.find((output) => output.isReference);
  if (model === undefined) throw new Error(`page ${page.id} has no reference model in its band`);
  return model;
}

/** the reference model as `id@version`, which every figure has to name. */
export function referenceLabel(page: CarbonPage): string {
  const model = referenceModel(page);
  return `${model.id}@${model.version}`;
}

/**
 * the reference model as a reader of a tender would name it: the published
 * spec version, not our package's. the implementation version travels with the
 * figure through `referenceModelRef`, which is where invariant 1 wants it.
 */
export function referenceSpecLabel(page: CarbonPage): string {
  const model = referenceModel(page);
  return `${model.id} v${model.specVersion}`;
}

/** every model sharing the band, named as it is published. */
export function bandModelNames(page: CarbonPage): string {
  return page.inBand.map((output) => `${output.id} v${output.specVersion}`).join(' · ');
}

export function bandRangeText(page: CarbonPage): string {
  return `${formatCarbon(page.band.low)} – ${formatCarbon(page.band.high)}`;
}

/**
 * the line under every carbon figure. names the reference model, how many
 * models the band spans, and the grid the estimate assumed, because a
 * low-carbon grid must never silently flatter the result.
 */
export function carbonProvenance(page: CarbonPage): string {
  return fill(t.carbon.provenance, {
    model: referenceLabel(page),
    count: page.band.modelCount,
    grid: carbonCanon.grid.gCO2ePerKwh,
    zone: carbonCanon.grid.zone,
  });
}

export interface CarbonAside {
  id: string;
  version: string;
  /** the model's published output, which is what it is reported as. */
  headline: string;
  /** why it is not in the band, in the interface's own words. */
  note: string;
  /** its own gCO2e figure, available and labelled rather than hidden. */
  ownValue: string;
}

/**
 * the models reported beside the band rather than in it. each one says what it
 * publishes and why it is not on the same axis, so nothing looks dropped.
 */
export function carbonAsides(page: CarbonPage): CarbonAside[] {
  return page.aside.map((output) => ({
    id: output.id,
    version: output.version,
    headline:
      output.grade === null
        ? formatCarbon(output.value)
        : fill(t.carbon.gradeAndScore, { grade: output.grade, score: Math.round(output.score ?? 0) }),
    note: t.carbon.scoreDerived,
    ownValue: fill(t.carbon.ownValue, { value: formatCarbon(output.value) }),
  }));
}

/** the models row on the fingerprint panel: exactly what ran, with versions. */
export function modelsRan(): string {
  return carbonCanon.assumptions.map((entry) => `${entry.id}@${entry.version}`).join(' ');
}

export interface CarbonBar {
  id: string;
  label: string;
  value: number;
  low: number | null;
  high: number | null;
  isReference: boolean;
  inBand: boolean;
  note: string;
}

/**
 * every model that ran, in one list, marked for whether it shares the band.
 * the run detail shows all of them: what 10.1 governs is which share an axis,
 * never which are shown.
 */
export function allModelBars(page: CarbonPage): CarbonBar[] {
  const rows = [...page.inBand, ...page.aside];
  return rows.map((output) => {
    const inBand = page.inBand.some((banded) => banded.id === output.id);
    return {
      id: output.id,
      label: `${output.id}@${output.version}`,
      value: output.value,
      low: output.low,
      high: output.high,
      isReference: output.isReference,
      inBand,
      // in the band, the question a reader has is whether the model knows the
      // visitor's grid. beside it, the question is why it is not in the band
      // at all, and answering the first one there would be a non-sequitur.
      note: inBand
        ? output.gridSensitive
          ? t.carbon.gridSensitive
          : t.carbon.gridBlind
        : t.carbon.scoreDerivedShort,
    };
  });
}

/** the reference model as the ToleranceBand needs it, for any band on screen. */
export function referenceModelRef(page: CarbonPage = carbonPage('dashboard')): { id: string; version: string } {
  const model = referenceModel(page);
  return { id: model.id, version: model.version };
}

export interface CarbonDeltaRow {
  /** the reference model's figure on each side, which the row prints. */
  before: number;
  after: number;
  delta: number;
  /** what the band models each make of the change. they disagree on its size too. */
  bandLow: number;
  bandHigh: number;
  /** the measurement floor carried through the reference model, both sides. */
  floor: number;
  modelCount: number;
}

/**
 * the estimate row on the comparison table. an estimate is not a kernel
 * metric: it has no runs of its own and therefore no dispersion of its own, so
 * its band here is the disagreement between the band models about the size of
 * the change, and its noise region is the transferred-bytes floor carried
 * through the reference model on both sides.
 *
 * significance is not decided here. it is inherited from the measured metric
 * that drives the estimate, which is the only thing that was actually observed
 * varying. see the caller.
 */
export function carbonDeltaRow(): CarbonDeltaRow | null {
  const after = carbonPage('candidate');
  const before = carbonPage('baseline');
  if (after.noise === null || before.noise === null) return null;

  const deltas = after.inBand.map((output) => {
    const match = before.inBand.find((candidate) => candidate.id === output.id);
    return match === undefined ? null : output.value - match.value;
  });
  const paired = deltas.filter((value): value is number => value !== null);
  if (paired.length === 0) return null;

  const half = (page: CarbonPage): number =>
    page.noise === null ? 0 : (page.noise.high - page.noise.low) / 2;

  return {
    before: before.band.reference,
    after: after.band.reference,
    delta: after.band.reference - before.band.reference,
    bandLow: Math.min(...paired),
    bandHigh: Math.max(...paired),
    floor: half(after) + half(before),
    modelCount: paired.length,
  };
}
