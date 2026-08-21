# 0008. The task cache includes what a package depends on

- **Status**: Accepted
- **Date**: 2026-08-21
- **Area**: platform

## Context

`turbo.json` declared `test` and `typecheck` with no `dependsOn`. Turborepo's hash for a
task then covers the package's own files and nothing upstream, so changing
`packages/schemas` invalidated schemas' own tasks and left every dependent package's
result cached.

Measured directly: appending a line to `packages/schemas/src/metrics.ts` and re-running
`pnpm typecheck` reported **12 successful, 11 cached**. One task re-ran. Eleven packages
that consume that file did not.

The consequence is worse than slow feedback. It means `pnpm typecheck` and `pnpm test` can
report green on a workspace that does not compile and whose tests do not pass. Two real
failures were sitting behind that cache:

1. **`apps/runner/src/measure.ts` had not compiled since slice 28.** That slice made
   `ConfidenceContext.noiseFloor` required and updated every call site it found; it missed
   this one, and the runner's cached typecheck kept reporting success. The runner is the
   only code that measures anything.
2. **`packages/budgets/test/report.test.ts` had been failing since slice 25.** That slice
   changed `formatMeasured` to keep one decimal below 10 KB; the assertion still expected
   `842 KB ± 3 KB`. Green for three slices.

Neither was found by review. Both were found the moment the cache key was corrected.

## Decision

`test` and `typecheck` declare `dependsOn: ["^test"]` and `dependsOn: ["^typecheck"]`, so a
package's task hash includes the tasks of everything it depends on, and a change anywhere
upstream re-runs everything downstream.

## Consequences

- A cold `pnpm typecheck` now takes about three seconds instead of nine milliseconds. That
  is the correct price.
- Tasks run topologically. `@balise/schemas` tests before `@balise/measure-core`, which
  tests before `apps/web`. Nothing here is slow enough for that to matter.
- The two failures above are fixed. The runner grades confidence with a floor computed from
  whatever history the caller carried in, defaulting to none, which per METHODOLOGY sections
  7 and 9 makes every figure from a one-off measurement low confidence. That grading was
  also extracted into `gradeAggregate` so it can be tested without a browser, which is why
  nothing caught it: `measure()` needs Chromium and no test called it.
- CI was never affected. It installs fresh and has no warm cache, so it would have caught
  both on the next run that touched those packages. The failure was local, which is where
  it does the most damage: it is the signal a person acts on.

## Alternatives considered

**Disable caching for `test` and `typecheck`.** Correct and wasteful. The cache is right,
the key was wrong.

**Add explicit `inputs` globs listing sibling sources.** Hand-maintained, and it would go
stale exactly like the duplicated profile table in ADR 0007.

**Rely on CI.** CI is the backstop, not the loop. A local `pnpm test` that lies is worse
than no local `pnpm test`, because it is trusted.
