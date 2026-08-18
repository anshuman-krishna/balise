import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { CommitInfo } from '@balise/schemas';
import { isRepositoryPath, type GitLookup, type GitPort, type GitRange } from './blame.js';

const run = promisify(execFile);

// unit and record separators: a commit subject can contain anything else.
const FIELD = '\u001f';
const RECORD = '\u001e';
const FORMAT = `%H${FIELD}%an${FIELD}%aI${FIELD}%s${RECORD}`;

export interface GitCliOptions {
  /** working copy of the customer's repository. read only. */
  cwd: string;
  timeoutMs?: number;
  maxCommits?: number;
}

function firstLine(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split('\n')[0]!.slice(0, 200);
}

/**
 * a GitPort over the git cli. every invocation is read-only and every argument
 * is passed as an array, never through a shell. this package opens no branch,
 * writes no commit and touches nothing in the repository it reads.
 */
export function createGitCli(options: GitCliOptions): GitPort {
  const timeout = options.timeoutMs ?? 10_000;
  const maxCommits = options.maxCommits ?? 20;

  async function git(args: readonly string[]): Promise<string> {
    const { stdout } = await run('git', [...args], {
      cwd: options.cwd,
      timeout,
      maxBuffer: 8 * 1024 * 1024,
    });
    return stdout;
  }

  async function exists(ref: string, path: string): Promise<boolean> {
    try {
      await git(['cat-file', '-e', `${ref}:${path}`]);
      return true;
    } catch {
      return false;
    }
  }

  return {
    async commitsTouching(path: string, range: GitRange): Promise<GitLookup> {
      if (!isRepositoryPath(path)) return { status: 'unknown-path' };

      try {
        await git(['rev-parse', '--verify', `${range.fromRef}^{commit}`]);
        await git(['rev-parse', '--verify', `${range.toRef}^{commit}`]);
      } catch (error) {
        return { status: 'unavailable', detail: firstLine(error) };
      }

      // absent at both ends of the range means the map named something that is
      // not in this repository, which is not the same as an unchanged file.
      const present = (await exists(range.toRef, path)) || (await exists(range.fromRef, path));
      if (!present) return { status: 'unknown-path' };

      let stdout: string;
      try {
        stdout = await git([
          'log',
          '--no-merges',
          `--max-count=${maxCommits}`,
          `--format=${FORMAT}`,
          `${range.fromRef}..${range.toRef}`,
          '--',
          path,
        ]);
      } catch (error) {
        return { status: 'unavailable', detail: firstLine(error) };
      }

      const commits: CommitInfo[] = [];
      for (const record of stdout.split(RECORD)) {
        const trimmed = record.replace(/^\n/, '');
        if (trimmed.length === 0) continue;
        const [sha, author, authoredAt, subject] = trimmed.split(FIELD);
        if (sha === undefined || author === undefined || authoredAt === undefined) continue;
        commits.push({
          sha,
          shortSha: sha.slice(0, 7),
          author,
          authoredAt,
          subject: subject ?? '',
        });
      }
      return { status: 'ok', commits };
    },
  };
}
