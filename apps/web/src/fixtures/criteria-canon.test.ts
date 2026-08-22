import { describe, expect, it } from 'vitest';
import { BlockingFinding, CriterionAssessment } from '@balise/schemas';
import { evaluate, blockingFindings, completion, isAnswered } from '@balise/criteria-engine';
import { rgesn2024v2 } from '@balise/rule-packs';
import { buildCriteriaCanon } from '../../scripts/criteria-canon-source';
import { criteriaCanon } from './criteria-canon';

// the generated file is data, and data drifts. this answers the whole pack
// again and holds the checked-in copy to it, so a hand edit, a pack change or
// an engine change cannot pass unnoticed.
const canon = buildCriteriaCanon();

describe('the generated criteria canon', () => {
  it('matches what the engine answers from the pack', () => {
    expect(criteriaCanon.assessments).toEqual(canon.assessments);
    expect(criteriaCanon.blocking).toEqual(canon.blocking);
    expect(criteriaCanon.completion).toEqual(canon.completion);
    expect(criteriaCanon.publishable).toBe(canon.publishable);
  });

  it('holds shapes that satisfy the published contracts', () => {
    expect(() => CriterionAssessment.array().parse(criteriaCanon.assessments)).not.toThrow();
    expect(() => BlockingFinding.array().parse(criteriaCanon.blocking)).not.toThrow();
  });

  it('answers every criterion the pack carries, and no others', () => {
    expect(criteriaCanon.rows).toHaveLength(rgesn2024v2.criteria.length);
    expect(criteriaCanon.rows.map((row) => row.id)).toEqual(rgesn2024v2.criteria.map((c) => c.id));
    expect(criteriaCanon.pack.criteriaCount).toBe(78);
    expect(criteriaCanon.pack.familiesCount).toBe(9);
  });
});

describe('the pack gate, on the face of the canon', () => {
  it('answers nothing from measurement while the tier split is a proposal', () => {
    expect(criteriaCanon.pack.tiersSignedOff).toBe(false);
    expect(criteriaCanon.bySource.measured).toBe(0);
    // and the metrics were offered: what stops them counting is the gate.
    expect(Object.keys(canon.evidence.metrics).length).toBeGreaterThan(0);
  });

  it('reports the proposed tier split, which is not a count of answers', () => {
    expect(criteriaCanon.byTier).toEqual({ automated: 9, assisted: 22, declarative: 47 });
    const proposed = Object.values(criteriaCanon.byTier).reduce((a, b) => a + b, 0);
    expect(proposed).toBe(criteriaCanon.pack.criteriaCount);
  });

  it('names how few criteria carry a rule the engine could run', () => {
    expect(criteriaCanon.pack.withEvaluation).toBe(
      rgesn2024v2.criteria.filter((criterion) => criterion.evaluation !== undefined).length,
    );
    expect(criteriaCanon.pack.withEvaluation).toBeLessThan(criteriaCanon.byTier.automated);
  });
});

describe('the counts the screens and the documents share', () => {
  it('splits every criterion into exactly one status', () => {
    const total = Object.values(criteriaCanon.byStatus).reduce((a, b) => a + b, 0);
    expect(total).toBe(criteriaCanon.pack.criteriaCount);
  });

  it('leaves non applicable out of the rate and unanswered criteria in it', () => {
    expect(criteriaCanon.completion.applicable).toBe(
      criteriaCanon.pack.criteriaCount - criteriaCanon.byStatus.non_applicable,
    );
    expect(criteriaCanon.byStatus.non_evalue).toBeGreaterThan(0);
    expect(criteriaCanon.completion.conforme).toBe(criteriaCanon.byStatus.conforme);
  });

  it('counts an answer as answered only when the engine says it is', () => {
    const answered = canon.assessments.filter(isAnswered).length;
    const fromTiers = criteriaCanon.completion.byTier.reduce((total, row) => total + row.answered, 0);
    expect(fromTiers).toBe(answered);
  });

  it('sums each family to the pack, and never past its own applicable count', () => {
    const total = criteriaCanon.families.reduce((sum, family) => sum + family.total, 0);
    expect(total).toBe(criteriaCanon.pack.criteriaCount);
    for (const family of criteriaCanon.families) {
      expect(family.conforme + family.partiel + family.nonConforme + family.nonEvalue).toBe(family.applicable);
    }
  });
});

