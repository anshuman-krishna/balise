import {
  MetricThresholdEvaluation,
  type ComparisonOperator,
  type Criterion,
  type CriterionAssessment,
  type CriterionEvidence,
  type RulePack,
} from '@balise/schemas';

function compare(actual: number, operator: ComparisonOperator, expected: number): boolean {
  switch (operator) {
    case 'lte':
      return actual <= expected;
    case 'lt':
      return actual < expected;
    case 'gte':
      return actual >= expected;
    case 'gt':
      return actual > expected;
    case 'eq':
      return actual === expected;
  }
}

function attestedAssessment(
  pack: RulePack,
  criterion: Criterion,
  evidence: CriterionEvidence,
): CriterionAssessment | undefined {
  const attestation = evidence.attestations[criterion.id];
  if (attestation === undefined) {
    return undefined;
  }
  return {
    criterionId: criterion.id,
    packId: pack.id,
    packVersion: pack.version,
    tier: criterion.tier,
    status: attestation.status,
    source: 'attested',
    evidenceFr: `Attesté par ${attestation.attestedBy}.`,
    ...(attestation.justification === undefined ? {} : { justification: attestation.justification }),
    attestedBy: attestation.attestedBy,
    attestedAt: attestation.attestedAt,
    requiresConfirmation: false,
  };
}

function unevaluated(
  pack: RulePack,
  criterion: Criterion,
  evidenceFr: string,
): CriterionAssessment {
  return {
    criterionId: criterion.id,
    packId: pack.id,
    packVersion: pack.version,
    tier: criterion.tier,
    status: 'non_evalue',
    source: 'unevaluated',
    evidenceFr,
    requiresConfirmation: false,
  };
}

/**
 * answers one criterion.
 *
 * a human attestation always wins: it is the answer a named person put their
 * name to, and the engine does not overrule it.
 *
 * without one, only an automated or assisted criterion carrying an evaluation
 * this engine understands can be answered at all, and an assisted answer is a
 * proposal that does not count until a person confirms it. everything else is
 * `non_evalue`, which is the absence of an answer and never a failure.
 */
export function evaluateCriterion(
  pack: RulePack,
  criterion: Criterion,
  evidence: CriterionEvidence,
): CriterionAssessment {
  const attested = attestedAssessment(pack, criterion, evidence);
  if (attested !== undefined) {
    return attested;
  }

  if (!pack.tiersSignedOff) {
    // the tiers in this pack are a proposal nobody has accepted yet, so
    // nothing may be answered automatically on the strength of them
    return unevaluated(
      pack,
      criterion,
      `Répartition par niveau non validée pour le référentiel ${pack.id}@${pack.version} : attestation humaine requise.`,
    );
  }
  if (criterion.tier === 'declarative') {
    return unevaluated(pack, criterion, 'Attestation humaine requise, non fournie.');
  }
  if (criterion.evaluation === undefined) {
    return unevaluated(pack, criterion, "Aucune règle d'évaluation dans le référentiel.");
  }

  const rule = MetricThresholdEvaluation.safeParse(criterion.evaluation);
  if (!rule.success) {
    return unevaluated(
      pack,
      criterion,
      `Type d'évaluation "${String(criterion.evaluation.type)}" non pris en charge par ce moteur.`,
    );
  }

  const measured = evidence.metrics[rule.data.metric];
  if (measured === undefined) {
    return unevaluated(pack, criterion, `Indicateur ${rule.data.metric} non mesuré.`);
  }

  const passes = compare(measured, rule.data.operator, rule.data.value);
  return {
    criterionId: criterion.id,
    packId: pack.id,
    packVersion: pack.version,
    tier: criterion.tier,
    status: passes ? 'conforme' : 'non_conforme',
    source: 'measured',
    evidenceFr: `${rule.data.metric} = ${measured}, seuil ${rule.data.operator} ${rule.data.value}.`,
    // an assisted answer is proposed, never counted, until a person confirms it
    requiresConfirmation: criterion.tier === 'assisted',
  };
}

/** answers every criterion in the pack, in pack order. */
export function evaluate(pack: RulePack, evidence: CriterionEvidence): CriterionAssessment[] {
  return pack.criteria.map((criterion) => evaluateCriterion(pack, criterion, evidence));
}
