# Changelog

## Versioning

Independent semver, per package. A breaking change takes a major bump and a
migration note in this file saying what to do about it, not just what changed.

Nothing here has been published to npm yet. `0.1.0` is the shape of the first
release, not a release.

A pack is immutable once published. A change to a criterion is a new pack
version with a migration note, and existing assessments are never migrated onto
it.

## 0.1.0 (unreleased)

- `rgesn-2024-v2`: 78 criteria in 9 families, every `statementFr` verbatim
  from the official evaluation spreadsheet, official numbering, referential
  priority on each.
- Ships `tiersSignedOff: false`. The proposal is 9 automated, 22 assisted and
  47 declarative, deliberately under-claimed, and it is a proposal until a
  person reviews it.
- Evaluation thresholds are ours, not the referential's, and carry the same
  caveat.
- The extraction tooling is checked in and a test holds the module to the
  extracted source, so a hand edit to a statement fails the build.