describe('what stands between the draft and a publication', () => {
  it('refuses to publish, and says exactly why', () => {
    expect(criteriaCanon.publishable).toBe(false);
    expect(criteriaCanon.blocking.length).toBeGreaterThan(0);
  });

  it('reports every criterion nobody looked at', () => {
    const unassessed = criteriaCanon.blocking.filter((f) => f.reason === 'unassessed-criterion');
    expect(unassessed).toHaveLength(criteriaCanon.byStatus.non_evalue);
  });

  it('reports a non conforme answer left without the justification the grid requires', () => {
    const missing = criteriaCanon.blocking.filter((f) => f.reason === 'missing-justification');
    expect(missing.length).toBeGreaterThan(0);
    for (const finding of missing) {
      const row = criteriaCanon.rows.find((r) => r.id === finding.criterionId);
      expect(row?.justification).toBeNull();
      expect(row?.status).not.toBe('conforme');
    }
  });

  it('would find nothing once the gaps are answered', () => {
    // the same engine over the same pack, with every gap filled: the blocking
    // list is a function of the answers, not a fixed warning on the screen.
    const filled = evaluate(rgesn2024v2, {
      metrics: {},
      attestations: Object.fromEntries(
        rgesn2024v2.criteria.map((criterion) => [
          criterion.id,
          {
            status: 'conforme' as const,
            attestedBy: 'm. carbonne',
            attestedAt: '2026-08-15T09:00:00.000Z',
            evidenceRefs: [],
          },
        ]),
      ),
    });
    expect(blockingFindings(rgesn2024v2, filled)).toEqual([]);
    expect(completion(filled).conforme).toBe(rgesn2024v2.criteria.length);
  });
});

// a published declaration is the assessment state on the day it was
// established. its conformity count is therefore a fact about that day, and
// the only way to keep it one is to answer the pack again with that day's
// evidence.
describe('the declaration versions', () => {
  const versions = criteriaCanon.versions;

  it('holds the three the register holds', () => {
    expect(versions.map((version) => version.tag)).toEqual(['v1', 'v2', 'v3']);
    expect(versions.filter((version) => version.draft)).toHaveLength(1);
    expect(versions.at(-1)!.draft).toBe(true);
  });

  it('answers every version against the evidence it could have held', () => {
    for (const version of versions) {
      const asOf = evaluate(rgesn2024v2, {
        metrics: {},
        attestations: Object.fromEntries(
          criteriaCanon.rows
            .filter((row) => row.attestedAt !== null && row.attestedAt <= version.establishedAt)
            .map((row) => [
              row.id,
              {
                status: row.status,
                ...(row.justification === null ? {} : { justification: row.justification }),
                attestedBy: row.attestedBy!,
                attestedAt: row.attestedAt!,
                evidenceRefs: [],
              },
            ]),
        ),
      });
      expect(asOf.filter((assessment) => assessment.status === 'conforme')).toHaveLength(version.conforme);
    }
  });

  // the point of the whole exercise: an answer cannot be in a version that was
  // published before it was recorded.
  it('holds no answer recorded after the version was established', () => {
    for (const version of versions) {
      const later = criteriaCanon.rows.filter(
        (row) => row.attestedAt !== null && row.attestedAt > version.establishedAt,
      );
      expect(version.answered).toBe(criteriaCanon.rows.length - later.length - unanswered());
    }
  });

  it('never loses a conforming criterion between versions', () => {
    const counts = versions.map((version) => version.conforme);
    expect([...counts].sort((a, b) => a - b)).toEqual(counts);
  });
});

function unanswered(): number {
  return criteriaCanon.rows.filter((row) => row.attestedAt === null).length;
}
