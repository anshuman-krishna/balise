import type { ModelInput, ModelOutput } from '@balise/schemas';
import type { CarbonModel } from '../types.js';

// the 1byte model (the shift project), as carried by the green web
// foundation's co2.js (apache-2.0). an older per-byte model, included for
// comparison and because some buyers still cite it. constants are the
// reference implementation's, reproduced exactly.

const KWH_PER_BYTE_DATACENTER = 7.2e-11;

const FIXED_NETWORK_WIRED = 4.29e-10;
const FIXED_NETWORK_WIFI = 1.52e-10;
const FOUR_G_MOBILE = 8.84e-10;
const KWH_PER_BYTE_NETWORK = (FIXED_NETWORK_WIRED + FIXED_NETWORK_WIFI + FOUR_G_MOBILE) / 3;

const CO2_PER_KWH_DATACENTER_GREY = 519;
const CO2_PER_KWH_NETWORK_GREY = 475;
const CO2_PER_KWH_DATACENTER_GREEN = 0;

export const onebyteModel: CarbonModel = {
  id: 'onebyte',
  version: '0.1.0',
  specVersion: '2021',
  inputs: ['transferred_bytes'],
  assumptions: [
    {
      id: 'onebyte-fixed-intensity',
      textFr:
        "Intensités fixes issues de l'implémentation de référence : 519 gCO2e/kWh (centre de données, mix américain) et 475 gCO2e/kWh (réseau, moyenne mondiale AIE 2018). L'intensité réelle du réseau du visiteur n'est pas appliquée.",
      textEn:
        'Fixed intensities from the reference implementation: 519 gCO2e/kWh (data centre, US mix) and 475 gCO2e/kWh (network, IEA 2018 global average). The visitor grid intensity is not applied.',
    },
    {
      id: 'onebyte-no-device',
      textFr:
        "L'énergie des terminaux est exclue du total calculé, comme dans l'implémentation de référence.",
      textEn:
        'Device energy is excluded from the computed total, as in the reference implementation.',
    },
    {
      id: 'onebyte-binary-green',
      textFr:
        "Le modèle ne connaît qu'un hébergement vert binaire : il est considéré vert uniquement si le facteur d'hébergement vert vaut exactement 1.",
      textEn:
        'The model only knows binary green hosting: it is treated as green only when the green hosting factor is exactly 1.',
    },
    {
      id: 'onebyte-no-embodied',
      textFr: "Aucune émission intrinsèque (fabrication) n'est incluse dans la valeur calculée.",
      textEn: 'No embodied (manufacturing) emissions are included in the computed value.',
    },
    {
      id: 'onebyte-dated',
      textFr:
        'Modèle ancien, conservé pour comparaison car encore cité par certains acheteurs.',
      textEn: 'Dated model, kept for comparison because some buyers still cite it.',
    },
  ],
  estimate(input: ModelInput): ModelOutput {
    const bytes = input.transferredBytes;
    const green = input.greenHostingFactor >= 1;

    let value: number;
    if (bytes < 1) {
      value = 0;
    } else if (green) {
      const dataCenter = bytes * KWH_PER_BYTE_DATACENTER * CO2_PER_KWH_DATACENTER_GREEN;
      const network = bytes * KWH_PER_BYTE_NETWORK * CO2_PER_KWH_NETWORK_GREY;
      value = dataCenter + network;
    } else {
      value = bytes * (KWH_PER_BYTE_DATACENTER + KWH_PER_BYTE_NETWORK) * CO2_PER_KWH_DATACENTER_GREY;
    }

    return {
      value,
      unit: 'gCO2e',
      notes: [green ? 'green data centre path' : 'grey path, fixed 519 gCO2e/kWh'],
    };
  },
};
