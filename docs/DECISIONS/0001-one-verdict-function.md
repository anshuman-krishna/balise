# 0001. One verdict function

- **Status**: Accepted
- **Date**: 2026-08-17
- **Area**: statistics

## Context

The product's claim is that a measurement it reports is defensible. The fastest
way to lose that claim is to tell a customer their page regressed when what
actually happened is that a CDN edge was slow on one of five runs.

Page load distributions have long right tails, so the same page measured twice
differs every time. Some of that difference is a change and most of it is not,
and the line between them is not a fixed percentage: a scenario that varies by
40 KB run to run needs a different line from one that varies by 400 bytes.

There are at least four places that would naturally want to ask "did this get
worse": the pull request check, the dashboard's comparison view, the budget
engine, and the execution report. Four implementations of that question will
disagree, and the disagreement will surface as one screen saying a metric
regressed while the document generated from the same data says it did not.

## Decision

One function, `classifyDelta` in `@balise/measure-core`, decides whether a
difference is a change. It is called from everywhere and reimplemented nowhere.

Its contract, in order:

1. If the noise floor is not established, the classification is
   `indeterminate`. No floor, no verdict.
2. If `|delta|` is **less than or equal to** the floor, the classification is
   `no-significant-change`. Equality is not significance.
3. Otherwise the delta is a `regression` if it moved in the direction of harm,
   and an `improvement` if it moved the other way. Which direction is harm comes
   from `METRIC_DIRECTION` in `@balise/schemas`, not from the caller.

It throws on mismatched metric ids, mismatched units, or a floor computed for a
different metric. All three mean the caller has a bug and none has a sensible
answer.

**Any change to this function requires its own ADR.**

## Consequences

- A new customer waits for history before the check can block anything. Twenty
  aggregations is a real onboarding cost and it is paid deliberately: a check
  that fires before it knows what normal looks like is a check that gets
  disabled in week two.
- Callers must obtain a floor before they can ask for a verdict, which means
  they must know which scenario they are on. That is a good constraint. A floor
  belongs to a scenario, and code that could not name the scenario was code that
  was about to compare two different pages.
- The UI cannot compute a delta locally for convenience. Components take a
  `DeltaClassification` rather than a boolean, so the "draw this in red" path is
  reachable only from a kernel verdict.
- Rule 2 makes the product conservative at the boundary: a delta exactly equal
  to the floor is not a change. Over many comparisons this understates rather
  than overstates, which is the correct direction for evidence.

## Alternatives considered

**A fixed percentage threshold, per metric.** Simple, explainable in one line,
and wrong: it ignores that the same threshold is generous on a noisy scenario
and paranoid on a stable one. It also cannot answer the "how do you know" that
a hostile auditor will ask, because the answer would be "we picked 5%".

**Statistical significance testing between the two run sets.** More rigorous in
principle. Rejected for now on two grounds: five runs per aggregation is too few
for the tests to have useful power, and the result is far harder to explain to a
bid director than "it moved more than this scenario normally varies". Worth
revisiting if the run count ever rises.

**Letting each surface decide.** Considered only long enough to name the failure
mode: the dashboard and the execution report disagreeing about whether a
supplier met a contractual commitment.
