import type { Catalog } from './en.js';

// catalogue français. même structure que le catalogue anglais, vérifiée par
// le compilateur. règle maison : aucun tiret cadratin dans les chaînes.

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
  months: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  carbon: {
    provenance: '{model} · référence · bande = {count} modèles · réseau {grid} gCO2e/kWh ({zone})',
    gradeAndScore: '{grade} · {score}/100',
    scoreDerived: "Note calculée à partir du poids, des requêtes et des nœuds DOM. Hors bande : la valeur est lue sur cette note et non calculée à partir de l'énergie.",
    scoreDerivedShort: 'valeur lue sur une note, pas une énergie',
    ownValue: 'sa propre valeur : {value} gCO2e',
    gridSensitive: 'applique le réseau mesuré',
    gridBlind: 'intensités fixes, pas le réseau mesuré',
    asideTitle: 'REPORTÉ À CÔTÉ DE LA BANDE',
    bandTitle: 'DANS LA BANDE',
    hostingChecked: 'hébergement sur électricité renouvelable, vérifié le {date}',
  },
  confidence: {
    high: 'ÉLEVÉE',
    medium: 'MOYENNE',
    low: 'FAIBLE',
    highBadge: 'CONF. ÉLEVÉE',
  },
  metrics: {
    transferred_bytes: 'octets',
    request_count: 'requêtes',
    dom_node_count: 'nœuds DOM',
    js_execution_ms: 'temps JS',
    third_party_bytes: 'octets tiers',
    third_party_share_pct: 'part tierce',
  },
  verdicts: {
    breach: 'DÉPASSEMENT',
    real: 'RÉEL',
    noSig: 'NON SIG.',
    noSigFull: 'Aucun changement significatif',
    warn: 'ALERTE',
    fail: 'ÉCHEC',
    pass: 'TENU',
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
  runDetail: {
    title: 'Relevé {id}',
    coldCache: 'cache froid',
    warmCache: 'cache chaud',
    tabs: {
      waterfall: 'Cascade',
      resources: 'Ressources',
      dispersion: 'Dispersion',
      models: 'Modèles',
      environment: 'Environnement',
    },
    waterfallTitle: 'CASCADE · {requests} REQUÊTES · {kb} KO',
    resourceHeader: 'RESSOURCE',
    kbHeader: 'KO',
    timeHeader: 'TEMPS',
    moreRows: '+ {count} autres',
    thirdPartyTag: '⟨3p⟩',
    modelsTitle: 'SORTIES DE TOUS LES MODÈLES · CÔTE À CÔTE',
    modelsCaption:
      "Deux échelles, pas une : un modèle qui ne calcule pas la même grandeur n'est pas tracé sur le même axe. Un modèle qui ne publie aucune incertitude est tracé en trait, pas en bande, car une largeur inventée se lirait comme une largeur déclarée.",
    dispersionTitle: 'DISPERSION INTER-RELEVÉS · N={n}',
    noiseFloorLabel: 'BRUIT ±{value} KO',
    noFloorLabel: 'PLANCHER NON ÉTABLI',
    deltaTimesNoise: 'Δ +{delta} KO · {ratio}× le bruit',
    dispersionCaption:
      'MAD {baseMad} Ko sur la base, {candMad} Ko sur le candidat. {runs} relevés de chaque côté, même empreinte.',
    baselineRow: 'base',
    candidateRow: 'candidat',
    resources: {
      byTypeTitle: 'PAR TYPE · {requests} REQUÊTES · {kb} KB',
      headers: {
        type: 'TYPE',
        requests: 'REQ',
        transferred: 'TRANSFÉRÉ',
        share: 'PART',
        resource: 'RESSOURCE',
        decoded: 'DÉCOMPRESSÉ',
        unused: 'INUTILISÉ',
        origin: 'ORIGINE',
      },
      types: {
        document: 'document',
        script: 'script',
        stylesheet: 'feuille de style',
        image: 'image',
        font: 'police',
        media: 'média',
        other: 'autre',
      },
      recordsTitle: 'RELEVÉS · {count} SUR {requests} REQUÊTES',
      firstParty: 'première partie',
      coverageCaption:
        "Inutilisé compte les octets décompressés jamais exécutés, relevés par la couverture de code. Ce n'est pas une économie de transfert : ce que la compression aurait fait de ces octets est une autre question, à laquelle le panneau d'attribution répond bundle par bundle.",
      unavailableCaption:
        'Taille décompressée indisponible pour {decoded} ressources, couverture non relevée pour {coverage} scripts ou feuilles de style. Comptées comme telles, jamais estimées.',
    },
    fingerprintTitle: 'EMPREINTE ENVIRONNEMENT',
    fingerprintMatchNote:
      "Empreinte identique à celle de la base. Comparaison permise sans signalement.",
    plannedPanel:
      "Prévu pour la {version}. Rien ne s'affiche ici tant que ce ne peut pas être mesuré ; les autres onglets portent les vues de référence.",
  },
  comparison: {
    baselineTag: 'BASE · {branch}',
    candidateTag: 'CANDIDAT · {branch}',
    fingerprintMatch: 'EMPREINTES IDENTIQUES',
    headers: {
      metric: 'MÉTRIQUE',
      baseline: 'BASE',
      candidate: 'CANDIDAT',
      delta: 'Δ',
      vsNoise: 'VS PLANCHER DE BRUIT',
      verdict: 'VERDICT',
    },
    carbonRow: 'Empreinte estimée par visite ({model})',
    lowConf: 'conf. faible',
    attributionTitle: 'ATTRIBUTION · RÉSOLUE PAR SOURCE MAPS',
    attributionKeys: {
      bundle: 'bundle',
      dependency: 'dépendance',
      module: 'module',
      file: 'fichier',
      commit: 'commit',
      remainder: 'reste',
    },
    attributionLead:
      '{bundle} a pris {amount} décompressés. {share} viennent de {package}, dans {count} nouveaux modules, introduits par {commit}.',
    attributionLeadNoCommit:
      '{bundle} a pris {amount} décompressés. {share} viennent de {package}, dans {count} nouveaux modules. Aucune plage de commits n\'est configurée pour cette comparaison.',
    attributionCoverage:
      '{explained} sur {measured} mesurés sont attribués à des modules. {remainder} sont de la sortie de bundler qu\'aucun mapping ne couvre, consignés plutôt que répartis.',
    thirdPartyTitle: 'DIFF DES TIERS',
    unchanged: 'inchangé',
    newOrigin: 'NOUVELLE ORIGINE',
    noSourceMap:
      "Attribution indisponible pour {origin} : aucune source map servie. Origine et poids sont consignés ; la cause n'est pas déduite.",
  },
  budgets: {
    subtitle: 'Écrit dans {file} sur {branch} · chaque modification est un commit',
    toggleVisual: 'Visuel',
    toggleYaml: 'YAML',
    headers: {
      scopeMetric: 'PÉRIMÈTRE · MÉTRIQUE',
      current: 'ACTUEL',
      threshold: 'SEUIL',
      headroom: 'MARGE',
      onBreach: 'AU DÉPASSEMENT',
    },
    relativeNote: 'règle relative · bornée par le plancher de bruit',
    relativeMetric: 'Δ vs référence',
    worstOn: 'au pire sur {scenario}',
    withinNoiseNote: 'sous le plancher de bruit',
    overriddenNote: 'dérogation',
    overPast: 'au-delà du budget sur',
    notEvaluated: {
      'no-noise-floor': 'pas encore de plancher de bruit',
      'metric-not-measured': 'non mesuré',
      'no-baseline': 'pas de baseline',
      'no-threshold': 'pas de seuil',
    },
    rebaselineTitle: 'HISTORIQUE DE RE-BASELINE',
    rebaselineNote:
      'Chaque re-baseline est inscrite au registre. Déplacer les bornes est possible et visible en permanence.',
    overridesTitle: 'DÉROGATIONS · {count} ACTIVE',
    overridesNotePrefix: 'Les dérogations apparaissent mot pour mot dans le',
    overridesNoteSuffix: '. Personne ne désactive le contrôle en silence.',
    rapportName: "rapport d'exécution",
  },
  prCheck: {
    title: 'Le contrôle',
    subtitle: "Balise tel qu'il apparaît dans l'outil du développeur. Rien à apprendre, rien à ouvrir.",
    merge1: 'souhaite fusionner',
    merge2: 'commits dans',
    merge3: 'depuis',
    blockedTitle: 'La fusion est bloquée',
    blockedBody1: 'Un contrôle requis a échoué.',
    blockedBody2: 'est un statut requis sur',
    details: 'Détails',
    commented: 'a commenté',
    measurementLine: 'Mesure · {runs} relevés par scénario · empreintes identiques',
    headers: {
      route: 'ROUTE',
      base: 'BASE',
      head: 'HEAD',
      delta: 'Δ',
      vsNoise: 'VS BRUIT',
      verdict: 'VERDICT',
    },
    attributionHeading: 'Attribution',
    fixLabel: 'Correction :',
    provenanceMethodology: 'Méthodologie',
    provenanceModels: 'modèles',
    provenanceRun: 'relevé',
    provenanceLedger: 'registre',
    overrideLink: 'déroger à ce contrôle',
    overrideNote: "(motif requis, apparaît dans le rapport d'exécution)",
    toggleRendered: 'Rendu',
    toggleMarkdown: 'Markdown',
    artifactNote:
      "Le contrôle publie ce texte tel quel. Il est construit à partir des mêmes évaluations que la vue rendue, jamais saisi à la main.",
    annotationTitle: 'ANNOTATION EN LIGNE · {file}',
  },
  /**
   * the check run itself: the one line beside its name, the markdown it posts,
   * and the annotations it attaches. the screen renders the same strings, so
   * the mock and the artifact cannot say different things.
   */
  checkRun: {
    statusBreachOne: '1 budget dépassé',
    statusBreachMany: '{count} budgets dépassés',
    statusRegressionOne: '1 régression significative',
    statusRegressionMany: '{count} régressions significatives',
    statusClean: 'tous les budgets tenus',
    statusUndecided: '{count} non évalué',

    summaryBlockedOne: 'La fusion est bloquée par 1 budget dépassé.',
    summaryBlockedMany: 'La fusion est bloquée par {count} budgets dépassés.',
    summaryNeutral: 'Rien ne bloque la fusion. Ce qui suit est signalé.',
    summaryClean: 'Tous les budgets sont tenus sur les scénarios mesurés.',
    summaryBlockingItem: '`{scope}` · {metric} : {observed} pour un seuil de {threshold}, soit {headroom}.',
    summaryOverriddenItem:
      '`{scope}` · {metric} : dépassement couvert par une dérogation de {by}, enregistrée le {date}. Le dépassement reste compté.',
    summaryUndecidedOne: '1 règle non évaluée.',
    summaryUndecidedMany: '{count} règles non évaluées.',
    noiseRule:
      "Un budget n'est contrôlé que sur un scénario dont le plancher de bruit est établi, et un écart sous le plancher n'est pas un changement. Aucun contrôle n'échoue sur du bruit.",

    measurementHeading: 'Mesure',
    measurementLine: '{runs} relevés par scénario · profils {profiles} · médiane ± MAD, jamais une moyenne',
    fingerprintMatched: 'empreinte identique des deux côtés',
    fingerprintDiffers: 'empreintes différentes : la comparaison est signalée, pas silencieuse',
    tableScenario: 'Scénario',
    tableBase: 'Référence',
    tableHead: 'Tête',
    tableDelta: 'Δ',
    tableFloor: 'Plancher',
    tableVerdict: 'Verdict',
    noBaseline: 'pas de référence',
    verdictRegression: 'régression',
    verdictImprovement: 'amélioration',
    verdictNoSig: 'aucun changement significatif',
    verdictIndeterminate: 'historique insuffisant',

    budgetsHeading: 'Budgets',
    tableScopeMetric: 'Portée · métrique',
    tableMeasured: 'Mesuré',
    tableThreshold: 'Seuil',
    tableHeadroom: 'Marge',
    tableStatus: 'Statut',
    relativeMetric: 'Δ vs référence',
    statusLabels: {
      conforme: 'conforme',
      warn: 'alerte',
      breach: 'dépassement',
      non_evalue: 'non évalué',
    },
    notEvaluated: {
      'no-noise-floor': "plancher de bruit pas encore établi, le budget n'est pas actif",
      'metric-not-measured': 'métrique non mesurée sur ce scénario',
      'no-baseline': 'aucune référence à comparer',
      'no-threshold': 'aucun seuil écrit pour cette règle',
    },
    withinNoiseTag: "sur la ligne, à l'intérieur du plancher",
    overriddenTag: 'dérogation',

    attributionHeading: 'Attribution',
    attributionAdvisory: "L'attribution explique un dépassement, elle n'en décide aucun.",
    sourceGrowthLine: 'Fichiers du dépôt que le build candidat alourdit :',
    sourceGrowthItem: '`{path}`, lignes {first} à {last} : {bytes}',
    sourceGrowthCaveat:
      "Les lignes sont celles que le build candidat reprend du fichier. Aucune position n'est comparée entre deux versions d'un fichier.",

    provenanceHeading: 'Provenance',
    provenanceMethodology: 'Méthodologie {version}',
    provenanceModels: 'Modèles : {models}',
    provenanceRun: 'Relevé {run}',
    provenanceLedger: 'Registre {hash} : {url}',
    provenanceConfig: 'Budgets lus dans {file}',
    overrideHowTo:
      "Déroger à ce contrôle demande un motif, qui est enregistré au registre et apparaît dans le rapport d'exécution.",

    annotationWorstOn: '(pire sur {scenario})',
    annotationBreachTitle: 'Budget dépassé',
    annotationWarnTitle: 'Budget en alerte',
    annotationOverriddenTitle: 'Dépassement couvert par une dérogation',
    annotationUndecidedTitle: 'Budget non évalué',
    annotationBody: '{scope} · {metric} : {observed} pour un seuil de {threshold} ({headroom}).',
    annotationOverriddenBody:
      "{scope} · {metric} : {observed} pour un seuil de {threshold}. Dérogation de {by}, motif : {reason}",
    annotationUndecidedBody: '{scope} · {metric} : {reason}',
    annotationSourceTitle: 'Module alourdi',
    annotationSourceBody:
      '{bytes} sur ce fichier, pour {total} dans le build candidat. Le bundle en reprend les lignes {first} à {last}.',
    annotationsOmitted: '{count} annotations non envoyées : la limite est de {limit} par requête.',
  },
  criteria: {
    subtitle: 'Pack {pack} · {criteria} critères · {families} familles · évaluation épinglée à cette version du pack',
    summary: {
      conforme: 'CONFORME',
      partiel: 'PARTIEL',
      nonConf: 'NON CONF.',
      na: 'N/A',
      taux: 'TAUX ({done}/{total})',
    },
    tiers: {
      automatedDesc: 'Vérifiable par la machine. Réévalué à chaque relevé.',
      assistedDesc: 'Preuves collectées, réponse proposée, confirmation humaine.',
      declarativeDesc: 'Attestation humaine, artefact et responsable désigné requis.',
      proposed: 'PROPOSÉ',
      answeredBy: '{answered} sur {total} répondus',
    },
    // le référentiel propose une répartition par niveau, il ne la valide pas.
    // c'est tout l'objet de la répartition : une réponse écrite par une
    // personne n'est pas une réponse automatique.
    signOff: {
      title: 'Répartition par niveau non validée',
      body:
        'Le référentiel {pack} propose {automated} automatisés, {assisted} assistés et {declarative} déclaratifs. Tant que cette répartition n\'est pas validée, aucun critère n\'est répondu par la mesure, et {withEvaluation} critère sur {criteria} porte une règle d\'évaluation que ce moteur sait exécuter.',
      sourceMeasured: '{count} répondus par la mesure',
      sourceAttested: '{count} attestés par une personne nommée',
      sourceUnevaluated: '{count} non examinés',
    },
    filter: {
      tier: 'TIER',
      all: 'Tous {count}',
      automated: 'Automatisé {count}',
      assisted: 'Assisté {count}',
      declarative: 'Déclaratif {count}',
      shown: '{count} affichés',
    },
    headers: {
      id: 'ID',
      criterion: 'CRITÈRE',
      family: 'FAMILLE',
      tier: 'TIER',
      status: 'STATUT',
      evidence: 'PREUVE',
      verified: 'VÉRIFIÉ',
    },
    statuses: {
      conforme: 'Conforme',
      partiellement: 'Partiellement',
      nonConforme: 'Non conforme',
      nonEvalue: 'Non évalué',
      nonApplicable: 'Non applicable',
    },
    footnote:
      "Tous les critères du référentiel, dans son ordre. Tout ce qui n'est pas conforme exige un texte de justification avant publication de la déclaration.",
    attestedOn: '{who} · {date}',
    notLookedAt: 'non examiné',
  },
  declaration: {
    blockingReasons: {
      'missing-justification': 'Statut sans texte de justification',
      'unassessed-criterion': 'Critère non évalué',
      'unconfirmed-proposal': 'Réponse proposée en attente de confirmation',
      'missing-evidence': 'Preuve requise non jointe',
    },
    subtitle: 'Brouillon {draft} · dernière publication {published} le {publishedDate} · prochaine revue le {reviewDate}',
    diffVs: 'Diff vs {version}',
    previewPage: 'Prévisualiser la page',
    publishBlocked: 'Publier · bloqué',
    blockingTitle: 'BLOQUANT · {count}',
    knownGapsTitle: 'ÉCARTS CONNUS · SECTION REQUISE',
    knownGapsNote:
      "Le gabarit interdit de publier une section d'écarts vide. Une déclaration affichant 100% de conformité se lit comme non vérifiée.",
    versionHistoryTitle: 'HISTORIQUE DES VERSIONS',
    draftTag: 'BROUILLON',
    conformeCount: '{count} conforme',
    ledgerRef: 'registre {hash}',
    livePreviewTitle: 'APERÇU EN DIRECT · PAGE PUBLIÉE',
    footerBadge: 'BADGE DE PIED DE PAGE · accessible depuis chaque page',
    preview: {
      heading: "Déclaration d'écoconception",
      meta: '{service} · établie le {date} · référentiel {referential}',
      taux: 'TAUX DE CONFORMITÉ',
      conformes: 'CRITÈRES CONFORMES',
      nonConformes: 'NON CONFORMES',
      familyTitle: 'CONFORMITÉ PAR FAMILLE',
      hosting:
        "Hébergement : {host} · électricité d'origine renouvelable vérifiée le {date}. Mesures produites par la méthodologie Balise {version}, vérifiables à l'adresse",
      badgeName: 'Écoconception',
    },
  },
  tender: {
    remiseDesOffres: 'REMISE DES OFFRES',
    daysVia: '{days} jours · via {platform}',
    stepDone: 'FAIT',
    stepCurrent: 'EN COURS',
    steps: {
      reference: 'Référence du marché',
      scope: 'Périmètre & scénarios',
      commitments: 'Engagements',
      narrative: 'Mémoire',
      export: 'Export',
    },
    commitmentsTitle: 'ENGAGEMENTS PROPOSÉS · TIRÉS DE LA BASE MESURÉE',
    commitmentsCaption:
      'Les seuils sont vos valeurs mesurées plus une marge déclarée : chaque engagement est atteignable le jour de la signature.',
    headers: {
      commitment: 'ENGAGEMENT',
      measured: 'MESURÉ',
      proposed: 'PROPOSÉ',
      margin: 'MARGE',
    },
    margins: {
      headroom: '+{pct}% de marge',
      stretch: 'ambitieux · +{points} pt',
      notMet: 'non tenu ce jour',
      process: 'processus',
    },
    warningStrong: 'Part des tiers laissée sans engagement.',
    warningBody:
      "Vous êtes à {points} points du seuil aujourd'hui. S'y engager mettrait le marché en risque dès le premier mois ; le mémoire énonce plutôt un plan de remédiation avec un jalon daté.",
    historyTitle: 'HISTORIQUE MESURÉ · LA PART QUE PERSONNE NE PEUT SIMULER',
    historySince: 'Mesure continue depuis le',
    historyCounts: '{days} jours, {runs} relevés, {versions} versions de déclaration publiées.',
    conformityRate: 'taux de conformité · {from}% → {to}%',
    historyCaption:
      'Un concurrent qui soumissionne peut promettre les mêmes chiffres. Il ne peut pas produire cette courbe.',
    outputTitle: 'SORTIE',
    outputKeys: {
      branding: 'habillage',
      format: 'format',
      figures: 'figures',
      verification: 'vérification',
      editable: 'modifiable',
    },
    outputFormat: 'PDF/A-3 · Typst · {pages} pages',
    outputFigures: '{count} bandes de tolérance, sûres en niveaux de gris',
    outputEditable: 'oui · avant export',
    openAnnex: "Ouvrir l'annexe",
  },
  contract: {
    noHistory: 'pas d\'historique',
    earlyWarning: {
      rate: 'La conformité est à {current}%, pour une cible de {target}% à la revue des {months} mois.',
      ceiling:
        'Répondre aux {unanswered} critères que personne n\'a examinés, tous conformes, mène à {ceiling}%.',
      short:
        'La cible demande {needed} conformes sur {applicable}, soit {short} de plus que ce que peut donner la réponse aux critères ouverts. Cet écart se trouve dans les critères répondus et non conformes.',
      reached: 'La cible reste atteignable en répondant aux critères ouverts.',
      noExtrapolation: "Aucune tendance n'en est tirée : une évolution de la conformité demande un historique que le registre ne porte pas encore.",
    },
    subtitle: 'Marché {ref} · notifié {date} · {months} mois · clause environnementale art. {article}',
    generateReport: 'Générer le rapport {quarter}',
    headers: {
      engagement: 'ENGAGEMENT CONTRACTUEL',
      seuil: 'SEUIL',
      actuel: 'ACTUEL',
      headroom: 'MARGE',
      trend: 'TENDANCE 90 J',
      status: 'STATUT',
    },
    statuses: {
      tenu: 'TENU',
      atRisk: 'EN RISQUE',
      aJour: 'À JOUR',
    },
    ptToGo: '{points} pt restants',
    earlyWarningTitle: 'ALERTE PRÉCOCE',
    openCriteria: 'Ouvrir les {count} critères',
    calendarTitle: 'CALENDRIER DU MARCHÉ',
    daysShort: '{days} j',
  },
  fleet: {
    subtitle:
      "{agency} · {services} services sous mesure · {contracts} contrats actifs · {tenders} appel d'offres ouvert",
    summary: {
      breaches: 'DÉPASSEMENTS',
      staleDecl: 'DÉCL. PÉRIMÉES',
      deadlines: 'ÉCHÉANCES 30 J',
    },
    headers: {
      service: 'SERVICE',
      carbonVisit: 'CARBONE / VISITE',
      conf: 'CONF.',
      rgesn: 'RGESN',
      declaration: 'DÉCLARATION',
      contract: 'CONTRAT',
      alert: 'ALERTE',
    },
    benchmarkTitle: 'RÉFÉRENTIEL SECTORIEL · ANONYMISÉ · MÉTROPOLES & EPCI',
    benchmarkCaption:
      "n={n} services mesurés. Votre client se situe dans les meilleurs {pct}%. Citable dans l'annexe avec la taille d'échantillon indiquée.",
    medianLabel: 'médiane {value}',
    clientAccessTitle: 'ACCÈS CLIENT',
    clientAccessBody:
      'Chaque client ne voit que son propre service, sous votre habillage, avec votre commentaire. Aucune donnée inter-clients, aucun chrome Balise.',
    viewerService: 'lecteur · {count} service',
    invitationsPending: '{count} invitations en attente',
  },
  docs: {
    register: 'Registre des documents',
    publishedPage: 'page publiée',
    backToEditor: "Retour à l'éditeur",
    backToWorkspace: "Retour à l'espace",
    backToTracker: 'Retour au suivi',
    exportPdf: 'Exporter en PDF/A-3',
    anchorSend: 'Ancrer & envoyer',
    draft: 'brouillon {version}',
  },
  docDeclaration: {
    justificationMissing: "Aucun texte de justification. La déclaration ne peut pas être publiée en l'état.",
    intro1: "Cette déclaration s'applique au",
    intro2:
      "({domain}). Elle est établie au regard du référentiel général d'écoconception de services numériques, version 2 (2024), et sera revue au plus tard le {reviewDate}.",
    stats: {
      taux: 'TAUX DE CONFORMITÉ',
      tauxSub: '{conformes} conformes / {applicables} applicables',
      partiels: 'PARTIELLEMENT CONFORMES',
      partielsSub: 'justification fournie',
      nonConformes: 'NON CONFORMES',
      nonConformesSub: 'détaillés ci-dessous',
    },
    nonConformesTitle: 'Critères non conformes',
    headers: { id: 'N°', criterion: 'CRITÈRE', justification: 'JUSTIFICATION' },
    hostingTitle: 'Hébergement et mesure',
    hostingBody:
      "Hébergement Scaleway, centre de données DC5 (Paris). Électricité d'origine renouvelable vérifiée auprès du jeu de données Green Web Foundation le {verifiedDate}. Les indicateurs sont mesurés en continu depuis le {since} selon la méthodologie Balise {methodology}, publiée et versionnée. Chaque relevé est horodaté et chaîné : l'ensemble est vérifiable sans compte à l'adresse ci-dessous.",
    hashLabel: 'EMPREINTE DE CETTE VERSION',
    verificationLabel: 'VÉRIFICATION PUBLIQUE',
    footer:
      'Déclaration établie le {date} par la Direction du numérique · contact {contact} · version 3, remplaçant la version 2 du 12 mars 2026.',
  },
  docAnnexe: {
    memoire: 'MÉMOIRE TECHNIQUE',
    annexeLine: 'ANNEXE 4 · ENVIRONNEMENT',
    consultation: 'CONSULTATION {ref}',
    title: 'Performance environnementale du service',
    lede:
      "{title} · {organisation}. Mesures continues, méthodologie publiée, engagements chiffrés et vérifiables par l'acheteur.",
    stats: {
      since: 'MESURE CONTINUE DEPUIS',
      runs: 'RELEVÉS HORODATÉS',
      conformity: 'CONFORMITÉ RGESN',
      commitments: 'ENGAGEMENTS CHIFFRÉS',
    },
    docHashLabel: 'EMPREINTE DU DOCUMENT',
    runningRight: 'ANNEXE 4 · {page}/{pages}',
    section2Title: '2. État mesuré du service existant',
    section2Body:
      "Les valeurs ci-dessous sont les médianes de cinq exécutions par scénario, réalisées sur un navigateur épinglé et un profil de bridage documenté. Chaque estimation carbone est présentée sous forme d'étendue inter-modèles, le modèle de référence étant indiqué. Aucune valeur n'est lissée.",
    figLabel: "FIG. 3 · EMPREINTE ESTIMÉE PAR VISITE · PAGE D'ACCUEIL",
    // filled from the models that actually ran. a caption naming a model the
    // build does not carry is the kind of thing an auditor checks first.
    figCaption:
      'Hachures : étendue inter-modèles ({band}). Pointillé : plancher de bruit du scénario, ±{floor} d\'octets transférés, porté dans le modèle. Trait plein : médiane, modèle de référence {reference}.',
    figCaptionAside:
      "Hors bande, {model} publie {headline} et {value} gCO2e pour la même page : sa valeur est lue sur une note et non calculée à partir de l'énergie du transfert.",
    headers: { indicator: 'INDICATEUR', median: 'MÉDIANE', mad: 'MAD', confidence: 'CONFIANCE' },
    confHigh: 'Élevée',
    confMedium: 'Moyenne △',
    ecartsStrong: 'Écarts connus.',
    hashLabel: 'EMPREINTE',
  },
  docRapport: {
    marcheRef: 'marché {ref}',
    holder: 'titulaire du marché {ref}',
    headRight1: "RAPPORT D'EXÉCUTION · {quarter}",
    headRight2: 'PÉRIODE {period}',
    headRight3: 'CLAUSE ENVIRONNEMENTALE ART. {article}',
    title: 'Suivi des engagements environnementaux',
    intro:
      'Établi à partir de {runs} relevés horodatés sur la période. Les valeurs sont des médianes de cinq exécutions ; les écarts inférieurs au plancher de bruit sont déclarés sans évolution significative.',
    headers: { engagement: 'ENGAGEMENT', seuil: 'SEUIL', t3: 'T3', marge: 'MARGE', etat: 'ÉTAT' },
    etats: { tenu: 'TENU', enCours: 'EN COURS', nonTenu: 'NON TENU' },
    eventsTitle: 'Événements de la période',
    calloutStrong: 'Engagement non tenu : part des tiers.',
    hashLabel: 'EMPREINTE DU RAPPORT',
  },
  // the public surfaces are french public pages, like the three documents:
  // their content renders in french in every locale. only the app chrome
  // around them (nav rail labels) follows the interface locale.
  // ---------------------------------------------------------------------------
  // findings: what a capture shows about itself
  // ---------------------------------------------------------------------------
  //
  // every sentence here is filled from a quantity @balise/measure-core read off
  // the capture. none of them states a saving. the three these replaced said
  // "quatre images en PNG non redimensionnées, -214 KB" and "deux familles de
  // polices, six graisses, aucune sous-classée, -96 KB": a capture holds
  // neither a format decision, nor a rendered size, nor what another format
  // would have weighed.
  findings: {
    title: '{count} points d\'attention',
    titleOne: '1 point d\'attention',
    none: 'Aucun point d\'attention au-dessus des seuils publiés.',
    note: 'Chaque ligne est une quantité relevée sur cette page. Aucune économie n\'est projetée.',
    sentences: {
      'image-weight': 'Images : {count} requêtes, {share} du poids de la page.',
      'font-weight': 'Polices : {count} fichiers, {share} du poids de la page.',
      'third-party-weight': 'Tiers : {count} origines distinctes, {share} du poids de la page.',
      'heaviest-resource': 'Une seule réponse pèse {share} du poids de la page.',
      'unused-script-bytes':
        'Scripts : {share} des octets décodés mesurés n\'ont pas été exécutés pendant le chargement.',
      'unused-stylesheet-bytes':
        'Feuilles de style : {share} des octets décodés mesurés n\'ont pas été appliqués pendant le chargement.',
      'reference-dom-node-count':
        'Nœuds DOM : au-delà de {percentile} des pages de la distribution de référence publiée par EcoIndex.',
      'reference-request-count':
        'Requêtes : au-delà de {percentile} des pages de la distribution de référence publiée par EcoIndex.',
      'reference-transferred-bytes':
        'Poids de page : au-delà de {percentile} des pages de la distribution de référence publiée par EcoIndex.',
    },
    unavailable: '{count} fichiers sans mesure de couverture ne sont pas comptés dans ce total.',
    withheldTitle: 'Non mesuré sur ce relevé',
    withheld: {
      'unused-script-bytes':
        'Octets de script non exécutés : couverture non instrumentée, {count} fichiers. Elle déplace le temps d\'exécution et n\'est pas active par défaut.',
      'unused-stylesheet-bytes':
        'Octets de style non appliqués : couverture non instrumentée, {count} fichiers.',
      'image-weight': 'Images : non mesurées sur ce relevé.',
      'font-weight': 'Polices : non mesurées sur ce relevé.',
      'third-party-weight': 'Tiers : non mesurés sur ce relevé.',
      'heaviest-resource': 'Réponse la plus lourde : non mesurée sur ce relevé.',
      'reference-dom-node-count': 'Nœuds DOM : aucune position de référence.',
      'reference-request-count': 'Requêtes : aucune position de référence.',
      'reference-transferred-bytes': 'Poids de page : aucune position de référence.',
    },
  },
  publicScan: {
    navObservatory: 'Observatoire',
    navMethodology: 'Méthodologie',
    navPricing: 'Tarifs',
    title: 'Mesurez une page. Sans compte.',
    // the lede has to describe what this surface actually does. it measured one
    // cold pass, so it does not promise five, and the model count is filled
    // from the models that ran rather than typed.
    lede:
      "Un relevé à froid, {count} modèles d'estimation, méthodologie publiée. Le résultat indique aussi si le service publie une déclaration d'écoconception.",
    fieldLabel: 'Adresse du service à mesurer',
    submit: 'Mesurer',
    gradeLabel: 'ECOINDEX',
    gradeScore: '{score}/100',
    bandLabel: 'EMPREINTE PAR VISITE · ÉTENDUE INTER-MODÈLES',
    confidenceNote: 'CONFIANCE {grade}',
    // the grade word, in french on both catalogs like the rest of this
    // surface. `t.confidence` is interface vocabulary and would print
    // english here the moment the app locale changed.
    confidenceGrade: { high: 'ÉLEVÉE', medium: 'MOYENNE', low: 'FAIBLE' },
    // the public surfaces are french in both locales.
    provenance: 'médiane {model} · étendue sur {count} modèles · réseau {grid} gCO2e/kWh ({zone})',
    provenanceNoFloor: 'un seul relevé à froid : aucun plancher de bruit établi, aucune tendance affichée',
    declarationTitle: "Déclaration d'écoconception",
    declarationNone: 'Aucune déclaration trouvée',
    declarationBody:
      "Ce service relève d'un EPCI de plus de 50 000 habitants : la publication d'une déclaration est attendue. Nous avons cherché aux emplacements usuels et dans le pied de page.",
    follow: 'Suivre ce service en continu',
    captionBefore: 'Mesure unique, cache froid, profil ',
    captionAfter:
      ", une seule page. Un suivi continu produit des médianes sur cinq exécutions, un plancher de bruit propre au service et un historique horodaté : ce qu'une mesure ponctuelle ne peut pas fournir.",
    noRecordTitle: 'Aucune mesure prise pour ce domaine',
    noRecordBody:
      "Cette page affiche les relevés déjà enregistrés. Elle ne déclenche pas de mesure en direct et n'estime rien à partir d'un nom de domaine.",
    noRecordAction: 'Voir un service mesuré',
  },
  observatory: {
    path: '/observatoire',
    navScan: 'Mesurer une page',
    navMethodology: 'Méthodologie',
    title: 'Observatoire des services numériques publics',
    introBefore:
      '{count} services mesurés en continu · relevés du {date} · registre public, mis à jour chaque semaine. Les valeurs sont des médianes de cinq exécutions sur profil ',
    introAfter: ', cache froid. Méthodologie identique pour tous.',
    filtersLabel: 'FILTRES',
    sectors: {
      epci: 'Métropoles & EPCI',
      communes: 'Communes',
      etat: 'État',
      sante: 'Santé',
      transport: 'Transport',
    },
    withoutDeclaration: 'Sans déclaration · {count}',
    headers: {
      rank: '#',
      service: 'SERVICE',
      organisme: 'ORGANISME',
      footprint: 'EMPREINTE / VISITE',
      grade: 'NOTE',
      kb: 'KB',
      trend: 'TEND. 90J',
      declaration: 'DÉCLARATION',
      agency: 'AGENCE',
    },
    trendNa: 'n/a',
    declarationNone: 'aucune',
    noAgency: '–',
    footer:
      'Extrait de {total} entrées · classement par empreinte croissante · chaque ligne a un permalien et un historique public.',
    footerModel:
      'Bandes : étendue inter-modèles sur {models} modèles, médiane au modèle de référence {model}. Méthodologie {methodology}.',
    filteredFooter: '{shown} entrées de cet extrait correspondent au filtre.',
    emptyTitle: 'Aucune entrée de cet extrait ne correspond',
    emptyBody:
      "L'extrait public compte {shown} lignes sur {total} entrées mesurées. Retirez le filtre pour voir l'extrait complet.",
    emptyAction: 'Retirer le filtre',
  },
  ledger: {
    chrome: '/v/{hash} · vérification publique · aucun compte requis',
    eyebrow: 'ENREGISTREMENT VÉRIFIÉ',
    intact: 'Chaîne intacte',
    checkedNow: "contrôlé à l'instant",
    checkedCount: '{count} entrées vérifiées',
    positionValue: 'entrée {position}',
    merkleValue: 'racine {root} sur {leaves} entrées · ancrée le 15/08/2026 04:00 UTC',
    keys: {
      hash: 'EMPREINTE',
      type: 'TYPE',
      recordedAt: 'ENREGISTRÉ LE',
      service: 'SERVICE',
      methodology: 'MÉTHODOLOGIE',
      models: 'MODÈLES',
      fingerprint: 'EMPREINTE ENV.',
      position: 'POSITION',
      merkle: 'RACINE MERKLE',
    },
    appendOnly:
      "Cet enregistrement est en lecture seule. Une correction ne remplace jamais une entrée : elle est ajoutée à la suite, avec son motif. Les mesures déclarées pour une période donnée ne peuvent donc pas être réécrites après coup.",
    recordedValues:
      'Valeurs consignées : {transferred} KB transférés (MAD {mad}), {requests} requêtes, {dom} nœuds DOM, {carbon} gCO₂e par visite selon {model} · étendue inter-modèles {low} à {high}. Confiance élevée, cinq exécutions.',
    notFoundEyebrow: 'EMPREINTE INCONNUE',
    notFoundTitle: 'Aucune entrée pour cette empreinte',
    notFoundBody:
      "Cette empreinte ne correspond à aucune entrée du registre public. Chaque document généré reproduit son empreinte intégrale en pied de page : vérifiez la valeur relevée, y compris ses derniers caractères.",
    notFoundQueried: 'EMPREINTE RECHERCHÉE',
    notFoundAction: 'Voir un enregistrement vérifié',
  },
  placeholder: {
    eyebrow: 'PRÉVU',
    body: "Prévu pour la {version}. Rien ne s'affiche ici tant que ce ne peut pas être mesuré ; des chiffres inventés ruineraient l'exercice.",
    reference: 'La référence de design de cette surface est finale.',
  },
};
