# Balise: plan of action

Living document. Rules for maintaining it:

- A finished to-do gets struck through with `~~text~~` and kept, never deleted.
- New features and to-dos are appended to the relevant version section as they appear.
- Decisions go to the decisions log with a date. Superseded decisions are marked, not removed.
- Version tags (`v0`, `v0.1`, `v1`, ...) are pushed at the end of each completed slice.
- No em dashes anywhere in this file or in any user-facing string. House rule.

Companion documents: `CLAUDE.md` (operating manual, invariants, stack), `testing/CLAUDE-2.md`
(design brief, gitignored), `testing/design_handoff_balise 2/` (mockups, fidelity source).

---

## Current status

**Phase: V0 shipped (2026-08-17), V0.1 next.** The monorepo builds, typechecks, lints and
passes 97 tests: measurement kernel (median/MAD, noise floor, classifyDelta, confidence),
three carbon models with golden fixtures pinned to published reference implementations,
design tokens, ToleranceBand (canonical, compact, badge, print patterns), and the Dashboard
on canon fixture data, visually verified against the design reference. Remaining surfaces
are designed placeholder states. Next slice: run detail and comparison screens.

---

## Version roadmap

| Version | Scope | Maps to CLAUDE.md sequence |
| --- | --- | --- |
| **V0** | Monorepo, schemas, measure-core statistics kernel, carbon-models (ecoindex, swd, onebyte), i18n, ui tokens + ToleranceBand, web shell + Dashboard on fixture data | Weeks 1-2 (kernel core) + design foundation |
| **V0.x** | Remaining instrument screens on fixture data: run detail, comparison, budgets, criteria, declaration editor, tender, contract, fleet, PR check mock, public surfaces | Design build-out |
| **V1** | Runner: Playwright + pinned Chromium, HAR/CDP capture, EnvironmentFingerprint, extraction wired to real captures, METHODOLOGY.md v1, the twenty-run reproducibility test | Weeks 1-2 exit test |
| **V2** | API (Fastify) + Postgres 16 + RLS + pg-boss, real data model, TanStack Query in web | Week 2-3 |
| **V3** | Budgets + balise.yml + GitHub check (Octokit), PR comment SVG | Week 3 |
| **V4** | Attribution: bundle diff, source maps, blame; honest "attribution unavailable" path | Week 4 |
| **V5** | Criteria engine, rgesn-2024-v2 rule pack, declaration workflow, ledger (hash chain, /v/:hash) | Week 5 |
| **V6** | Documents: Typst service, tender annex, execution report, declaration PDF; deterministic renders | Week 6 |
| **V7** | Free scan, observatory, multi-tenancy, auth, billing. Ship | Week 7 |

---

## Feature list

### Measurement kernel (packages/measure-core) [OSS]
- Median + MAD aggregation, never mean. Pure functions, no IO.
- Noise floor per metric per scenario from rolling history (minimum 20 aggregations).
- `classifyDelta`: the one implementation of "is this change real". Exhaustive tests.
- Confidence grading (high / medium / low) from dispersion, sample count, fingerprint stability.
- Metric extraction from raw captures (resources, DOM counts, JS time, third-party share).

### Carbon models (packages/carbon-models) [OSS]
- One `CarbonModel` interface; adding a model never touches engine code.
- `ecoindex` (CNUMR reference: quantile tables, score, grade A-G, GES gCO2e).
- `swd` v4 (Sustainable Web Design: published segment constants, grid intensity input).
- `onebyte` (Shift Project via co2.js reference constants).
- `ademe` (Base Empreinte factors): planned, needs verified factor data first.
- Assumptions are data, rendered wherever an output appears. Models are never averaged.

### Schemas (packages/schemas)
- Zod as single source of truth, branded IDs, inferred types, closed error-code enum (V2).

### UI (packages/ui + apps/web)
- Design tokens per the brief: ink/paper/surface palette, Archivo + Public Sans + Martian Mono,
  zero radius, no shadows, no gradients.
- ToleranceBand: canonical / compact / badge sizes now; trend, dispersion, print register next.
  Enforces in code: no bare numbers, breach only past the noise floor, dashed median on low
  confidence, never green.
- Screens: Dashboard first, then the other 14 surfaces from the handoff.

### Platform (proprietary, later versions)
- Runner, API, ledger, attribution, criteria engine, rule packs, documents, billing:
  see roadmap above.

---

## To-do: V0 (done 2026-08-17)

