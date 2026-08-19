import type { ModuleChange } from '@balise/schemas';
import { isRepositoryPath } from './blame.js';

/**
 * a module the candidate build grew, placed at lines of a file the repository
 * could hold. this is what a pull request annotation may be attached to.
 */
export interface PlacedGrowth {
  /** normalised path, the same one blame asks git about. */
  path: string;
  /** 1-based and inclusive, from the candidate map. */
  startLine: number;
  endLine: number;
  /** decoded bytes the candidate added to this module. */
  deltaBytes: number;
  /** what the module weighs in the candidate build. */
  afterBytes: number;
}

/**
 * the grown modules an annotation can be pinned to, and only those.
 *
 * three refusals, each of them a place where a guess would fit. a module the
 * candidate map gave no position for is not placed, because line 1 is a
 * default and not a measurement. a dependency is not placed, because its file
 * is not in the repository the pull request changes and the change that
 * brought it in is a manifest edit somewhere else. a path that leaves the
 * repository is not placed at all.
 *
 * the span comes from the candidate side alone. it says where the bundle takes
 * the module from, never where the growth happened inside it: that would mean
 * subtracting line numbers between two versions of a file, and an edit above a
 * line moves it without changing it.
 */
export function placeGrowth(modules: readonly ModuleChange[]): PlacedGrowth[] {
  const placed: PlacedGrowth[] = [];

  for (const module of modules) {
    if (module.delta <= 0) continue;
    if (module.packageName !== null) continue;
    if (module.span === null) continue;
    if (!isRepositoryPath(module.path)) continue;

    placed.push({
      path: module.path,
      startLine: module.span.firstLine,
      endLine: module.span.lastLine,
      deltaBytes: module.delta,
      afterBytes: module.afterBytes,
    });
  }

  return placed.sort((a, b) =>
    b.deltaBytes !== a.deltaBytes ? b.deltaBytes - a.deltaBytes : a.path.localeCompare(b.path),
  );
}
