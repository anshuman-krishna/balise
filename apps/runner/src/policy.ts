/**
 * run-count policy from the measurement contract: five runs per scenario by
 * default, configurable up, never down below three. a single run is never a
 * measurement.
 */
export const DEFAULT_RUNS = 5;
export const MIN_RUNS = 3;

export function resolveRunCount(requested?: number): number {
  if (requested === undefined) {
    return DEFAULT_RUNS;
  }
  if (!Number.isInteger(requested)) {
    throw new Error(`run count must be a whole number, received ${requested}`);
  }
  if (requested < MIN_RUNS) {
    throw new Error(`run count must be at least ${MIN_RUNS}, received ${requested}`);
  }
  return requested;
}

/**
 * a failed run is a failed run: it stays visible and is never imputed. below
 * the minimum of successful runs there is no aggregate to report, and saying
 * so is the correct output.
 */
export function sufficientForAggregate(successfulRuns: number): boolean {
  return successfulRuns >= MIN_RUNS;
}
