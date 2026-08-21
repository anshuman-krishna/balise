# Changelog

## Versioning

Independent semver, per package. A breaking change takes a major bump and a
migration note in this file saying what to do about it, not just what changed.

Nothing here has been published to npm yet. `0.1.0` is the shape of the first
release, not a release.

Any change to statistics, the noise floor or delta classification is a change to
what the product will say about a customer's history. Those changes carry an ADR
in `docs/DECISIONS/` as well as an entry here.

## 0.1.0 (unreleased)

- `extractMetrics`, `summariseResources` and `findings` over a raw capture.
- `aggregateRuns`: median and median absolute deviation. There is no function
  here that returns a mean.
- `computeNoiseFloor`, with `PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR` and
  `NOISE_FLOOR_MIN_HISTORY` exported under names that say they are provisional.
- `classifyDelta`: the one implementation of "a delta below the floor is not a
  change".
- `gradeConfidence`, whose `ConfidenceContext.noiseFloor` is **required**. It
  was optional once, and a scenario with no history graded high for eleven
  weeks.
- `unusedBytesFromCoverage`, which resolves V8's nested ranges and refuses
  rather than approximating when offsets fall outside the text.
- A finding may carry a `ReferencePosition`, which is a percentile computed
  elsewhere and handed in. This package holds no corpus of its own.
