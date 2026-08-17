import type { Catalog } from './en.js';

// Catalogue français. Même structure que le catalogue anglais, vérifiée par
// le compilateur. Règle maison : aucun tiret cadratin dans les chaînes.

export const fr: Catalog = {
  nav: {
    groups: {
      instrument: "L'instrument",
      check: 'Le contrôle',
      documents: 'Les documents',
      publicSurfaces: 'Surfaces publiques',
    },
    items: {
      dashboard: 'Tableau de bord',
      runDetail: 'Détail de relevé',
      comparison: 'Comparaison',
      budgets: 'Budgets',
      criteria: 'Critères RGESN',
      declarationEditor: 'Éditeur de déclaration',
      tenderWorkspace: "Espace appel d'offres",
      contractTracker: 'Suivi de contrat',
      fleet: 'Flotte',
      prCheck: 'Contrôle de pull request',
      docDeclaration: "Déclaration d'écoconception",
      docAnnexe: 'Annexe environnementale',
      docRapport: "Rapport d'exécution",
      freeScan: 'Scan gratuit',
      observatory: 'Observatoire',
      ledgerVerification: 'Vérification du registre',
    },
  },
  appBar: {
    branch: 'branche',
    lastRun: 'dernier relevé',
    fingerprintLabel: 'EMPREINTE ENV.',
    methodology: 'MÉTHODOLOGIE',
    declarationDue: 'DÉCLARATION DUE DANS {days} J',
    minutesAgo: 'il y a {minutes} min',
  },
  confidence: {
    high: 'ÉLEVÉE',
    medium: 'MOYENNE',
    low: 'FAIBLE',
    highBadge: 'CONF. ÉLEVÉE',
  },
  verdicts: {
    breach: 'DÉPASSEMENT',
    real: 'RÉEL',
    noSig: 'NON SIG.',
    noSigFull: 'Aucun changement significatif',
    warn: 'ALERTE',
    fail: 'ÉCHEC',
    indeterminate: 'HISTORIQUE INSUFFISANT',
  },
  dashboard: {
    scopeLine: 'Unité de périmètre RGESN · {scenarios} scénarios · {journeys} parcours',
    continuousSince: 'Mesure continue depuis le {date} · {runs} relevés conservés',
    tiles: {
      carbonPerVisit: 'CARBONE / VISITE',
      transferred: 'OCTETS TRANSFÉRÉS',
      thirdPartyShare: 'PART DES TIERS',
      domNodes: 'NŒUDS DOM',
      carbonUnit: 'gCO₂e',
      kbUnit: 'Ko',
      nodesUnit: 'nœuds',
      pctOfBytes: '% des octets',
      acrossModels: 'sur {count} modèles',
      madShort: 'MAD {value}',
      commitCeiling: 'engagement ≤{value}',
      provenanceReference: '{model} · référence · étendue = {count} modèles',
      provenanceMeasured: 'mesuré · étendue = médiane ± MAD',
      thresholdBreached: 'seuil contractuel dépassé',
      dispersionHigh: 'dispersion élevée · {varied} relevés sur {total} ont varié',
    },
    trend: {
      title: 'OCTETS TRANSFÉRÉS · 30 JOURS · DÉPLOIEMENTS',
      journeyLabel: 'parcours : {journey}',
      medianMad: 'médiane · MAD {mad}',
      budgetLabel: 'BUDGET {value} Ko',
    },
    regressions: {
      title: 'RÉGRESSIONS OUVERTES',
      gained: 'a gagné',
      openComparison: 'Ouvrir la comparaison',
      addToBacklog: 'Ajouter au backlog',
    },
    completeness: {
      title: 'COMPLÉTUDE DE LA DÉCLARATION',
      automated: 'AUTOMATISÉ',
      assisted: 'ASSISTÉ',
      declarative: 'DÉCLARATIF',
      declarativeNote:
        '{count} critères déclaratifs attendent encore un responsable désigné et un artefact déposé.',
    },
    deadline: {
      title: 'PROCHAINE ÉCHÉANCE CONTRACTUELLE',
      detail: "Rapport d'exécution T3 · marché {contract} · {days} jours",
      previewReport: 'Prévisualiser le rapport',
    },
  },
  placeholder: {
    eyebrow: 'PRÉVU',
    body: "Prévu pour la {version}. Rien ne s'affiche ici tant que ce ne peut pas être mesuré ; des chiffres inventés ruineraient l'exercice.",
    reference: 'La référence de design de cette surface est finale.',
  },
};
