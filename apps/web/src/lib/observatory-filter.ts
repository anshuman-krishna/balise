import type { CorpusRow, Sector } from './corpus-view';

export interface ObservatoryFilter {
  sector: Sector | null;
  withoutDeclaration: boolean;
}

export const NO_FILTER: ObservatoryFilter = { sector: null, withoutDeclaration: false };

export function isFiltered(filter: ObservatoryFilter): boolean {
  return filter.sector !== null || filter.withoutDeclaration;
}

/**
 * the index holds the corpus that was measured, so a filter narrows what is
 * shown and the total it is narrowed from is a real count. the sector chips
 * are a partial set: a row whose sector has no chip stays visible unfiltered.
 */
export function filterObservatory(
  rows: readonly CorpusRow[],
  filter: ObservatoryFilter,
): readonly CorpusRow[] {
  return rows.filter((row) => {
    if (filter.sector !== null && row.sector !== filter.sector) {
      return false;
    }
    if (filter.withoutDeclaration && row.declaration.state !== 'none') {
      return false;
    }
    return true;
  });
}

/** clicking the active chip clears it, so the whole index is always reachable. */
export function toggleSector(filter: ObservatoryFilter, sector: Sector): ObservatoryFilter {
  return { ...filter, sector: filter.sector === sector ? null : sector };
}