- [x] ~~Monorepo scaffold: pnpm workspaces, turborepo, base tsconfig, eslint~~
- [x] ~~packages/schemas: ids, metrics, capture, fingerprint, noise floor, delta, carbon shapes~~
- [x] ~~packages/measure-core: statistics, extract, aggregate, noise floor, classifyDelta, confidence + full test suites~~
- [x] ~~packages/carbon-models: interface, ecoindex, swd v4, onebyte + golden fixtures from published reference values~~
- [x] ~~packages/i18n: en + fr catalogs, typed keys, no hardcoded strings in web~~
- [x] ~~packages/ui: tokens.css, ToleranceBand (canonical, compact, badge), ConfidenceBadge, geometry tests~~
- [x] ~~apps/web: Vite + React 19 shell, nav rail with the four groups, app bar with fingerprint row, Dashboard screen on canon fixtures~~
- [x] ~~Placeholder screens for the 14 unbuilt surfaces (designed empty states, not blanks)~~
- [x] ~~Root: typecheck, tests, build all green~~ (97 tests, 6 packages)
- [x] ~~Commit and push v0~~

## To-do: V0.x (design build-out, next)

- [ ] Run detail screen (waterfall, model outputs side by side, dispersion, fingerprint card)
- [ ] Comparison screen (verdict table, attribution mock, third-party diff)
- [ ] Budgets screen (visual table + YAML toggle)
- [ ] Criteria workspace (tier cards, filter chips, criteria table)
- [ ] Declaration editor (blocking list, known gaps, live preview)
- [ ] Tender workspace, contract tracker, fleet
- [ ] PR check screen (GitHub register, radius exception)
- [ ] Documents (declaration, annexe, rapport) in the print register
- [ ] Public surfaces (free scan, observatory, ledger verification)
- [ ] ToleranceBand trend + dispersion + print register variants
- [ ] Self-hosted font subsetting check (weight budget)

## To-do: V1 (runner)

- [ ] Playwright runner app with pinned Chromium in a digest-locked container
- [ ] HAR + CDP trace capture, cold and warm passes kept separate
- [ ] EnvironmentFingerprint recorded on every run
- [ ] METHODOLOGY.md v1 published (requires sign-off, CLAUDE.md section 29)
- [ ] The reproducibility test: twenty runs, same verdict, in CI

Later versions: see roadmap; detailed to-dos are appended when the version starts.

---

## Decisions log

- **2026-08-17 · Context files live in `testing/`, gitignored.** All handoff material moved
  there. Nothing deleted, per instruction that there are no losses.
- **2026-08-17 · No em dashes in any user-facing surface or repo doc.** User instruction.
  The mockups contain them; replace with a middle dot, colon, or restructure when porting copy.
- **2026-08-17 · UI language follows the design canon**: English app chrome, French domain
  terms verbatim, documents entirely French. Note: CLAUDE.md section 2 says French-first UI;
  flagged to the user, one-line switch later since all strings live in packages/i18n.
- **2026-08-17 · Carbon model constants come from published reference implementations**
  (CNUMR GreenIT-Analysis for EcoIndex, Green Web Foundation co2.js for SWD v4 and 1byte).
  Golden fixtures pin those values; any drift fails.
- **2026-08-17 · Noise floor scaling factor is provisional.** Implemented as an explicit
  parameter, default 1.2 x median historical MAD, marked provisional in code and here.
  Final value is a product decision (CLAUDE.md section 29), needs sign-off before V1 ships.
- **2026-08-17 · Delta classification includes `indeterminate`** for the no-established-floor
  case, extending the three-state contract in CLAUDE.md section 6. Honest degradation:
  without a floor there are no verdicts (design brief, states section).
- **2026-08-17 · ademe model deferred** until real Base Empreinte factors are sourced.
  Inventing factors would break the credibility invariant.
- **2026-08-17 · Trend and dispersion renderings deferred to V0.x**; canonical, compact and
  badge ship in V0. A data-driven TrendChart already exists in apps/web and moves into
  packages/ui when the run-detail dispersion variant lands.
- **2026-08-17 · V0 styling is hand-rolled CSS over the token layer** (packages/ui
  tokens.css + app.css), for pixel fidelity to the handoff. The Tailwind preset promised in
  CLAUDE.md (packages/config) is deferred; revisit before the codebase grows past a handful
  of screens.
- **2026-08-17 · zod is the single runtime dependency of the OSS packages**, via
  @balise/schemas (Apache-2.0 so measure-core and carbon-models stay standalone). Mandated
  by the stack choice in CLAUDE.md section 4; flagged here per the ask-before-adding rule.
- **2026-08-17 · Fonts are self-hosted** through fontsource packages; no third-party font
  requests, which the dogfood budget would otherwise count against us.

## Open questions (product, not engineering)

Carried from CLAUDE.md section 31 and the design handoff. Do not build ahead of these.

1. Tender annex vs execution report: which pain is more acute?
2. Actual weighting of environmental criteria in tenders after 21 Aug 2026.
3. Generated document vs structured evidence pack?
4. White-label vs Balise named as independent third party (changes document branding; the
   prototype keeps it as a three-mode prop).
5. What proof formats are buyers asking for?
6. Reference model default (swd@4.0 today): may the customer change it, is the change ledgered?
7. Noise floor scaling factor final value (see decisions log).
8. Observatory consent: what may be published without opt-in?
