import { describe, expect, it } from 'vitest';
import type { CommitInfo, ModuleChange } from '@balise/schemas';
import { blameModules, isRepositoryPath, type GitLookup, type GitPort } from '../src/blame.js';

const COMMIT: CommitInfo = {
  sha: 'a7f2c91b0d2e4f6a8c1b3d5e7f9a1c3b5d7e9f11',
  shortSha: 'a7f2c91',
  author: 'c. bellanger',
  authoredAt: '2026-08-12T09:14:00+02:00',
  subject: 'feat(dates): format des actes',
};

function module(path: string, packageName: string | null = null): ModuleChange {
  return { path, packageName, beforeBytes: 0, afterBytes: 4_000, delta: 4_000, status: 'added', span: null };
}

function port(answer: (path: string) => GitLookup): GitPort {
  return { commitsTouching: (path) => Promise.resolve(answer(path)) };
}

const RANGE = { fromRef: 'a1b2c3d', toRef: 'e4f5a6b' };

describe('isRepositoryPath', () => {
  it('refuses a path that leaves the repository or reads as an option', () => {
    expect(isRepositoryPath('src/main.ts')).toBe(true);
    expect(isRepositoryPath('../secrets/id_rsa')).toBe(false);
    expect(isRepositoryPath('/etc/passwd')).toBe(false);
    expect(isRepositoryPath('--output=/tmp/x')).toBe(false);
    expect(isRepositoryPath('')).toBe(false);
  });
});

describe('blameModules', () => {
  it('names the commits that touched the file between the two runs', async () => {
    const [result] = await blameModules([module('src/lib/dates.ts')], RANGE, port(() => ({ status: 'ok', commits: [COMMIT] })));
    expect(result).toEqual({
      status: 'attributed',
      path: 'src/lib/dates.ts',
      packageName: null,
      commits: [COMMIT],
    });
  });

  it('does not blame a person for a dependency', async () => {
    const calls: string[] = [];
    const [result] = await blameModules(
      [module('node_modules/date-fns/locale/fr.js', 'date-fns')],
      RANGE,
      port((path) => {
        calls.push(path);
        return { status: 'ok', commits: [COMMIT] };
      }),
    );
    if (result?.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('third-party-module');
    expect(result.packageName).toBe('date-fns');
    // the repository is not even asked: whoever last touched the lockfile is
    // not the author of these bytes.
    expect(calls).toEqual([]);
  });

  it('separates a file the repository does not have from one nothing changed', async () => {
    const [missing] = await blameModules([module('src/ghost.ts')], RANGE, port(() => ({ status: 'unknown-path' })));
    const [quiet] = await blameModules([module('src/stable.ts')], RANGE, port(() => ({ status: 'ok', commits: [] })));
    if (missing?.status !== 'unavailable' || quiet?.status !== 'unavailable') throw new Error('expected unavailable');
    expect(missing.reason).toBe('path-not-in-repository');
    expect(quiet.reason).toBe('no-commits-in-range');
  });

  it('reports a repository it could not read, with the detail', async () => {
    const [result] = await blameModules(
      [module('src/main.ts')],
      RANGE,
      port(() => ({ status: 'unavailable', detail: 'fatal: not a git repository' })),
    );
    if (result?.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('git-unavailable');
    expect(result.detail).toBe('fatal: not a git repository');
  });

  it('refuses a traversing path before git sees it', async () => {
    const calls: string[] = [];
    const [result] = await blameModules(
      [module('../../etc/passwd')],
      RANGE,
      port((path) => {
        calls.push(path);
        return { status: 'ok', commits: [COMMIT] };
      }),
    );
    if (result?.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('path-not-in-repository');
    expect(calls).toEqual([]);
  });

  it('answers for every module it is given, in order', async () => {
    const results = await blameModules(
      [module('src/a.ts'), module('node_modules/react/index.js', 'react'), module('src/b.ts')],
      RANGE,
      port(() => ({ status: 'ok', commits: [COMMIT] })),
    );
    expect(results.map((row) => row.path)).toEqual(['src/a.ts', 'node_modules/react/index.js', 'src/b.ts']);
    expect(results.map((row) => row.status)).toEqual(['attributed', 'unavailable', 'attributed']);
  });
});
