import type { BlameUnavailableReason, CommitInfo, ModuleBlame, ModuleChange } from '@balise/schemas';

export interface GitRange {
  /** the baseline run's commit. */
  fromRef: string;
  /** the candidate run's commit. */
  toRef: string;
}

export type GitLookup =
  | { readonly status: 'ok'; readonly commits: readonly CommitInfo[] }
  | { readonly status: 'unknown-path' }
  | { readonly status: 'unavailable'; readonly detail?: string };

/**
 * the repository, as attribution is allowed to see it: read-only, one question.
 * no write of any kind reaches a customer repository from this package.
 */
export interface GitPort {
  commitsTouching(path: string, range: GitRange): Promise<GitLookup>;
}

// a path that leaves the repository, or that could read as a git option, is
// refused here rather than handed to git.
export function isRepositoryPath(path: string): boolean {
  if (path.length === 0) return false;
  if (path.startsWith('/') || path.startsWith('-')) return false;
  return !path.split('/').includes('..');
}

function unavailable(
  module: ModuleChange,
  reason: BlameUnavailableReason,
  detail?: string,
): ModuleBlame {
  const base = { status: 'unavailable' as const, path: module.path, packageName: module.packageName, reason };
  return detail === undefined ? base : { ...base, detail };
}

/**
 * name the commits that changed a module between the two runs.
 *
 * the range is exact: these are the commits touching that file between the
 * baseline commit and the candidate commit, not the last person to have
 * touched it. bytes belonging to a dependency are not blamed on whoever
 * happened to edit the lockfile; they come back as a dependency change, which
 * is a different question.
 */
export async function blameModules(
  modules: readonly ModuleChange[],
  range: GitRange,
  git: GitPort,
): Promise<ModuleBlame[]> {
  const out: ModuleBlame[] = [];
  for (const module of modules) {
    if (module.packageName !== null) {
      out.push(unavailable(module, 'third-party-module'));
      continue;
    }
    if (!isRepositoryPath(module.path)) {
      out.push(unavailable(module, 'path-not-in-repository'));
      continue;
    }

    const lookup = await git.commitsTouching(module.path, range);
    if (lookup.status === 'unknown-path') {
      out.push(unavailable(module, 'path-not-in-repository'));
      continue;
    }
    if (lookup.status === 'unavailable') {
      out.push(unavailable(module, 'git-unavailable', lookup.detail));
      continue;
    }
    if (lookup.commits.length === 0) {
      out.push(unavailable(module, 'no-commits-in-range'));
      continue;
    }
    out.push({
      status: 'attributed',
      path: module.path,
      packageName: module.packageName,
      commits: [...lookup.commits],
    });
  }
  return out;
}
