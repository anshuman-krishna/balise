# @balise/rule-packs

Versioned referential packs for the criteria engine.

## rgesn 2024 v2

The Référentiel général d'écoconception de services numériques, version 2,
published May 2024 by Arcep and Arcom with ADEME, DINUM, CNIL and INRIA.
78 criteria in 9 families.

`statementFr` is the referential's own text, taken verbatim from the official
evaluation spreadsheet published alongside the PDF. Nothing in this package
paraphrases, shortens or translates a criterion: auditors read the official
text, and so must we.

- Source: <https://ecoresponsable.numerique.gouv.fr/publications/referentiel-general-ecoconception/>
- `scripts/extract-from-ods.py` reads the published spreadsheet into
  `scripts/rgesn-2024-v2.source.json`.
- `scripts/generate-pack.py` writes `src/rgesn-2024-v2.ts` and its readable
  twin `packs/rgesn-2024-v2.yaml`.

Both generated files are checked in, and a test rebuilds nothing: it holds the
module to the extracted source, so a hand edit to a statement fails the build.

## The tiers are proposed, not accepted

The pack ships with `tiersSignedOff: false`.

Which tier a criterion belongs in decides whether the product may answer it
without a human, and that is a product decision rather than an engineering
one. Until it is reviewed and the flag is flipped, the criteria engine answers
**nothing** automatically from this pack: every criterion requires a human
attestation, whatever its tier says.

The proposal is deliberately under-claimed, at 9 automated, 22 assisted and 47
declarative. Automated is used only where the metric set answers the question
outright. Inflating that count is the failure mode this pack exists to avoid.

## Evaluation rules are mostly absent, on purpose

The referential asks questions; it sets almost no numbers. Where a threshold
appears in an `evaluation` block it is ours, not the referential's, and it
needs the same sign-off as the tiers.
