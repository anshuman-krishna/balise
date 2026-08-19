import type { AssessmentStatus, CriterionEvidence } from '@balise/schemas';
import { blockingFindings, canPublish, completion, evaluate } from '@balise/criteria-engine';
import { rgesn2024v2 } from '@balise/rule-packs';

/**
 * the canon's rgesn assessment, answered by the engine rather than typed into
 * a fixture. every status, every count and every blocking finding on the
 * criteria workspace and the declaration editor comes out of this.
 *
 * two things it deliberately does not hide. the pack ships
 * `tiersSignedOff: false`, so nothing is answered from measurement and every
 * answer below is one a named person put their name to. and one criterion out
 * of seventy-eight carries an evaluation rule this engine can run, which is
 * the second sign-off, not the first.
 */

const REFERENT = 'm. carbonne';
const DEVELOPER = 'c. bellanger';

/** the two reviewers, and when they went through their families. */
const REVIEWED_AT = {
  [REFERENT]: '2026-08-12T09:40:00.000Z',
  [DEVELOPER]: '2026-08-14T16:05:00.000Z',
} as const;

type Attester = typeof REFERENT | typeof DEVELOPER;

interface Answer {
  status: AssessmentStatus;
  by: Attester;
  /** required by the official grid for anything that is not conforme. */
  why?: string;
}

const NO_MODEL =
  "Le service ne comporte aucune phase d'apprentissage ni d'inférence de modèle. Critère hors périmètre.";

/**
 * what the two reviewers answered, criterion by criterion. this is the
 * customer's own content: an audit's answers and the text it justified them
 * with, not template copy. the engine turns it into assessments; nothing here
 * is a status the screen chose.
 *
 * a criterion absent from this table was not looked at, and comes back
 * `non_evalue`, which is the absence of an answer and never a failure.
 */
