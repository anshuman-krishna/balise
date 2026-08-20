# @balise/carbon-models

Pluggable carbon estimation models for a web page, each versioned, each
declaring what it assumes and how it works.

There is no headline number in this package and there is no function that
returns one. Models disagree, that disagreement is information, and nothing here
averages it away.

## Using it

```ts
import { carbonModels, bandModels, asideModels, assertModelInputs } from '@balise/carbon-models';

const input = {
  transferredBytes: 1_298_000,
  requestCount: 84,
  domNodeCount: 2_140,
  gridIntensity: { gCO2ePerKwh: 56, source: 'declared-default', zone: 'FR' },
  greenHostingFactor: 1,
};

for (const model of carbonModels) {
  assertModelInputs(model, input);
  const output = model.estimate(input);
  // output.value, output.unit, output.notes, and model.assumptions
}
```

Every model implements one interface, and adding a model never means touching
engine code anywhere. You write the model file, you register it in the index,
and you write golden fixtures against the model's own publication.

## The models

| Model | Spec | Method | Applies the visitor grid | Green hosting |
| --- | --- | --- | --- | --- |
| EcoIndex | 1.0 | score-derived | no | no |
| Sustainable Web Design | 4.0 | energy | yes | yes |
| 1byte | 2021 | energy | no, fixed constants | yes |

Constants and formulas come from each model's published source, not from a
reimplementation of the idea. Golden fixture tests pin them and fail on any
drift.

## Assumptions are data

An assumption is not a comment. It is a field on the model, in French and in
English, and it renders on every surface where that model's output appears: the
dashboard, the PDF, the embeddable badge.

```ts
{
  id: 'onebyte-fixed-intensity',
  textFr: "Intensités fixes issues de l'implémentation de référence...",
  textEn: 'Fixed intensities from the reference implementation...',
}
```

If an assumption is not in that array, we are hiding it. The rule is worth the
friction: it is the difference between a model you can argue with and a model
you have to trust.

## Which models share a band

Two models can be drawn on one axis when they estimate the same quantity, and
ours do not all estimate the same quantity.

SWD v4 and 1byte are energy models: data volume times an energy intensity times
an emissions intensity. EcoIndex is not. It rates a page from DOM nodes,
requests and page weight, and reads a gCO2e figure off that rating. Give it the
same page on renewable French electricity and on a coal grid and it returns the
same number, because electricity is not one of its inputs.

So `bandModels()` returns the energy models, and `asideModels()` returns the
rest, to be reported on their own terms. The split is computed from what each
model declares about itself, never from a list of names in this file:

```ts
readonly method: 'energy' | 'score-derived';
readonly sensitivity: { gridIntensity: boolean; greenHosting: boolean };
```

Being an energy model is not the same as tracking the visitor's grid, and the
table above says so plainly. 1byte is in the band and uses fixed published
intensities (519 gCO2e/kWh for the data centre, 475 for the network) rather than
the grid it was handed. That is a caveat on one edge of the band, carried in the
model's own assumptions, not a reason to draw it somewhere else.

The full reasoning, and what it means for a French service where only one model
in the band knows the grid is French, is in `docs/METHODOLOGY.md` section 10.1.

## A declaration is a claim, and it is tested

A model that declares a sensitivity it does not have fails its own suite. The
tests run each model twice with different grid intensities, and twice with green
and grey hosting, and assert that the value moves exactly when the model says it
does.

That test earned its place immediately. The band rule was first written as
"models that respond to grid intensity and hosting", on the assumption that both
energy models tracked the grid. The test found that 1byte does not, and the rule
moved to the line that actually holds.

## Rules a model must follow

- **Never reach outside the input.** No fetching, no config, no environment
  variables, no clock. Given the same input, a model returns the same output
  forever.
- **Declare every assumption**, including the boring ones and especially the
  unflattering ones.
- **Say what is excluded.** Where a model includes embodied emissions, say so.
  Where it does not, say that too.
- **Never reconcile.** No averaging with another model, no trimming an outlier,
  no confidence-weighted blend.

## Adding a model

1. Create `src/models/<id>.ts` implementing `CarbonModel`.
2. Fill `assumptions` honestly and completely. If you are unsure whether
   something is an assumption, it is.
3. Declare `method` and `sensitivity`, and expect the tests to check both.
4. Add golden fixtures with reference values from the model's own publication.
5. Register in the model index. Do not touch engine code.
6. Add a section to `docs/METHODOLOGY.md`.
7. Bump the package minor version.

## License

Apache-2.0. Audit evidence cannot come from a black box, so the part that
produces it is open.
