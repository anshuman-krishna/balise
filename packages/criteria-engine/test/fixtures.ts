import type { CriterionId, RulePack } from '@balise/schemas';

const id = (value: string) => value as CriterionId;

/**
 * a fixture pack shaped like an ecodesign referential. the statements are
 * placeholders: a real pack carries the official text verbatim, and this
 * engine is not the place to invent it.
 */
export const ecoPack: RulePack = {
  id: 'fixture-eco',
  version: '2024.1',
  locale: 'fr',
  source: 'fixture',
  families: [
    { id: 'architecture', labelFr: 'Architecture' },
    { id: 'contenus', labelFr: 'Contenus' },
    { id: 'strategie', labelFr: 'Stratégie' },
  ],
  criteria: [
    {
      id: id('3.1'),
      family: 'architecture',
      tier: 'automated',
      statementFr: 'Critère de fixture 3.1',
      evaluation: { type: 'metric_threshold', metric: 'request_count', operator: 'lte', value: 90 },
      evidenceRequired: [],
    },
    {
      id: id('3.2'),
      family: 'architecture',
      tier: 'automated',
      statementFr: 'Critère de fixture 3.2',
      evaluation: { type: 'metric_threshold', metric: 'dom_node_count', operator: 'lte', value: 1000 },
      evidenceRequired: [],
    },
    {
      id: id('3.3'),
      family: 'architecture',
      tier: 'automated',
      statementFr: 'Critère de fixture 3.3, non mesurable ici',
      evaluation: { type: 'metric_threshold', metric: 'js_execution_ms', operator: 'lte', value: 500 },
      evidenceRequired: [],
    },
    {
      id: id('5.2'),
      family: 'contenus',
      tier: 'assisted',
      statementFr: 'Critère de fixture 5.2',
      evaluation: {
        type: 'metric_threshold',
        metric: 'third_party_share_pct',
        operator: 'lte',
        value: 30,
      },
      evidenceRequired: [],
    },
    {
      id: id('5.9'),
      family: 'contenus',
      tier: 'automated',
      statementFr: 'Critère de fixture 5.9, règle inconnue du moteur',
      evaluation: { type: 'static_analysis', rule: 'autoplay' },
      evidenceRequired: [],
    },
    {
      id: id('1.2'),
      family: 'strategie',
      tier: 'declarative',
      statementFr: 'Critère de fixture 1.2',
      evidenceRequired: [
        { kind: 'document', labelFr: 'Politique éditoriale' },
        { kind: 'attestation', labelFr: 'Responsable désigné' },
      ],
    },
    {
      id: id('1.3'),
      family: 'strategie',
      tier: 'declarative',
      statementFr: 'Critère de fixture 1.3',
      evidenceRequired: [],
    },
  ],
};

/**
 * a second referential with a different vocabulary and no metric evaluations
 * at all. the engine must handle it without knowing anything about it, which
 * is what makes the accessibility pack a new pack rather than a rewrite.
 */
export const accessPack: RulePack = {
  id: 'fixture-access',
  version: '4.1',
  locale: 'fr',
  source: 'fixture',
  families: [{ id: 'images', labelFr: 'Images' }],
  criteria: [
    {
      id: id('1.1.1'),
      family: 'images',
      tier: 'assisted',
      statementFr: "Critère d'accessibilité de fixture 1.1.1",
      evaluation: { type: 'dom_query', selector: 'img:not([alt])' },
      evidenceRequired: [],
    },
    {
      id: id('1.1.2'),
      family: 'images',
      tier: 'declarative',
      statementFr: "Critère d'accessibilité de fixture 1.1.2",
      evidenceRequired: [],
    },
  ],
};
