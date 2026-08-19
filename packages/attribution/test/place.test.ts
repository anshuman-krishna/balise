import { describe, expect, it } from 'vitest';
import type { ModuleChange, SourceSpan } from '@balise/schemas';
import { placeGrowth } from '../src/place.js';

function module(
  path: string,
  before: number,
  after: number,
  span: SourceSpan | null,
  packageName: string | null = null,
): ModuleChange {
  return {
    path,
    packageName,
    beforeBytes: before,
    afterBytes: after,
    delta: after - before,
    status: before === 0 ? 'added' : after > before ? 'grown' : after < before ? 'shrunk' : 'unchanged',
    span,
  };
}

describe('placeGrowth', () => {
  it('places a grown first-party module at the lines the candidate map named', () => {
    const placed = placeGrowth([module('src/lib/dates.ts', 4_120, 4_240, { firstLine: 1, lastLine: 104 })]);
    expect(placed).toEqual([
      { path: 'src/lib/dates.ts', startLine: 1, endLine: 104, deltaBytes: 120, afterBytes: 4_240 },
    ]);
  });

  it('does not place a module the map gave no position for', () => {
    expect(placeGrowth([module('src/lib/dates.ts', 0, 8_000, null)])).toEqual([]);
  });

  it('does not place a dependency, whose file the pull request does not contain', () => {
    const modules = [module('node_modules/date-fns/locale/fr/index.js', 0, 62_000, { firstLine: 1, lastLine: 900 }, 'date-fns')];
    expect(placeGrowth(modules)).toEqual([]);
  });

  it('does not place a path that leaves the repository', () => {
    const modules = [
      module('../../elsewhere/a.ts', 0, 900, { firstLine: 1, lastLine: 9 }),
      module('/etc/passwd', 0, 900, { firstLine: 1, lastLine: 9 }),
    ];
    expect(placeGrowth(modules)).toEqual([]);
  });

  it('places nothing that did not grow', () => {
    const modules = [
      module('src/shrunk.ts', 9_000, 1_000, { firstLine: 1, lastLine: 40 }),
      module('src/same.ts', 9_000, 9_000, { firstLine: 1, lastLine: 40 }),
    ];
    expect(placeGrowth(modules)).toEqual([]);
  });

  it('orders by the bytes added, then by path, so a cap keeps the largest', () => {
    const span = { firstLine: 1, lastLine: 10 };
    const placed = placeGrowth([
      module('src/b.ts', 0, 100, span),
      module('src/c.ts', 0, 900, span),
      module('src/a.ts', 0, 100, span),
    ]);
    expect(placed.map((row) => row.path)).toEqual(['src/c.ts', 'src/a.ts', 'src/b.ts']);
  });
});
