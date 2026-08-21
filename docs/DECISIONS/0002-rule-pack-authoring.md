# 0002. Rule packs carry verbatim statements and may withhold their tiers

- **Status**: Accepted
- **Date**: 2026-08-18
- **Area**: criteria

## Context

The RGESN is a published referential: 78 criteria in 9 families, with official
numbering and official wording. An auditor reading a declaration reads the
official text and checks it against the referential in front of them.

Two temptations sit on this. The first is to rewrite the criteria into friendlier
language, because several of them are long and read like a standards document.
The second is to classify as many criteria as possible as machine-answerable,
because "31 of 78 answered automatically" is a better demo than "9 of 78".

Both are the same mistake. A paraphrase that drifts from the official text is
something an auditor can hold up as a discrepancy, and an inflated automated
count collapses on first contact with someone who reads what the criterion
actually asks.

Which tier a criterion belongs in is a product decision, not an engineering one.
It decides whether the product may answer a question about conformity without a
human being involved.

## Decision

A rule pack is data, versioned, and immutable once published.

- `statementFr` is verbatim from the official published source. Nothing
  paraphrases, shortens or translates a criterion. The extraction tooling is
  checked in and a test holds the module to the extracted source, so a hand edit
  to a statement fails the build.
- Criterion ids are the official ids. Nothing is renumbered.
- A pack carries `tiersSignedOff: boolean`. **While it is false, the criteria
  engine answers nothing automatically from that pack**, whatever the tiers say:
  every criterion comes back `non_evalue` with the reason, and only a human
  attestation produces an answer.
- Evaluation thresholds that the referential does not state are ours, are marked
  as ours, and need the same sign-off as the tiers.
- Changing a criterion means a new pack version. Existing assessments stay bound
  to the version they were made under, forever, and are never migrated.

## Consequences

- The product currently answers nothing automatically, because `rgesn-2024-v2`
  ships `tiersSignedOff: false`. The criteria workspace shows `AUTOMATED 9/9`
  beside a source breakdown reading 0 measured, 73 attested, 5 not looked at.
  That is an uncomfortable screen and it is accurate.
- The gate is in code rather than in a document, so nobody can ship a demo that
  quietly flips it.
- Pack files are large and mostly prose. That is the cost of verbatim.
- A new referential (RGAA is the planned second) is a new pack, not a change to
  the engine. The engine's test suite carries two fixture packs with different
  vocabularies specifically to keep referential knowledge out of it.

## Alternatives considered

**Summarise each criterion and link to the official text.** Reads better and
loses the audit. The summary is what gets rendered into the declaration the
customer publishes, and a summary is not what the referential says.

**Ship the proposed tiers as live and mark them provisional in the interface.**
Rejected: a caveat next to a number does not stop the number being quoted. If
the tiers are not signed off, the honest behaviour is to not answer, and that is
what the flag does.

**Store packs as YAML loaded at runtime.** The pack is generated to both a
TypeScript module and a readable YAML twin, and the module is what loads. Runtime
YAML parsing would have added a dependency to a package whose dependency surface
is a trust surface.
