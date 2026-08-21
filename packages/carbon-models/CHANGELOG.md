# Changelog

## Versioning

Independent semver, per package. A breaking change takes a major bump and a
migration note in this file saying what to do about it, not just what changed.

Nothing here has been published to npm yet. `0.1.0` is the shape of the first
release, not a release.

A constant changing in a model changes every historical estimate that model
produced. Model implementations are versioned separately from the specification
they implement (`version` and `specVersion`), and an assessment stays bound to
the version it was made under.

## 0.1.0 (unreleased)

- `CarbonModel` interface: `id`, `version`, `specVersion`, `method`,
  `sensitivity`, `assumptions`, `inputs`, `estimate`.
- EcoIndex, Sustainable Web Design v4 and 1byte, each with golden fixtures
  pinned to its own published reference values.
- `bandModels()` and `asideModels()`, split on what each model declares about
  itself rather than on a list of names.
- `ecoIndexPercentile`, which places a measured value against the quantile
  tables EcoIndex publishes, so the only comparison to other services the
  product makes is against a table anyone can read.
- A sensitivity suite that runs each model twice on different grids and twice on
  green and grey hosting, and fails a model that declares a sensitivity it does
  not have. It found one on its first run.
