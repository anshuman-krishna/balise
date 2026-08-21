# @balise/schemas

The Zod contracts every other Balise package speaks. One source of truth for
every shape that crosses a boundary: a measurement, an estimate, a criterion
assessment, a ledger entry, a budget verdict.

It depends on `zod` and on nothing else. The measurement kernel, the carbon
models, the criteria engine and the rule packs all depend on this and on
nothing else, which is the whole of the trust surface an auditor has to read.

## Types are inferred, never written twice

```ts
export const MetricValue = z.object({
  metricId: MetricId,
  value: z.number(),
  unit: Unit,
  confidence: Confidence,
});
export type MetricValue = z.infer<typeof MetricValue>;
```

The schema and the type share a name and there is exactly one definition. A
hand-written interface sitting next to a schema is two sources of truth that
will drift, and the drift shows up as a runtime shape that type-checks.

## Identifiers are branded

`OrganizationId`, `ServiceId`, `ScenarioId`, `RunId`, `CriterionId`. Strings at
runtime, distinct at compile time. Passing a `RunId` where a `ServiceId` is
expected fails to compile, which is the cheapest possible version of a class of
bug that is otherwise invisible until a query returns the wrong tenant's rows.

## Units live in the type

`Unit` is a closed set, and every measured value carries one. There is no
`number` in this package that means "some quantity of something".

`METRIC_DIRECTION` says, per metric, whether growth is harm. `classifyDelta`
reads it rather than taking a flag from the caller, so no call site can decide
locally that a metric got better by growing.

## Formatting is here, not at each edge

`formatMeasured` and `formatMeasuredSigned` turn a raw value plus its unit into
the string a person reads. They live in the shared package because the screen,
the pull request comment and the PDF must not render the same measurement
differently, and once they did: the same floor read 7.4 KB on one surface and
7 KB on another.

Display precision is applied here, at the edge. **Stored values are raw.**
Nothing rounds, smooths or prettifies a measurement before it is stored.

## The discriminated unions are the interesting part

Several shapes exist to make "we do not know" representable rather than
inferable from a zero:

- `NoiseFloor` is `established` (with a value, a sample count and the scaling
  factor used) or `insufficient-history` (with a sample count and the count
  required, and **no value field at all**). A caller cannot read a floor of
  zero and compare against it, because there is nothing to read.
- `Delta.classification` includes `indeterminate` alongside `regression`,
  `improvement` and `no-significant-change`.
- Attribution results can express "could not determine" and there is no shape
  for a plausible guess.

The pattern is deliberate. A field that can be absent is a field the type
system forces every caller to have an answer for.

## Conventions

- No `any`. No `as` outside a genuine IO boundary, and those carry a comment
  saying why the cast is safe.
- Every schema exports both the schema and its inferred type under one name.
- Enums are Zod unions here and check constraints in the database, never
  Postgres enum types.

## License

Apache-2.0. It is published because the four open packages depend on it, and a
dependency an auditor cannot read defeats the purpose of the four.
