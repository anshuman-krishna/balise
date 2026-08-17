import type { ModelInput, ModelOutput } from '@balise/schemas';
import type { CarbonModel } from '../types.js';

// Sustainable Web Design model, version 4.
// Published constants from sustainablewebdesign.org/estimating-digital-emissions,
// as carried by the Green Web Foundation's co2.js (Apache-2.0). Segments:
// data centre, network, device; operational and embodied for each.

const GIGABYTE = 1_000_000_000;

const OPERATIONAL_KWH_PER_GB = {
  dataCenter: 0.055,
  network: 0.059,
  device: 0.08,
} as const;

const EMBODIED_KWH_PER_GB = {
  dataCenter: 0.012,
  network: 0.013,
  device: 0.081,
} as const;

// Per SWDM v4 guidance, embodied emissions use the global average intensity
// regardless of the visitor's grid.
const GLOBAL_GRID_INTENSITY = 494;

export const swdModel: CarbonModel = {
  id: 'swd',
  version: '0.1.0',
  specVersion: '4.0',
  inputs: ['transferred_bytes'],
  assumptions: [
    {
      id: 'swd-published-constants',
      textFr:
        'Constantes publiées du modèle Sustainable Web Design v4 (sustainablewebdesign.org) : énergie opérationnelle 0,055 / 0,059 / 0,080 kWh par Go (centre de données, réseau, terminal) et énergie intrinsèque 0,012 / 0,013 / 0,081 kWh par Go.',
      textEn:
        'Published Sustainable Web Design v4 constants (sustainablewebdesign.org): operational energy 0.055 / 0.059 / 0.080 kWh per GB (data centre, network, device) and embodied energy 0.012 / 0.013 / 0.081 kWh per GB.',
    },
    {
      id: 'swd-single-grid',
      textFr:
        "Une seule intensité de réseau électrique est appliquée aux trois segments opérationnels : celle de la zone déclarée ou mesurée du visiteur.",
      textEn:
        'A single grid intensity is applied to all three operational segments: the declared or measured visitor zone.',
    },
    {
      id: 'swd-embodied-global',
      textFr:
        "Les émissions intrinsèques sont calculées à l'intensité moyenne mondiale (494 gCO2e/kWh), conformément au modèle v4. Elles sont incluses dans la valeur.",
      textEn:
        'Embodied emissions are computed at the global average intensity (494 gCO2e/kWh) per the v4 model, and are included in the value.',
    },
    {
      id: 'swd-first-visit',
      textFr:
        'Valeur pour une visite à froid, sans remise pour visiteurs récurrents ni cache. Les passes à froid et à chaud sont mesurées séparément.',
      textEn:
        'Cold-visit figure; no return-visitor or cache discount. Cold and warm passes are measured separately.',
    },
    {
      id: 'swd-green-hosting',
      textFr:
        "Le facteur d'hébergement vert (0 à 1) réduit uniquement les émissions opérationnelles du centre de données.",
      textEn:
        'The green hosting factor (0 to 1) reduces operational data centre emissions only.',
    },
  ],
  estimate(input: ModelInput): ModelOutput {
    const gb = input.transferredBytes / GIGABYTE;
    const grid = input.gridIntensity.gCO2ePerKwh;

    const operational = {
      dataCenter: gb * OPERATIONAL_KWH_PER_GB.dataCenter * grid,
      network: gb * OPERATIONAL_KWH_PER_GB.network * grid,
      device: gb * OPERATIONAL_KWH_PER_GB.device * grid,
    };
    const embodied = {
      dataCenter: gb * EMBODIED_KWH_PER_GB.dataCenter * GLOBAL_GRID_INTENSITY,
      network: gb * EMBODIED_KWH_PER_GB.network * GLOBAL_GRID_INTENSITY,
      device: gb * EMBODIED_KWH_PER_GB.device * GLOBAL_GRID_INTENSITY,
    };

    const value =
      operational.dataCenter * (1 - input.greenHostingFactor) +
      embodied.dataCenter +
      operational.network +
      embodied.network +
      operational.device +
      embodied.device;

    return {
      value,
      unit: 'gCO2e',
      notes: [
        `operational grid ${grid} gCO2e/kWh (${input.gridIntensity.zone}, ${input.gridIntensity.source})`,
        `embodied at global average ${GLOBAL_GRID_INTENSITY} gCO2e/kWh`,
        `green hosting factor ${input.greenHostingFactor}`,
      ],
    };
  },
};
