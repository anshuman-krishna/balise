# 0006. The palette carries its own contrast, and a test holds it there

- **Status**: Accepted
- **Date**: 2026-08-21
- **Area**: interface

## Context

The visual thesis is an instrument: dense, quiet, small type, monospaced
numerals. The design brief's palette was written for that look and the tokens
were used verbatim.

Nobody had measured them. Computing WCAG contrast across the token file found
three failures, all of them on text:

| Token | On | Ratio | Needed |
| --- | --- | --- | --- |
| `--text-tertiary` `#8b939b` | `--paper` | **2.82** | 4.5 |
| `--caution` `#c4761a` | `--paper` | **3.20** | 4.5 |
| `--on-dark-muted` `#6e767e` | `--ink` | **3.87** | 4.5 |

None of these could be fixed by using them only at large sizes, because the
large-text exemption starts at 24px regular and this interface runs from 7.5px
to about 15px. `--text-tertiary` appears at 70 call sites, every one of them
small text. `--caution` is the low confidence colour, which invariant 1 requires
to be visible everywhere a figure is.

A fourth failure was the focus ring. The global `:focus-visible` outline used
signal blue, which reaches 6.8:1 on paper and **2.4:1 on ink**, below the 3.0
that a UI component boundary needs. Every link in the navigation rail is on ink,
so keyboard focus was effectively invisible on the one component a keyboard user
traverses on every route.

This matters more here than it would elsewhere. RGAA is the planned second rule
pack, and shipping an inaccessible tool that sells accessibility declarations is
an unforced embarrassment.

## Decision

Three tokens are darkened until they clear 4.5:1 on the background they are used
against, preserving hue:

- `--text-tertiary`: `#8b939b` to `#686e74` (4.67 on paper, 5.16 on surface)
- `--caution`: `#c4761a` to `#9e5f14` (4.64 on paper, 5.12 on surface)
- `--on-dark-muted`: `#6e767e` to `#7d858d` (4.76 on ink)

`--tint-caution` moves with `--caution` so the wash matches the colour it is a
wash of.

The focus ring becomes a token, `--focus-ring`, defaulting to `--measured` and
redefined to `--measured-on-dark` inside `.nav-rail` and `.card-dark`. Elements
that are themselves dark buttons keep the default, because their ring is drawn
on the page behind them rather than on the button.

`packages/ui/test/contrast.test.ts` reads `tokens.css`, computes the ratios, and
asserts them. The list of tokens used as text **is** the policy: adding a colour
and using it for text means adding it to that list, and a colour that does not
reach 4.5 does not ship as text.

## Consequences

- Three brand values moved. `caution` is a deeper amber than the brief's. In an
  instrument register that reads as more considered rather than less, and the
  alternative was a semantic colour nobody with average vision could read at 9px.
- Tertiary text is closer to secondary than it was, so the third level of
  hierarchy is quieter in its distinction. Legibility wins that trade.
- `tokens.css` is now load-bearing for a test in another package. That coupling
  is deliberate: the tokens are the design system's public surface.
- The check runs on every commit, so a future palette change cannot silently
  reintroduce this. Reverting `--text-tertiary` fails two tests by name.
- The audit found no failure in `--conforme` (4.58), `--breach` (5.61) or
  `--measured` (6.76). Those stand as the brief wrote them.
- Translucent tokens (borders, dividers, tracks) sit well below 3.0 against
  paper. They are decorative separators rather than UI component boundaries or
  meaningful graphics, so 1.4.11 does not apply to them. The test pins that
  reading rather than leaving it implicit.

## Alternatives considered

**Add `--caution-text` beside `--caution`, following the existing `-on-dark`
precedent, and migrate only the text call sites.** The more surgical option and
the one first attempted. Abandoned on inspection: of 41 `--caution` references,
most flow through view modules (`verdict.ts`, `criteria-view.ts`,
`corpus-view.ts`, `engagement-view.ts`) that return a colour consumed as text.
The split would have doubled the token count for a distinction that almost never
applies, and left the wrong one reachable by default.

**Constrain usage by size instead of changing the colour.** Not available. The
exemption starts at 24px and nothing in the instrument register is near it.

**Leave the palette and note the failures.** Considered and rejected. A recorded
accessibility defect in a product whose second rule pack is RGAA is worse than a
palette that departs from a brief by 20% luminance.
