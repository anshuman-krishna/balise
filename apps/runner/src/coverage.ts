import { unusedBytes, unusedBytesFromCoverage, type CoverageFunction, type SourceRange } from '@balise/measure-core';

/**
 * unused decoded bytes per url, from chromium's own coverage.
 *
 * this is off unless a scenario asks for it, and it is recorded in the
 * environment fingerprint when it is on. v8's precise coverage instruments
 * execution, so it moves `js_execution_ms`, and a run measured with it is not
 * comparable to a run measured without it. see METHODOLOGY.md section 12.
 */
export type CoverageByUrl = ReadonlyMap<string, number | null>;

export const NO_COVERAGE: CoverageByUrl = new Map();

/**
 * the slice of chromium's coverage api this uses, named structurally so the
 * reduction can be tested against reports rather than against a browser.
 */
export interface CoverageSource {
  startJSCoverage(options?: { resetOnNavigation?: boolean }): Promise<void>;
  startCSSCoverage(options?: { resetOnNavigation?: boolean }): Promise<void>;
  stopJSCoverage(): Promise<
    Array<{ url: string; source?: string; functions: CoverageFunction[] }>
  >;
  stopCSSCoverage(): Promise<Array<{ url: string; text?: string; ranges: SourceRange[] }>>;
}

export interface CoveragePage {
  coverage: CoverageSource;
}

export async function startCoverage(page: CoveragePage): Promise<void> {
  // no reset on navigation: coverage is started after any priming pass, so
  // what it accumulates is the measured navigation and nothing before it.
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  await page.coverage.startCSSCoverage({ resetOnNavigation: false });
}

/**
 * a url reported twice contributes twice; a url whose text the browser did not
 * hand back, or whose report does not describe that text, is recorded as null
 * and stays null however many readable reports accompany it.
 */
function credit(into: Map<string, number | null>, url: string, bytes: number | null): void {
  if (url === '') return;
  if (!into.has(url)) {
    into.set(url, bytes);
    return;
  }
  const existing = into.get(url)!;
  into.set(url, existing === null || bytes === null ? null : existing + bytes);
}

export async function stopCoverage(page: CoveragePage): Promise<CoverageByUrl> {
  const unused = new Map<string, number | null>();

  for (const entry of await page.coverage.stopJSCoverage()) {
    credit(
      unused,
      entry.url,
      entry.source === undefined ? null : unusedBytesFromCoverage(entry.source, entry.functions),
    );
  }

  for (const entry of await page.coverage.stopCSSCoverage()) {
    // css coverage reports the ranges that were used, already disjoint.
    credit(
      unused,
      entry.url,
      entry.text === undefined ? null : unusedBytes(entry.text, entry.ranges),
    );
  }

  return unused;
}
