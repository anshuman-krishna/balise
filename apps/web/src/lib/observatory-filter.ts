import type { ObservatoryRow, ObservatorySector } from '../fixtures/canon';

export interface ObservatoryFilter {
  sector: ObservatorySector | null;
  withoutDeclaration: boolean;
}

export const NO_FILTER: ObservatoryFilter = { sector: null, withoutDeclaration: false };

export function isFiltered(filter: ObservatoryFilter): boolean {
  return filter.sector !== null || filter.withoutDeclaration;
}

/**
 * the public index is an extract, so a filter narrows what is shown and
 * never implies a total. the sector chips are a partial set: a row whose
 * sector has no chip stays visible in the unfiltered extract.
 */
export function filterObservatory(
  rows: readonly ObservatoryRow[],
  filter: ObservatoryFilter,
): readonly ObservatoryRow[] {
  return rows.filter((row) => {
    if (filter.sector !== null && row.sector !== filter.sector) {
      return false;
    }
    if (filter.withoutDeclaration && row.declaration !== null) {
      return false;
    }
    return true;
  });
}

/** clicking the active chip clears it, so the extract is always reachable. */
export function toggleSector(
  filter: ObservatoryFilter,
  sector: ObservatorySector,
): ObservatoryFilter {
  return { ...filter, sector: filter.sector === sector ? null : sector };
}