const ANSWERS: Record<string, Answer> = {
  // --- 1 stratégie -----------------------------------------------------
  '1.1': { status: 'conforme', by: REFERENT },
  '1.2': { status: 'conforme', by: REFERENT },
  '1.3': { status: 'conforme', by: REFERENT },
  '1.4': { status: 'conforme', by: REFERENT },
  '1.5': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Un objectif de poids par page est fixé et suivi en continu. Aucun objectif n'est fixé sur les autres impacts du service.",
  },
  '1.6': { status: 'conforme', by: REFERENT },
  '1.7': { status: 'conforme', by: REFERENT },
  '1.8': {
    status: 'non_conforme',
    by: REFERENT,
    why: "Aucun composant du service n'est publié en open source à ce jour. Une ouverture du thème est à l'étude pour 2027.",
  },
  '1.9': { status: 'conforme', by: REFERENT },

  // --- 2 spécifications ------------------------------------------------
  '2.1': { status: 'conforme', by: REFERENT },
  '2.2': {
    status: 'partiellement_conforme',
    by: DEVELOPER,
    why: "Le service reste utilisable sur terminal ancien, mais le profil mobile-3g mesure un affichage du contenu principal à 6,2 s sur le parcours de demande d'acte.",
  },
  '2.3': {
    status: 'non_conforme',
    by: DEVELOPER,
    why: "Le parcours de demande d'acte est inopérant sans JavaScript et aucun mode hors connexion n'est proposé.",
  },
  '2.4': { status: 'conforme', by: DEVELOPER },
  '2.5': { status: 'conforme', by: DEVELOPER },
  '2.6': { status: 'conforme', by: REFERENT },
  '2.7': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Une stratégie de maintenance est contractualisée jusqu'en 2029. Le décommissionnement n'est pas décrit.",
  },
  '2.8': {
    status: 'non_conforme',
    by: REFERENT,
    why: "Le marché en cours n'impose aucune démarche de réduction d'impact aux fournisseurs. La clause est prévue au renouvellement de 2026.",
  },
  '2.9': { status: 'conforme', by: REFERENT },
  '2.10': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Le lecteur vidéo tiers a été retenu sans évaluation de son impact. Les autres services tiers ont été évalués.",
  },

  // --- 3 architecture ---------------------------------------------------
  '3.1': { status: 'conforme', by: REFERENT },
  '3.2': { status: 'conforme', by: REFERENT },
  '3.3': { status: 'conforme', by: REFERENT },
  '3.4': { status: 'conforme', by: REFERENT },
  '3.5': { status: 'conforme', by: REFERENT },
  '3.6': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Les mises à jour du thème sont incrémentielles. Celles du socle applicatif remplacent l'ensemble du code livré.",
  },
  '3.7': { status: 'conforme', by: REFERENT },

  // --- 4 expérience et interface ---------------------------------------
  '4.1': {
    status: 'non_conforme',
    by: DEVELOPER,
    why: "Le lecteur vidéo de la rubrique actualités déclenche une lecture automatique, et trois carrousels animés défilent seuls en page d'accueil.",
  },
  '4.2': { status: 'conforme', by: DEVELOPER },
  '4.3': { status: 'conforme', by: REFERENT },
  '4.4': {
    status: 'partiellement_conforme',
    by: DEVELOPER,
    why: "Le gestionnaire de consentement permet de refuser les services tiers, mais la mesure d'audience est chargée avant le choix de l'utilisateur.",
  },
  '4.5': { status: 'conforme', by: DEVELOPER },
  '4.6': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Les vidéos institutionnelles portent une information. Les carrousels de la page d'accueil n'en portent aucune.",
  },
  '4.7': { status: 'conforme', by: REFERENT },
  '4.8': {
    status: 'non_conforme',
    by: REFERENT,
    why: 'Trois familles de caractères sont téléchargées sur chaque page, pour 186 KB transférés.',
  },
  '4.9': { status: 'conforme', by: DEVELOPER },
  '4.10': { status: 'conforme', by: DEVELOPER },
  '4.11': {
    status: 'partiellement_conforme',
    by: DEVELOPER,
    why: 'Le formulaire de demande annonce les formats acceptés, pas le poids maximum attendu.',
  },
  '4.13': { status: 'conforme', by: REFERENT },
  '4.14': { status: 'conforme', by: REFERENT },
  // answered non conforme and left without a justification. the official grid
  // requires one, and the engine reports the gap rather than publishing it.
  '4.15': { status: 'non_conforme', by: REFERENT },

  // --- 5 contenus -------------------------------------------------------
  '5.1': {
    status: 'partiellement_conforme',
    by: DEVELOPER,
    why: "L'image d'en-tête est passée en webp. Six visuels de la rubrique actualités restent au format jpeg.",
  },
  '5.2': {
    status: 'partiellement_conforme',
    by: DEVELOPER,
    why: 'Six des quarante-et-une images de la page sont servies sans compression adaptée au contexte de consultation.',
  },
  '5.3': { status: 'conforme', by: DEVELOPER },
  '5.5': {
    status: 'non_conforme',
    by: DEVELOPER,
    why: "Le lecteur tiers ne propose pas de mode écoute seule et n'est pas paramétrable sur ce point.",
  },
  '5.6': { status: 'conforme', by: DEVELOPER },
  '5.7': { status: 'conforme', by: DEVELOPER },
  '5.8': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Les actualités sont archivées après deux ans. Aucune règle de suppression n'existe pour les pièces jointes des démarches.",
  },

  // --- 6 frontend -------------------------------------------------------
  '6.1': {
    status: 'non_conforme',
    by: DEVELOPER,
    why: "Le budget de poids est dépassé sur le parcours de demande d'acte, à 1 442 KB pour une limite de 1 400 KB.",
  },
  '6.2': { status: 'conforme', by: DEVELOPER },
  '6.3': { status: 'conforme', by: DEVELOPER },
  '6.4': {
    status: 'partiellement_conforme',
    by: DEVELOPER,
    why: "Les visuels de la page d'accueil sont dimensionnés à l'affichage. Ceux des fiches démarches sont servis en pleine résolution.",
  },
  '6.5': {
    status: 'non_conforme',
    by: DEVELOPER,
    why: 'Le bundle de la route embarque les quatre-vingt-seize locales de date-fns, dont deux sont utilisées à l’exécution.',
  },
  '6.6': { status: 'conforme', by: DEVELOPER },
  '6.7': {
    status: 'non_conforme',
    by: DEVELOPER,
    why: 'Le lecteur vidéo et le gestionnaire de consentement sont chargés depuis leurs propres domaines.',
  },

  // --- 7 backend --------------------------------------------------------
  '7.1': { status: 'conforme', by: DEVELOPER },
  '7.2': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Une durée de conservation est fixée sur les pièces des démarches. Les journaux applicatifs n'en ont aucune.",
  },
  '7.3': { status: 'conforme', by: DEVELOPER },
  '7.4': {
    status: 'non_applicable',
    by: REFERENT,
    why: "Le service ne repose sur aucun mécanisme de consensus distribué. Critère hors périmètre.",
  },

  // --- 8 hébergement ----------------------------------------------------
  '8.1': { status: 'conforme', by: REFERENT },
  '8.2': { status: 'conforme', by: REFERENT },
  '8.3': { status: 'conforme', by: REFERENT },
  '8.5': { status: 'conforme', by: REFERENT },
  '8.6': { status: 'conforme', by: REFERENT },
  '8.7': { status: 'conforme', by: REFERENT },
  '8.8': {
    status: 'partiellement_conforme',
    by: REFERENT,
    why: "Les sauvegardes sont sur un stockage froid. Les pièces des démarches closes restent sur le stockage chaud.",
  },
  '8.9': { status: 'conforme', by: REFERENT },

  // --- 9 algorithmie ----------------------------------------------------
  '9.1': { status: 'non_applicable', by: REFERENT, why: NO_MODEL },
  '9.2': { status: 'non_applicable', by: REFERENT, why: NO_MODEL },
  '9.3': { status: 'non_applicable', by: REFERENT, why: NO_MODEL },
  '9.4': { status: 'non_applicable', by: REFERENT, why: NO_MODEL },
  '9.5': { status: 'non_applicable', by: REFERENT, why: NO_MODEL },
  '9.6': { status: 'non_applicable', by: REFERENT, why: NO_MODEL },
  '9.7': { status: 'non_applicable', by: REFERENT, why: NO_MODEL },
};

