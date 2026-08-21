# @balise/measure-core

The measurement kernel: metric extraction, robust statistics, the noise floor,
delta classification and confidence grading.

Pure functions. No IO, no database, no network, no logging, no clock. Given the
same input it returns the same output forever, which is what makes it testable
and what makes it worth reading before you trust a number that came out of it.

It depends on `@balise/schemas` and on nothing else. Not on Node builtins,
not on a date library, not on a statistics library.

## Why it exists

A measurement that cannot be reproduced is not evidence. Two things destroy
reproducibility in web measurement, and both are handled here rather than in
the application:

1. **Page load distributions have long right tails.** A mean is dominated by
   whichever run hit a slow CDN edge. Everything here reports a median and a
   median absolute deviation, and there is no function that returns a mean.
2. **Small differences are noise, not changes.** Reporting a 0.4% byte
   difference as a regression teaches people to ignore the tool. Every verdict
   goes through one function, `classifyDelta`, and that function refuses to
   call anything a change until it clears the scenario's measured floor.

## Using it

```ts
import {
  extractMetrics,
  aggregateRuns,
  computeNoiseFloor,
  classifyDelta,
  gradeConfidence,
} from '@balise/measure-core';

// one capture in, one metric set out
const metrics = capture.map(extractMetrics);

// several runs of one scenario in, one median-and-MAD aggregate out
const candidate = aggregateRuns(metrics);

// the scenario's own history in, a floor for one metric out
const floor = computeNoiseFloor(history, 'transferred_bytes');

// two aggregates and the floor in, a verdict out
const delta = classifyDelta(before, after, floor);
// delta.classification: 'regression' | 'improvement' | 'no-significant-change' | 'indeterminate'

const confidence = gradeConfidence(after.metrics[0], {
  fingerprintStable: true,
  noiseFloor: floor,
});
```

## The noise floor

The floor for a metric on a scenario is the median of that scenario's
historical MADs for that metric, scaled by a factor. It is not a fixed
percentage and it is not guessed.

```ts
computeNoiseFloor(history, metricId, { scalingFactor, minHistory });
```

Below the minimum history there is no floor. `computeNoiseFloor` returns
`{ status: 'insufficient-history', sampleCount, requiredCount }`, which carries
no value at all, so no caller can accidentally read a zero and compare against
it. Three things follow from an unestablished floor, and all three are
mechanical rather than conventional:

- `classifyDelta` returns `indeterminate`. No floor, no verdict.
- `gradeConfidence` returns `low`, whatever the dispersion says.
- A budget built on that scenario cannot fail. Budgets activate once the floor
  is established.

That last one costs a new customer a waiting period before the check can block
anything, and it is the honest way round: a check that fires before it knows
what normal looks like is a check nobody keeps.

The scaling factor and the minimum history are exported as
`PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR` and `NOISE_FLOOR_MIN_HISTORY`, named
that way because they are **provisional**. They are product decisions and they
are explicit parameters on every call, so nothing can quietly depend on a
default. See `docs/METHODOLOGY.md` in the Balise repository for the current
values and their status.

## `classifyDelta`

The most important function here. Its rules, in order:

1. No established floor gives `indeterminate`.
2. `|delta|` must **strictly exceed** the floor. Equality is not significant.
3. Whether growth is harm comes from `METRIC_DIRECTION` in `@balise/schemas`,
   not from the caller.

It throws on mismatched metric ids, mismatched units, or a floor computed for a
different metric, because all three mean the caller has a bug and none of them
has a sensible answer.

There is exactly one implementation. If you find yourself writing a second one
in an API handler or a component, that is the bug.

## Confidence

`gradeConfidence` returns `high`, `medium` or `low` from four inputs: run
dispersion relative to the median, sample count, fingerprint stability, and
whether the scenario has a floor at all.

`ConfidenceContext.noiseFloor` is required rather than optional, deliberately.
Dispersion says how repeatable five runs were. The floor says whether a change
on that scenario could be detected at all, and a figure that is tight and
undetectable is not a figure much is known about. Making the field optional
once let eleven weeks of tight runs on a scenario with no history grade `high`.

## Findings

`findings()` raises what a single capture supports: image weight, font weight,
third-party weight by distinct origin, the heaviest single response, and the
decoded bytes found unexecuted for scripts and stylesheets.

Two rules hold it honest.

Every share carries the basis it is a share **of**, in the data rather than in
a caption, because unexecuted bytes are a share of what decompressed and not of
what crossed the wire. And a finding that could not be raised comes back
withheld, carrying what was missing, rather than as a zero or as an absence.
Coverage is not captured on every run, so the unexecuted-byte findings are
routinely withheld, and saying so is the point.

Nothing here states a saving. "This image could be 40 KB smaller" is a
counterfactual about a page nobody loaded, and this package only reports pages
that were.

One finding is a position rather than a weight, and it arrives as an input.
`FindingsInput.referencePosition` is a percentile somebody else computed
(`ecoIndexPercentile` in `@balise/carbon-models` reads one off the quantile
tables EcoIndex publishes). The kernel holds no corpus of its own and never
compares a service to services it cannot show you.

## Testing

The bar here is the highest in the repository. `classifyDelta` has exhaustive
tests, including the boundary where a delta exactly equals the floor.

Any change to statistics, the floor, or classification needs a test that fails
without it. A silent regression in this package is worse than an outage,
because nobody notices.

## License

Apache-2.0. Audit evidence cannot come from a black box, so the part that
produces it is open.
