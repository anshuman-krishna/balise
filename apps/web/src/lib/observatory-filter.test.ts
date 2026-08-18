import { describe, expect, it } from 'vitest';
import { observatoryFixture } from '../fixtures/canon';
import {
  filterObservatory,
  isFiltered,
  NO_FILTER,
  toggleSector,
} from './observatory-filter';

const rows = observatoryFixture.rows;

describe('filterObservatory', () => {
  it('returns the whole extract when nothing is selected', () => {
    expect(filterObservatory(rows, NO_FILTER)).toHaveLength(rows.length);
    expect(isFiltered(NO_FILTER)).toBe(false);
  });

  it('narrows to one sector', () => {
    const communes = filterObservatory(rows, { sector: 'communes', withoutDeclaration: false });
    expect(communes.map((row) => row.domain)).toEqual(['craonnais.fr', 'ville-de-plessac.fr']);
  });

  it('keeps rows whose sector has no chip out of every sector filter', () => {
    const chips = ['epci', 'communes', 'etat', 'sante', 'transport'] as const;
    const reachable = chips.flatMap((sector) =>
      filterObservatory(rows, { sector, withoutDeclaration: false }).map((row) => row.domain),
    );
    expect(reachable).not.toContain('portail-arvor.fr');
  });

  it('narrows to services with no published declaration', () => {
    const none = filterObservatory(rows, { sector: null, withoutDeclaration: true });
    expect(none.map((row) => row.domain)).toEqual(['portail-arvor.fr']);
  });

  it('combines sector and declaration filters', () => {
    const combined = filterObservatory(rows, { sector: 'communes', withoutDeclaration: true });
    expect(combined).toHaveLength(0);
  });
});

describe('toggleSector', () => {
  it('selects, then clears on a second click', () => {
    const selected = toggleSector(NO_FILTER, 'sante');
    expect(selected.sector).toBe('sante');
    expect(isFiltered(selected)).toBe(true);
    expect(toggleSector(selected, 'sante').sector).toBeNull();
  });

  it('replaces one sector with another and leaves the declaration filter alone', () => {
    const start = { sector: 'sante', withoutDeclaration: true } as const;
    const next = toggleSector(start, 'transport');
    expect(next).toEqual({ sector: 'transport', withoutDeclaration: true });
  });
});