/**
 * the measured values from the run under assessment, offered to the engine in
 * full. the pack answers nothing from them today, and they are passed anyway:
 * what stops them counting is the unsigned tier split, not a missing input.
 */
const METRICS = {
  transferred_bytes: 1_298_000,
  request_count: 84,
  dom_node_count: 1_842,
  js_execution_ms: 1_180,
  third_party_bytes: 378_000,
  third_party_share_pct: 29.1,
} as const;

export function buildCriteriaCanon() {
  const pack = rgesn2024v2;

  const evidence: CriterionEvidence = {
    metrics: { ...METRICS },
    attestations: Object.fromEntries(
      Object.entries(ANSWERS).map(([id, answer]) => [
        id,
        {
          status: answer.status,
          ...(answer.why === undefined ? {} : { justification: answer.why }),
          attestedBy: answer.by as string,
          attestedAt: REVIEWED_AT[answer.by] as string,
          // no artifact is referenced: this canon carries the answers, not the
          // files behind them, and the engine is told so rather than left to
          // assume one exists.
          evidenceRefs: [],
        },
      ]),
    ),
  };

  const assessments = evaluate(pack, evidence);
  const blocking = blockingFindings(pack, assessments);

  return {
    pack,
    evidence,
    assessments,
    completion: completion(assessments),
    blocking,
    publishable: canPublish(blocking),
  };
}
