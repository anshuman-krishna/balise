# 0007. The environment is one object, expanded from a named profile

- **Status**: Accepted
- **Date**: 2026-08-21
- **Area**: measurement

## Context

Invariant 3 says two runs are comparable only when their `EnvironmentFingerprint`
values match. The schema was real, the runner built one on every capture, and the
ledger recorded one with each run entry.

The interface described the environment four other ways, none of them connected to
any of that:

- The application bar carried a hand-written string:
  `chromium 127.0.6533.88 · img sha256:4e91c2a7 · desktop-fibre + mobile-4g · eu-west-par`.
  **No fingerprint can be two throttle profiles.** A fingerprint has exactly one, and
  a service measured under two has two environments, which is the situation invariant 3
  exists to name.
- The run detail's environment panel was an array of key/value pairs including
  `throttle: mobile-4g (1.6 Mbps / 4x CPU)`, which restates the profile table by hand
  and is free to drift from it. It omitted viewport, device scale factor, locale and
  timezone, which are fields invariant 3 actually compares.
- The comparison screen displayed a green `FINGERPRINT MATCH` chip, and the run detail
  a green "Comparison permitted without a flag" note, **with nothing checking either**.
  Invariant 3 was decoration on the two screens whose job is to put runs beside each
  other.
- Three more surfaces carried `profile: 'mobile-4g'` as a typed string.

The profile parameters themselves lived in `apps/runner/src/profiles.ts`, which the web
application cannot import.

## Decision

**A scenario names a profile; everything else about the environment is expanded from
it.**

- `THROTTLE_PROFILES` moves to `@balise/schemas`. Two things read it: the runner, which
  applies it, and every surface that states which environment a figure came from. The
  runner keeps only the part that touches Chromium (`isMobile`, the user agent, the CDP
  mapping).
- `buildFingerprint`, `fingerprintsMatch`, `fingerprintDifferences`, `isAuditable` and
  `summariseFingerprints` move to `@balise/measure-core`. Comparability is a measurement
  rule, and an auditor reading the open packages should find invariant 3 implemented
  there. The runner re-exports them.
- `fingerprintDifferences` is driven from `FINGERPRINT_FIELDS` rather than written out
  field by field, and that list is held exhaustive against the schema by a compile-time
  assertion. A field added to the fingerprint is compared from the day it exists.
- Every scenario in the measurement canon declares `throttleProfile` and whether coverage
  ran, and the generator expands both into a real `EnvironmentFingerprint` through the
  kernel. No fixture can describe a machine the runner would not produce.
- `summariseFingerprints` returns, per field, either the shared value or the fact that it
  varies. A surface describing several scenarios states what they share and **names** what
  they do not, rather than concatenating values into a line no run was measured under.

## Consequences

- The application bar now reads `chromium … · image … · throttle mobile-4g · region
  eu-west-par` followed by `coverage varies` in `caution`. That is accurate: the service
  median runs without coverage instrumentation and the pull request scenario runs with it,
  because the check reports unexecuted bytes and V8 precise coverage costs time on every
  run.
- **Those two scenarios are therefore not comparable to each other**, and the product now
  says so on its busiest surface. This puts METHODOLOGY open decision 14 in front of the
  user rather than in a document.
- The comparison chip and the run detail note are computed. They still read green, because
  baseline and candidate are two aggregations of one scenario, but they read green for a
  reason now, and the failure path is styled and worded.
- The environment panel gained viewport, device scale factor, locale and timezone. They
  were always compared and never shown.
- `summariseFingerprints([])` reports **not uniform**. An empty set has nothing that
  varies, and it also describes nothing; reporting it as uniform would let a caller read
  "one environment" from having measured none.
- `corpusProfile()` throws where the twelve indexed services do not agree on a profile,
  because a rank across two profiles ranks the profiles.
- `mobile-4g` and `mobile-3g` produce fingerprints differing **only** in the profile name:
  same handset geometry, different link. The name is what carries the link speed, through
  the versioned table, and the methodology version recorded beside the run is what pins the
  table. That chain is why changing a profile's parameters is a breaking change rather than
  a tweak: it would silently redefine what a stored fingerprint meant.

## Alternatives considered

**Put the profile parameters in `measure-core` rather than `schemas`.** `measure-core` is
statistics over trace data; a table of viewports is not that. `schemas` already holds
`METRIC_DIRECTION`, which is the same kind of thing: data that is part of the contract.

**Leave the parameters in the runner and duplicate what the screens need.** This is the
state the decision replaces. The duplicate said `1.6 Mbps` and nothing would have noticed
if the runner had stopped applying it.

**Have the app bar show the first scenario's fingerprint.** Simpler, and it states a
comparability that does not hold across the service. The bar's stated purpose is answering
"how do I know this is comparable", so answering it with one scenario's values would be the
exact failure.

**Give every scenario the same environment so nothing varies.** It would have made the
summary function pointless and the screens simpler, by describing a product nobody would
run: coverage instrumentation is worth its cost on a pull request and not on a scenario
measured several times a day.
