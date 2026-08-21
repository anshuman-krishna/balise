# 0005. Confidence grading requires the scenario's noise floor

- **Status**: Accepted
- **Date**: 2026-08-20
- **Area**: statistics

## Context

`docs/METHODOLOGY.md` section 7 states the rule plainly: with fewer than twenty
historical aggregations there is no noise floor, and **everything on that
scenario is low confidence**.

Two of the three places that rule applies implemented it. `classifyDelta`
returns `indeterminate` without a floor ([0001](0001-one-verdict-function.md)),
and the budget engine refuses to fail a scenario that has none.

`gradeConfidence` did not, because it was never given the floor. Its context was
`{ fingerprintStable: boolean }` and it graded from dispersion and sample count
alone. A scenario with eleven aggregations of history and five tight runs graded
**high**.

That is exactly backwards. Eleven weeks of history is the state in which the
product knows least about a scenario, and it was the state in which the product
claimed to know most. It surfaced when a corpus of twelve services was built and
one of them was deliberately given a short history: the service with the least
history had the most confident figure on the page.

The rule existing in prose in three places and in code in two is the general
failure. A methodology rule that is not mechanical is a rule that holds until
someone writes a new call site.

## Decision

`ConfidenceContext` carries the scenario's noise floor, and the field is
**required**, not optional:

```ts
export interface ConfidenceContext {
  fingerprintStable: boolean;
  noiseFloor: NoiseFloor | null;
}
```

`gradeConfidence` returns `low` when the floor is `null` or not established,
before it looks at dispersion at all.

Required rather than optional is the substance of the decision. An optional
field with a permissive default is how the bug happened: every caller inherited
"assume it is fine" without being asked. Required with an explicit `null` forces
each call site to answer the question, and a caller that cannot name the
scenario's floor has a bug worth surfacing.

## Consequences

- A breaking change to a published package's public type. It is pre-1.0 and the
  alternative is shipping a function that overstates what is known.
- Every call site had to be revisited, which is the point.
- Figures on short-history scenarios now render in `caution` across the
  application, and there are more of them than the screens were designed for.
  That is the accurate picture.
- Confidence and verdict now degrade together: a scenario with no floor produces
  `indeterminate` deltas and `low` confidence, from one cause, stated once.
- `NoiseFloor`'s unestablished variant carries no `value` field at all, so no
  caller can read a floor of zero and compare against it. The type makes the
  absence unignorable rather than merely documented.

## Alternatives considered

**Keep the field optional, defaulting to "no floor known" and therefore low.**
Safer default, same disease: a caller that does not pass a floor still gets an
answer, and the answer would be low for scenarios that do have a floor, which
understates in the other direction.

**Grade confidence from dispersion only and show the missing floor separately.**
Two numbers where the reader needs one, and the second one gets dropped for
space on exactly the surfaces where it matters most.

**Compute the floor inside `gradeConfidence`.** It would need the scenario's
history, which makes a pure function stateful and gives it a reason to do IO.
The kernel does not do IO.
