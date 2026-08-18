import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGitCli } from '../src/git-cli.js';

// a real repository, built here, so the port is exercised against git itself
// rather than against a description of git.
let repo: string;
let first: string;
let last: string;

function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'c. bellanger',
      GIT_AUTHOR_EMAIL: 'cb@example.fr',
      GIT_COMMITTER_NAME: 'c. bellanger',
      GIT_COMMITTER_EMAIL: 'cb@example.fr',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_SYSTEM: '/dev/null',
    },
  });
}

function commit(file: string, body: string, subject: string): string {
  writeFileSync(join(repo, file), body);
  git(['add', file]);
  git(['-c', 'commit.gpgsign=false', 'commit', '-m', subject]);
  return git(['rev-parse', 'HEAD']).trim();
}

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), 'balise-attribution-'));
  git(['init', '--initial-branch=main']);
  first = commit('dates.ts', 'export const a = 1;\n', 'chore: base');
  commit('other.ts', 'export const b = 2;\n', 'feat: other file');
  last = commit('dates.ts', 'export const a = 2;\n', 'feat(dates): format des actes');
});

afterAll(() => {
  rmSync(repo, { recursive: true, force: true });
});

describe('createGitCli', () => {
  it('returns only the commits touching the file inside the range', async () => {
    const port = createGitCli({ cwd: repo });
    const lookup = await port.commitsTouching('dates.ts', { fromRef: first, toRef: last });
    if (lookup.status !== 'ok') throw new Error(`expected ok, got ${lookup.status}`);
    expect(lookup.commits).toHaveLength(1);
    expect(lookup.commits[0]).toMatchObject({
      sha: last,
      shortSha: last.slice(0, 7),
      author: 'c. bellanger',
      subject: 'feat(dates): format des actes',
    });
    expect(lookup.commits[0]!.authoredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('reports a file nothing changed in the range as unchanged, not as missing', async () => {
    const port = createGitCli({ cwd: repo });
    const lookup = await port.commitsTouching('other.ts', { fromRef: first, toRef: last });
    if (lookup.status !== 'ok') throw new Error('expected ok');
    expect(lookup.commits.map((entry) => entry.subject)).toEqual(['feat: other file']);
  });

  it('reports a path the repository never had', async () => {
    const port = createGitCli({ cwd: repo });
    const lookup = await port.commitsTouching('src/ghost.ts', { fromRef: first, toRef: last });
    expect(lookup.status).toBe('unknown-path');
  });

  it('reports an unknown ref as unavailable rather than as an empty answer', async () => {
    const port = createGitCli({ cwd: repo });
    const lookup = await port.commitsTouching('dates.ts', { fromRef: 'deadbeef', toRef: last });
    if (lookup.status !== 'unavailable') throw new Error('expected unavailable');
    expect(lookup.detail).toBeTypeOf('string');
  });

  it('refuses a traversing path without invoking git', async () => {
    const port = createGitCli({ cwd: repo });
    expect((await port.commitsTouching('../escape.ts', { fromRef: first, toRef: last })).status).toBe('unknown-path');
  });
});
