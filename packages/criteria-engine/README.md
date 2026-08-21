# @balise/criteria-engine

Referential-agnostic rule evaluation. Loads a rule pack, answers what it can,
and says plainly what it cannot.

This package knows nothing about RGESN. It knows nothing about ecodesign, or
accessibility, or French procurement. It knows about criteria, tiers, evidence
and statuses. Two fixture packs with entirely different vocabularies are in the
test suite specifically to keep it that way: any referential-specific logic
that leaks in here is a bug, not a shortcut.

It depends on `@balise/schemas` and on nothing else.

## Using it

```ts
import { parsePack, selectPack, evaluate, completion, blockingFindings, canPublish } from '@balise/criteria-engine';

const pack = selectPack(packs, 'rgesn', '2024.2');

const assessments = evaluate(pack, {
  metrics: { dom_node_count: 2140, transferred_bytes: 1_298_000 },
  attestations: {
    '2.1': { status: 'conforme', attestedBy: 'C. Meunier', attestedAt: '2026-06-12T09:00:00Z' },
  },
});

const progress = completion(assessments);   // split by tier, plus the conformity rate
const blocking = blockingFindings(pack, assessments);
if (canPublish(blocking)) {
  // the declaration may be rendered
}
```

## The three tiers

Every criterion in every pack is in exactly one tier, and the tier decides what
the engine is allowed to do with it.

| Tier | The engine | A person |
| --- | --- | --- |
| `automated` | answers it from measurement | is not required |
| `assisted` | proposes an answer that counts for nothing | must confirm it |
| `declarative` | never touches it | attests, with a name attached |

`isAnswered` enforces the middle row: an assisted proposal carries
`requiresConfirmation: true` and is excluded from every completion count until
a person confirms it. The split by tier exists precisely so that auto-answered
criteria are never mistaken for a finished declaration.

## A pack can withhold its own tiers

`RulePack.tiersSignedOff` is a gate in code, not a note in a document.

Which tier a criterion belongs in decides whether a product may answer it
without a human, and that is a product decision. While a pack ships
`tiersSignedOff: false`, this engine answers **nothing** automatically from it:
every criterion comes back `non_evalue` with the reason, whatever its tier
says, and only a human attestation produces an answer.

That is the state the RGESN 2024 v2 pack ships in today.

## A human attestation always wins

`evaluateCriterion` checks for an attestation first and returns it if there is
one. The engine does not overrule a named person who put their name to an
answer, even where a metric contradicts them, and it never manufactures an
attestation from a measurement that looks convincing.

## Not answering is not failing

Everything the engine cannot answer comes back `non_evalue` with a French
reason string, which is the absence of an answer rather than a bad one. The
reasons are specific, because "unknown" is not useful in an audit:

- the pack's tiers are not signed off
- the criterion is declarative and nobody attested it
- the referential carries no evaluation rule for it
- the evaluation type is one this engine does not implement
- the metric the rule needs was not measured

`non_evalue` is never counted as conforming, and it is never counted as
non-conforming either. It stays in the denominator of the conformity rate,
because not having looked is not the same as having nothing to answer.

## Blocking findings

`blockingFindings` mechanises the official grid's justification rule: anything
that is not `conforme` requires justification text, and a declaration cannot
render without one. It reports four kinds:

- `unassessed-criterion`: nobody answered it
- `unconfirmed-proposal`: the engine proposed, nobody confirmed
- `missing-justification`: a non-conforming status with no text
- `missing-evidence`: the pack requires an artifact and none was attested

The point of forcing these is that a published declaration admitting gaps reads
as credible, and one claiming 100% conformity reads as marketing and gets
challenged.

## Statuses

The four official statuses, unmodified: `conforme`, `partiellement_conforme`,
`non_conforme`, `non_applicable`, plus `non_evalue` for the absence of an
answer. They are not renamed into friendlier language. Auditors read the
official grid.

## Packs are immutable

`selectPack` takes an exact id and version and there is no "latest". An
assessment is bound to the pack version it was made under, forever, and a
caller that does not say which version it wants has a bug.

`parsePack` refuses a pack that is internally inconsistent: a duplicate
criterion id, or a criterion in a family the pack does not declare. A pack is
the definition of what conformity means, so a defect in one is something to
reject rather than work around.

## Adding an evaluation type

`metric_threshold` is the only type implemented. Adding another means adding a
schema in `@balise/schemas`, a branch in `evaluateCriterion`, and fixtures.
Anything unrecognised already degrades to `non_evalue` naming the type, so an
older engine reading a newer pack says what it cannot do instead of guessing.

## License

Apache-2.0. Audit evidence cannot come from a black box, so the part that
produces it is open.
