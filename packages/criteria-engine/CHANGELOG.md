# Changelog

## Versioning

Independent semver, per package. A breaking change takes a major bump and a
migration note in this file saying what to do about it, not just what changed.

Nothing here has been published to npm yet. `0.1.0` is the shape of the first
release, not a release.

## 0.1.0 (unreleased)

- `parsePack` and `selectPack`. No "latest": an assessment is bound to an
  exact pack version forever.
- `evaluate` and `evaluateCriterion`, with the three tiers enforced in code:
  automated answered from measurement, assisted proposed and counting for
  nothing until confirmed, declarative never touched.
- A human attestation overrules a measurement, and `tiersSignedOff: false` on a
  pack stops the engine answering anything automatically from it.
- Everything unanswerable returns `non_evalue` with a French reason, never a
  failure.
- `completion` split by tier, and `blockingFindings` mechanising the official
  grid's justification rule.
- `metric_threshold` is the only evaluation type implemented. An unrecognised
  type degrades to `non_evalue` naming the type, so an older engine reading a
  newer pack says what it cannot do.
