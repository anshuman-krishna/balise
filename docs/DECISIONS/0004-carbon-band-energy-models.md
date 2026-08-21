# 0004. The carbon band carries energy models only

- **Status**: Accepted
- **Date**: 2026-08-20
- **Area**: measurement

## Context

The product's signature element is a band across carbon models rather than a
single headline figure, because models disagree and that disagreement is
information. Three models are implemented: EcoIndex, Sustainable Web Design v4,
and 1byte.

On the same page they disagree by a factor of 31: EcoIndex 2.44 gCO2e, 1byte
0.301, SWD 0.078. A band spanning 0.078 to 2.44 communicates nothing except that
the product does not know.

The disagreement is structural rather than a bug. SWD and 1byte multiply data
volume by an energy intensity and an emissions intensity. EcoIndex scores a page
from DOM nodes, requests and page weight, and reads a gCO2e figure off that
score with `2 + 2 x (50 - score) / 100`. Feed EcoIndex the same page on French
nuclear and on a coal grid and it returns the same number, because electricity
is not one of its inputs.

That is not a defect in EcoIndex. It answers a different question, one the
referential's own audiences read fluently: how heavy is this page, on a scale
calibrated against the French web.

## Decision

A band is drawn across models that estimate the same quantity.

- The gCO2e band carries the **energy models**.
- **EcoIndex is reported beside the band as its published output**: a score out
  of 100 and a grade from A to G. Its gCO2e figure stays available in the model
  detail, labelled as derived from the score.
- A model declares its `method` and its `sensitivity` **as data**, the same way
  it declares its assumptions, and `bandModels()` applies the rule from that
  declaration rather than from a list of names. Adding an energy model widens
  the band; adding a score-derived one does not.

Reasoning is in `docs/METHODOLOGY.md` section 10.1.

## Consequences

- The run detail draws two axes rather than one. A score-derived figure on the
  band's axis crushed the two models that share it.
- Eleven surfaces read one carbon canon, so no two state a different footprint.
- The band is narrower and therefore looks more confident. It is not more
  confident; it is a band across two things that are comparable instead of three
  things that are not, and the third is still on the screen.
- 1byte is in the band and does **not** use the measured grid intensity: its
  published constants are a US data centre mix and a 2018 global network
  average, applied unconditionally by the reference implementation. That is a
  caveat on one edge of the band, carried in the model's own assumptions.
- The first draft of the rule said "models that respond to grid intensity and
  hosting". The sensitivity suite failed it immediately, because 1byte does not
  track the grid, and the rule moved to the line that actually holds. That test
  now runs each model twice on different grids and twice on green and grey
  hosting, and fails a model that declares a sensitivity it does not have.

## Alternatives considered

**Band all three and explain the width.** The honest-looking option, and the one
that says something untrue: it asserts that 0.078 and 2.44 are two estimates of
one quantity.

**Drop EcoIndex.** Not available. It is the model French public buyers and the
referential's audience know by name, and its grade is what a declaration is read
against.

**Normalise EcoIndex onto the energy scale.** This is averaging models by
another name, and it would require inventing a conversion nobody published.
