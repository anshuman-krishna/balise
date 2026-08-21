# Changelog

## Versioning

Independent semver, per package. A breaking change takes a major bump and a
migration note in this file saying what to do about it, not just what changed.

Nothing here has been published to npm yet. `0.1.0` is the shape of the first
release, not a release.

## 0.1.0 (unreleased)

First shape of the contracts every other package speaks.

- Branded identifiers: `OrganizationId`, `ProjectId`, `ServiceId`,
  `ScenarioId`, `RunId`, `CriterionId`.
- Metrics, units, and `METRIC_DIRECTION`, which says per metric whether growth
  is harm so that no call site decides that locally.
- `NoiseFloor` as a discriminated union, where the unestablished variant
  carries no value field at all.
- `Delta` with `indeterminate` alongside the three verdicts.
- Capture, fingerprint, carbon, criteria, ledger, attribution and budget shapes.
- `formatMeasured` and `formatMeasuredSigned`, so a screen, a pull request
  comment and a PDF cannot render one measurement three ways.
