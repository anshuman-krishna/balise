import type { GridIntensity, ModelInput } from '@balise/schemas';
import { asideModels, assertModelInputs, bandModels, carbonModels } from '@balise/carbon-models';

/**
 * every carbon figure the application shows, estimated by @balise/carbon-models
 * from the measurements the other canons publish.
 *
 * the band carries the energy models only, and ecoindex is reported as its own
 * score and grade beside it. that rule is METHODOLOGY.md 10.1, applied here
 * through `bandModels`, so this file never decides which models share an axis.
 */

/**
 * france's grid, declared rather than derived: this canon has no rum data. the
 * assumption is on the face of every surface that renders these figures, which
 * is the rule a low-carbon grid makes necessary.
 */
const GRID: GridIntensity = {
  gCO2ePerKwh: 56,
  source: 'declared-default',
  zone: 'FR',
};

/** verified against the green web foundation dataset on the date below. */
const GREEN_HOSTING = 1;
const HOSTING_CHECKED_AT = '2026-08-15';

export const REFERENCE_MODEL_ID = 'swd';

interface Page {
  id: string;
  label: string;
  transferredBytes: number;
  requestCount: number;
  domNodeCount: number;
  /**
   * the established noise floor on transferred bytes for this scenario. the
   * carbon noise band is the reference model run at the floor's two edges,
   * which is measurement noise carried into the estimate rather than a second
   * uncertainty invented for the chart.
   */
  transferredFloorBytes?: number;
}

/**
 * the pages the application estimates. the byte and request counts are the ones
 * the comparison, budget and attribution canons already publish for the same
 * runs, so no two surfaces describe the same page differently.
 */
const PAGES: readonly Page[] = [
  { id: 'candidate', label: '/demarches/acte-naissance', transferredBytes: 1_298_000, requestCount: 84, domNodeCount: 2_140, transferredFloorBytes: 7_000 },
  { id: 'baseline', label: '/demarches/acte-naissance (référence)', transferredBytes: 1_114_000, requestCount: 82, domNodeCount: 2_100, transferredFloorBytes: 7_000 },
  { id: 'dashboard', label: 'médiane du service', transferredBytes: 1_258_000, requestCount: 82, domNodeCount: 2_140, transferredFloorBytes: 7_000 },
  // one cold pass on one page: no history, so no floor, and the scan says so
  // rather than drawing a noise region it did not measure.
  { id: 'scan', label: 'bibliotheques-selo.fr', transferredBytes: 980_000, requestCount: 61, domNodeCount: 1_830 },
];

function inputFor(page: Page): ModelInput {
  return {
    transferredBytes: page.transferredBytes,
    requestCount: page.requestCount,
    domNodeCount: page.domNodeCount,
    gridIntensity: GRID,
    greenHostingFactor: GREEN_HOSTING,
  };
}

function estimatePage(page: Page) {
  const input = inputFor(page);

  const outputs = carbonModels.map((model) => {
    assertModelInputs(model, input);
    const output = model.estimate(input);
    return {
      id: model.id,
      version: model.version,
      specVersion: model.specVersion,
      method: model.method,
      gridSensitive: model.sensitivity.gridIntensity,
      value: output.value,
      unit: output.unit,
      low: output.low ?? null,
      high: output.high ?? null,
      score: output.score ?? null,
      grade: output.grade ?? null,
      notes: output.notes,
      isReference: model.id === REFERENCE_MODEL_ID,
    };
  });

  const banded = new Set(bandModels().map((model) => model.id));
  const inBand = outputs.filter((output) => banded.has(output.id));
  const aside = outputs.filter((output) => !banded.has(output.id));

  const values = inBand.map((output) => output.value);
  const reference = inBand.find((output) => output.isReference);
  if (reference === undefined) {
    throw new Error(`the reference model ${REFERENCE_MODEL_ID} is not in the band`);
  }

  // measurement noise carried into the estimate: the reference model run at
  // the two edges of the floor, and null when no floor is established.
  const noise =
    page.transferredFloorBytes === undefined
      ? null
      : (() => {
          const model = carbonModels.find((candidate) => candidate.id === REFERENCE_MODEL_ID)!;
          const at = (bytes: number) =>
            model.estimate({ ...input, transferredBytes: Math.max(0, bytes) }).value;
          return {
            low: at(page.transferredBytes - page.transferredFloorBytes),
            high: at(page.transferredBytes + page.transferredFloorBytes),
            floorBytes: page.transferredFloorBytes,
          };
        })();

  return {
    id: page.id,
    label: page.label,
    metrics: {
      transferredBytes: page.transferredBytes,
      requestCount: page.requestCount,
      domNodeCount: page.domNodeCount,
    },
    band: {
      low: Math.min(...values),
      high: Math.max(...values),
      /** the reported value: the reference model's, marked on the band. */
      reference: reference.value,
      modelCount: inBand.length,
    },
    noise,
    inBand,
    aside,
  };
}

export function buildCarbonCanon() {
  const pages = PAGES.map(estimatePage);

  return {
    grid: GRID,
    greenHosting: GREEN_HOSTING,
    hostingCheckedAt: HOSTING_CHECKED_AT,
    referenceModelId: REFERENCE_MODEL_ID,
    bandModelIds: bandModels().map((model) => model.id),
    asideModelIds: asideModels().map((model) => model.id),
    assumptions: carbonModels.map((model) => ({
      id: model.id,
      version: model.version,
      method: model.method,
      assumptions: model.assumptions,
    })),
    pages,
  };
}
