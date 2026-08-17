import type { ModelInput, ModelOutput } from '@balise/schemas';
import type { CarbonModel } from '../types.js';

// EcoIndex, the published French scoring model (www.ecoindex.fr).
// Quantile tables and formula from the published methodology; values match
// the CNUMR reference implementation (GreenIT-Analysis, ecoIndex.js).
// Score weights: DOM nodes x3, requests x2, page weight x1, over quantile
// ranks. Grade A to G. GES in gCO2e derives from the score alone.

const QUANTILES_DOM = [
  0, 47, 75, 159, 233, 298, 358, 417, 476, 537, 603, 674, 753, 843, 949, 1076, 1237, 1459, 1801,
  2479, 594601,
] as const;

const QUANTILES_REQUESTS = [
  0, 2, 15, 25, 34, 42, 49, 56, 63, 70, 78, 86, 95, 105, 117, 130, 147, 170, 205, 281, 3920,
] as const;

const QUANTILES_SIZE_KB = [
  0, 1.37, 144.7, 319.53, 479.46, 631.97, 783.38, 937.91, 1098.62, 1265.47, 1448.32, 1648.27,
  1876.08, 2142.06, 2465.37, 2866.31, 3401.59, 4155.73, 5400.08, 8037.54, 223212.26,
] as const;

function computeQuantileRank(quantiles: readonly number[], value: number): number {
  for (let i = 1; i < quantiles.length; i++) {
    if (value < quantiles[i]!) {
      return i - 1 + (value - quantiles[i - 1]!) / (quantiles[i]! - quantiles[i - 1]!);
    }
  }
  return quantiles.length - 1;
}

export function computeEcoIndexScore(domNodes: number, requests: number, sizeKb: number): number {
  const qDom = computeQuantileRank(QUANTILES_DOM, domNodes);
  const qRequests = computeQuantileRank(QUANTILES_REQUESTS, requests);
  const qSize = computeQuantileRank(QUANTILES_SIZE_KB, sizeKb);
  return 100 - (5 * (3 * qDom + 2 * qRequests + qSize)) / 6;
}

export function ecoIndexGrade(score: number): string {
  if (score > 80) return 'A';
  if (score > 70) return 'B';
  if (score > 55) return 'C';
  if (score > 40) return 'D';
  if (score > 25) return 'E';
  if (score > 10) return 'F';
  return 'G';
}

export const ecoindexModel: CarbonModel = {
  id: 'ecoindex',
  version: '0.1.0',
  specVersion: '1.0',
  inputs: ['dom_node_count', 'request_count', 'transferred_bytes'],
  assumptions: [
    {
      id: 'ecoindex-published-method',
      textFr:
        "Tables de quantiles et formule issues de la méthode EcoIndex publiée (ecoindex.fr), conformes à l'implémentation de référence du CNUMR.",
      textEn:
        'Quantile tables and formula from the published EcoIndex method (ecoindex.fr), matching the CNUMR reference implementation.',
    },
    {
      id: 'ecoindex-ges-from-score',
      textFr:
        "Le GES (gCO2e par page) dérive du seul score : 2 + 2 x (50 - score) / 100. Ni l'intensité du réseau électrique ni l'hébergement ne sont pris en compte.",
      textEn:
        'GES (gCO2e per page) derives from the score alone: 2 + 2 x (50 - score) / 100. Grid intensity and hosting are not taken into account.',
    },
    {
      id: 'ecoindex-size-unit',
      textFr: 'Le poids de page est interprété en kilooctets décimaux (1 Ko = 1000 octets).',
      textEn: 'Page weight is interpreted in decimal kilobytes (1 KB = 1000 bytes).',
    },
    {
      id: 'ecoindex-per-page',
      textFr: 'Valeur par page chargée à froid, sans modélisation du cache ni des visites répétées.',
      textEn: 'Per cold page load; no cache or return-visit modelling.',
    },
  ],
  estimate(input: ModelInput): ModelOutput {
    if (input.domNodeCount === undefined || input.requestCount === undefined) {
      throw new Error('ecoindex requires domNodeCount and requestCount');
    }
    const sizeKb = input.transferredBytes / 1000;
    const score = computeEcoIndexScore(input.domNodeCount, input.requestCount, sizeKb);
    const grade = ecoIndexGrade(score);
    // Published GES formula; stored unrounded, display rounding happens at
    // the edge (invariant 6). The reference implementation rounds to 2
    // decimals for display only.
    const ges = 2 + (2 * (50 - score)) / 100;
    return {
      value: ges,
      unit: 'gCO2e',
      score,
      grade,
      notes: [`EcoIndex score ${score.toFixed(2)} / 100, grade ${grade}`],
    };
  },
};
