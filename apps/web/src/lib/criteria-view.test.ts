import { describe, expect, it } from 'vitest';
import { criteriaCanon } from '../fixtures/criteria-canon';
import {
  attestedText,
  blockingRows,
  conformityPct,
  evidenceText,
  familyBars,
  nonConformeRows,
  pendingDeclarative,
  rowsForTier,
  signOffNotice,
  sourceLine,
  statusLabel,
  tierCards,
  tierShort,
} from './criteria-view';

describe('the tier cards', () => {
  it('report answers against what the pack proposes at each tier', () => {
    const cards = tierCards();
    expect(cards.map((card) => card.tier)).toEqual(['automated', 'assisted', 'declarative']);
    expect(cards.find((card) => card.tier === 'declarative')?.total).toBe(47);
    for (const card of cards) expect(card.answered).toBeLessThanOrEqual(card.total);
  });

  it('counts the declarative criteria still without an answer', () => {
    const declarative = tierCards().find((card) => card.tier === 'declarative')!;
    expect(pendingDeclarative()).toBe(declarative.total - declarative.answered);
  });
});

describe('the sign-off notice', () => {
  it('states the proposal, and that nothing is answered from measurement', () => {
    const notice = signOffNotice();
    expect(notice).not.toBeNull();
    expect(notice!.body).toContain('9');
    expect(notice!.body).toContain('47');
    expect(sourceLine()).toContain('0 answered from measurement');
  });

  it('says how many answers a person put their name to', () => {
    expect(sourceLine()).toContain(`${criteriaCanon.bySource.attested} attested`);
  });
});

describe('the rows', () => {
  it('filters by tier without changing the pack order', () => {
    const all = rowsForTier('all');
    expect(all).toHaveLength(78);
    const automated = rowsForTier('automated');
    expect(automated).toHaveLength(9);
    expect(automated.every((row) => row.tier === 'automated')).toBe(true);
  });

  it('prefers the reviewer justification over the engine sentence', () => {
    const justified = criteriaCanon.rows.find((row) => row.justification !== null)!;
    expect(evidenceText(justified)).toBe(justified.justification);
    const unanswered = criteriaCanon.rows.find((row) => row.status === 'non_evalue')!;
    expect(evidenceText(unanswered)).toBe(unanswered.evidenceFr);
  });

  it('names the person who answered, and says so when nobody did', () => {
    const attested = criteriaCanon.rows.find((row) => row.attestedBy !== null)!;
    expect(attestedText(attested)).toContain(attested.attestedBy);
    const unanswered = criteriaCanon.rows.find((row) => row.status === 'non_evalue')!;
    expect(attestedText(unanswered)).toBe('not looked at');
  });

  it('keeps the official grid vocabulary in french, whatever the interface locale', () => {
    expect(statusLabel('partiellement_conforme')).toBe('Partiellement');
    expect(statusLabel('non_evalue')).toBe('Non évalué');
    expect(tierShort('declarative')).toBe('DECL');
  });
});

describe('the figures the documents share with the screens', () => {
  it('rounds the rate for display only, over applicable criteria', () => {
    expect(conformityPct()).toBe(
      Math.round((criteriaCanon.completion.conforme / criteriaCanon.completion.applicable) * 100),
    );
  });

  it('labels each family bar with conforme over applicable', () => {
    const bars = familyBars();
    expect(bars).toHaveLength(9);
    bars.forEach((bar, index) => {
      const family = criteriaCanon.families[index]!;
      expect(bar.label).toBe(family.applicable === 0 ? 'N/A' : `${family.conforme}/${family.applicable}`);
      expect(bar.ok + bar.warn + bar.bad).toBeLessThanOrEqual(100);
    });
  });

  it('reports a family that is entirely out of scope as such, never as 0/0', () => {
    // algorithmie: the referential asks about model training, and this service
    // trains nothing. an empty bar beside 0/0 would read as a failure.
    const algorithmie = criteriaCanon.families.find((family) => family.id === 'algorithmie')!;
    expect(algorithmie.applicable).toBe(0);
    expect(familyBars().find((bar) => bar.name.endsWith(algorithmie.labelFr))?.label).toBe('N/A');
  });

  it('lists every non conformity the declaration has to print, and only those', () => {
    const rows = nonConformeRows();
    expect(rows).toHaveLength(criteriaCanon.byStatus.non_conforme);
    const ids = new Set<string>(criteriaCanon.rows.filter((row) => row.status === 'non_conforme').map((r) => r.id));
    expect(rows.every((row) => ids.has(row.id))).toBe(true);
  });

  it('quotes the referential rather than a label we wrote', () => {
    for (const row of nonConformeRows()) {
      const criterion = criteriaCanon.rows.find((r) => r.id === row.id)!;
      expect(row.statementFr).toBe(criterion.statementFr);
    }
  });

  it('shows a blocking finding for each thing the engine found', () => {
    expect(blockingRows()).toHaveLength(criteriaCanon.blocking.length);
    expect(blockingRows()[0]!.detailFr).toBe(criteriaCanon.blocking[0]!.detailFr);
  });
});

describe('the surfaces outside the workspace', () => {
  it('gives the fleet and the execution report the rate the declaration prints', () => {
    // one number, four places. the fleet row for the audited service and the
    // rgesn engagement in the report both read this rather than repeat it.
    expect(conformityPct()).toBe(59);
    expect(criteriaCanon.completion.conforme).toBe(41);
    expect(criteriaCanon.completion.applicable).toBe(70);
  });
});
