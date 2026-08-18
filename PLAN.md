# Balise: plan of action

Living document. Rules for maintaining it:

- A finished to-do gets struck through with `~~text~~` and kept, never deleted.
- New features and to-dos are appended to the relevant version section as they appear.
- Decisions go to the decisions log with a date. Superseded decisions are marked, not removed.
- Version tags (`v0`, `v0.1`, `v1`, ...) are pushed at the end of each completed slice.
- No em dashes anywhere in this file or in any user-facing string. House rule.

Companion documents, all local-only in `testing/` (gitignored): the operating manual
(invariants, stack, conventions), the design brief, and the design handoff (mockups,
screenshots, the fidelity source).

---

## Current status

**Phase: V1 in progress (2026-08-18).** `docs/METHODOLOGY.md` exists as a **v1.0 draft,
not in force**, stating exactly what the runner implements today; its section 12 lists
the thirteen decisions that need sign-off before any measurement can be presented under
"methodology v1.0", and that section has to be empty first. The reproducibility suite is
written and wired to `pnpm test:repro` and to CI: twenty-one sessions of five runs against
an unchanged fixture site, asserting one fingerprint throughout, an established floor on
every metric, no significant change on any of the twenty comparisons, and one confidence
grade per metric across every session. 158 tests pass in the normal loop. The
reproducibility suite and the four capture integration tests have not run in this
environment: playwright's chromium download completes and then extracts an incomplete app
bundle, so no browser is available here. They run in CI, which installs it.

---

## Version roadmap

| Version | Scope | Maps to the operating manual sequence |
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

## To-do: V0.x (design build-out, in progress)

- [x] ~~Run detail screen (waterfall, model outputs side by side, dispersion, fingerprint card)~~ (V0.1)
- [x] ~~Comparison screen (verdict table, attribution mock, third-party diff)~~ (V0.1, verdicts computed through classifyDelta, not hardcoded)
- [x] ~~Run detail: Resources tab~~ (V0.7, records plus a derived by-type summary; coverage is reported on decoded bytes and never presented as a transferred saving)
- [x] ~~Budgets screen (visual table + YAML toggle)~~ (V0.2, plus re-baseline history and overrides cards)
- [x] ~~Criteria workspace (tier cards, filter chips, criteria table)~~ (V0.3, filter chips functional)
- [x] ~~Declaration editor (blocking list, known gaps, live preview)~~ (V0.3, preview shares its numbers with the criteria fixture)
- [x] ~~Tender workspace, contract tracker, fleet~~ (V0.4, fleet rows reuse the compact ToleranceBand on a shared scale)
- [x] ~~PR check screen (GitHub register, radius exception)~~ (V0.2)
- [x] ~~Documents (declaration, annexe, rapport) in the print register~~ (V0.5, FIG. 3 goes through the print ToleranceBand; document content french in both locales)
- [x] ~~Public surfaces (free scan, observatory, ledger verification)~~ (V0.6, `/v/:hash` is a real permalink and the document footers link to it)
- [x] ~~ToleranceBand trend + dispersion variants~~ (V0.7, moved into packages/ui as ToleranceTrend and ToleranceDispersion, geometry unit-tested, rule 2 enforced in the component)
- [ ] ToleranceBand print register for trend and dispersion (the handoff specifies print for the canonical band only; needed when the Typst pipeline lands)
- [ ] Self-hosted font subsetting check (weight budget)

## To-do: V1 (runner)

- [x] ~~Playwright runner app with pinned Chromium~~ (V1.0, `apps/runner`; full chromium via `channel: 'chromium'`, fresh context per run, prediction and background networking off)
- [ ] Digest-locked container around it (`BALISE_IMAGE_DIGEST` and `BALISE_REGION` are read already; without them a run is marked not auditable)
- [x] ~~Cold and warm passes kept separate~~ (V1.0, the warm pass is a second navigation in the same context; the kernel already refuses to average the two)
- [ ] Full HAR + CDP trace persisted to object storage (the capture today carries the slice extraction needs)
- [x] ~~EnvironmentFingerprint recorded on every run~~ (V1.0, every field compared for invariant 3, with a test that fails if a field is ever left out of the comparison)
- [~] METHODOLOGY.md v1 **drafted**, not published and not in force. Thirteen open decisions in its section 12 need sign-off (operating manual section 29)
- [ ] Sign off the noise floor scaling factor, the throttle profile parameters and the confidence thresholds
- [x] ~~The reproducibility test: twenty runs, same verdict, in CI~~ (V1.1, `pnpm test:repro`, its own vitest config so it stays out of the normal loop, plus a CI job that installs the browser)
- [ ] Run the reproducibility suite for real and record what it says; it has never executed

Later versions: see roadmap; detailed to-dos are appended when the version starts.

---

## Decisions log

- **2026-08-17 · Context files live in `testing/`, gitignored.** All handoff material moved
  there. Nothing deleted, per instruction that there are no losses.
- **2026-08-17 · No em dashes in any user-facing surface or repo doc.** User instruction.
  The mockups contain them; replace with a middle dot, colon, or restructure when porting copy.
- **2026-08-17 · UI language follows the design canon**: English app chrome, French domain
  terms verbatim, documents entirely French. Note: the operating manual says French-first UI;
  flagged to the user, one-line switch later since all strings live in packages/i18n.
- **2026-08-17 · Carbon model constants come from published reference implementations**
  (CNUMR GreenIT-Analysis for EcoIndex, Green Web Foundation co2.js for SWD v4 and 1byte).
  Golden fixtures pin those values; any drift fails.
- **2026-08-17 · Noise floor scaling factor is provisional.** Implemented as an explicit
  parameter, default 1.2 x median historical MAD, marked provisional in code and here.
  Final value is a product decision (operating manual section 29), needs sign-off before V1 ships.
- **2026-08-17 · Delta classification includes `indeterminate`** for the no-established-floor
  case, extending the three-state contract in operating manual section 6. Honest degradation:
  without a floor there are no verdicts (design brief, states section).
- **2026-08-17 · ademe model deferred** until real Base Empreinte factors are sourced.
  Inventing factors would break the credibility invariant.
- **2026-08-17 · Trend and dispersion renderings deferred to V0.x**; canonical, compact and
  badge ship in V0. A data-driven TrendChart already exists in apps/web and moves into
  packages/ui when the run-detail dispersion variant lands.
- **2026-08-17 · V0 styling is hand-rolled CSS over the token layer** (packages/ui
  tokens.css + app.css), for pixel fidelity to the handoff. The Tailwind preset promised in
  the operating manual (packages/config) is deferred; revisit before the codebase grows past a handful
  of screens.
- **2026-08-17 · zod is the single runtime dependency of the OSS packages**, via
  @balise/schemas (Apache-2.0 so measure-core and carbon-models stay standalone). Mandated
  by the stack choice in operating manual section 4; flagged here per the ask-before-adding rule.
- **2026-08-17 · Fonts are self-hosted** through fontsource packages; no third-party font
  requests, which the dogfood budget would otherwise count against us.
- **2026-08-17 · Local working files are never committed.** The operating manual and all
  design references live in `testing/`, gitignored end to end; committed docs refer to
  them only as "the operating manual" and "the design brief". The repo history before
  this decision contains one copy of the manual (tag v0); removing it would mean
  rewriting published history, which the manual itself forbids. Flagged to the owner.
- **2026-08-17 · Comparison verdicts go through the kernel.** The screen calls
  classifyDelta and maps classification plus threshold state to the fixed verdict
  vocabulary in one tested helper. There is no second delta implementation in the
  frontend. The carbon row is the one precomputed exception until estimates get their
  own delta pipeline.
- **2026-08-17 · Code comments are written entirely in lowercase.** House style, applied
  across the whole codebase in one sweep. The only exception is exact case-sensitive
  code identifiers and real filenames (classifyDelta, MetricId, PLAN.md), which keep
  their true casing so references stay accurate.

- **2026-08-17 · "Green Web Foundation" is exempt from the banned-vocabulary test.**
  The i18n test bans marketing words including bare "green"; the exact proper noun of
  the hosting dataset (operating manual section 10 requires naming it) is stripped
  before scanning. Marketing uses of the word remain banned.
- **2026-08-17 · The print register keeps the handoff's hard-edge paper offset.** The
  design brief bans interface shadows; the 2px zero-blur offset under document pages
  is the paper edge of the print register in the handoff, not an interface shadow,
  and is kept verbatim.

- **2026-08-18 · Public surface content is french in both locales.** Same rule as the
  three documents: the free scan, the observatory and the verification page are public
  french pages, so their copy renders in french whatever the interface locale is. Only
  the nav rail labels around them follow the interface language.
- **2026-08-18 · Observatory sector chips start unselected.** The mockup draws
  "Métropoles & EPCI" as active while listing communes, a transport network, a CHU and a
  département, so the active state there is illustrative. The chips are implemented as a
  real exclusive filter that starts cleared, which is the only reading under which the
  screenshot's row set is correct. The chip set is also deliberately partial: the
  département row is reachable by no chip and stays visible in the unfiltered extract.
- **2026-08-18 · The free scan measures nothing.** It renders the captures we hold and,
  for any other domain, says so and offers the measured example. Estimating from a domain
  name would be the exact failure the product exists to argue against. The live scan
  arrives with the runner in V1.
- **2026-08-18 · An unknown empreinte is reported as unknown.** `/v/:hash` never falls
  back to the nearest or most recent record. A prefix shorter than eight characters is
  refused rather than matched loosely. Tested in `ledger-lookup.test.ts`.
- **2026-08-18 · The public estimates carry their reference model explicitly.** The
  mockups show the scan figure and the observatory bands without naming a model, which
  invariant 1 forbids. Both surfaces gained a provenance line naming the reference model
  and version, the model count and the noise floor. This is an addition to the design,
  not a deviation from it.
- **2026-08-18 · Ledger records are fixtures, not a chain.** Nothing on the verification
  page computes or checks a hash chain yet; the screen states only what the record says.
  The `ledger` package with real hashing, Merkle anchoring and adversarial tests stays a
  V5 slice, per the roadmap.

- **2026-08-18 · The trend and dispersion renderings live in `packages/ui`.** This
  completes the move flagged on 2026-08-17. Both take the kernel's `DeltaClassification`
  rather than a boolean the caller computed, so product rule 2 is mechanical: nothing but
  a `regression` can draw in breach, in either rendering. Their geometry (`trendDomain`,
  `envelopePolygon`, the two layout tables) sits in `geometry.ts` with the band's, unit
  tested without a DOM, because these components also have to render in the headless
  screenshot path for the PR comment and the PDF.
- **2026-08-18 · The run-detail dispersion verdict goes through the kernel.** It was a
  hardcoded `significant` prop. The fixture now carries the aggregated metrics and the
  floor, and the screen calls `classifyDelta`, like the comparison screen does. The delta
  and the noise ratio on that card are derived, not written down.
- **2026-08-18 · Coverage is reported on decoded bytes, in its own column.** Unused
  bytes from the coverage capture are not a transferred saving, and the two must never be
  added or compared on screen. The panel says so in a caption and points at attribution,
  which answers the transferred question per bundle.
- **2026-08-18 · The resource tail is carried as a group, not invented row by row.** The
  canon's waterfall states 76 further requests totalling 2 KB. That is implausible for a
  cold-cache run and is inherited from the mock data; rather than write a false
  explanation for it, the Resources panel shows the group as it stands and the totals
  include it. Replace it with real capture records when the runner lands, and expect the
  number to change.

- **2026-08-18 · Throttle profile parameters are provisional, in code.** `desktop-fibre`
  is unthrottled; `mobile-4g` is 1.6 Mbps down / 750 Kbps up / 150 ms with 4x CPU, which is
  what the scenario canon already quotes; `mobile-3g` is 400 Kbps each way / 400 ms with 4x
  CPU. Viewport, scale factor, locale and timezone are part of each profile. All of it is
  marked provisional in `profiles.ts` and is frozen only by METHODOLOGY.md v1, which needs
  sign-off (operating manual section 29). Changing one of these numbers afterwards is a
  breaking change to every historical comparison.
- **2026-08-18 · The user agent is fixed per profile, not taken from the host.** A run
  from a laptop and a run from the container have to ask the server the same question, so
  the platform token is fixed and only the chromium major version varies. A patch bump
  therefore does not change the user agent, while the fingerprint's `browserBuild` still
  records it.
- **2026-08-18 · A run outside the pinned container is marked, not rejected.** Image
  digest and region come from the environment; without them the fingerprint carries
  `unpinned-local`, `isAuditable` is false and the CLI says the run is not audit evidence.
  The marker is deliberately not digest-shaped so nothing downstream can mistake one for
  the other.
- **2026-08-18 · The runner uses the full chromium build, not playwright's headless
  shell.** The shell is a stripped browser; we are measuring what a visitor's browser
  does, so the browser has to be the one a visitor has.
- **2026-08-18 · The capture integration tests skip when the pinned browser is absent,
  loudly.** They probe by launching exactly what they will launch, and a second suite
  prints the install command when the probe fails. A skipped test is visible in the run
  output; a silently green suite that measured nothing would not be.
- **2026-08-18 · The runner cli reads typescript through a resolution hook, not a new
  dependency.** The workspace packages ship `.ts` and import each other with the `.js`
  specifiers nodenext requires, which node's own type stripping does not rewrite.
  `register-loader.mjs` maps them, in about fifteen lines, and is deleted the day the
  packages emit javascript. This avoided adding a typescript runner to the dependency
  surface for one command.
- **2026-08-18 · CLI strings stay inline rather than in packages/i18n.** The i18n rule
  covers what a customer reads. The runner cli is developer tooling and has no locale.

- **2026-08-18 · METHODOLOGY.md is written as a draft that is explicitly not in force.**
  Writing it down is how the open decisions become answerable: section 12 turns "what
  should the scaling factor be" into a list of thirteen items with the consequence of each
  spelled out. Nothing may be presented as evidence under "methodology v1.0" until that
  section is empty. The document states what the code does today, not what we wish it did.
- **2026-08-18 · A near-zero noise floor is pinned by a characterisation test, not
  fixed.** The floor is derived from measured dispersion, so a metric that barely varies
  gets a floor near zero and any jitter then reads as a change. Two tests in
  `measure-core` state that behaviour exactly, including the delta it misclassifies.
  Adding an absolute per-metric minimum would fix it and would also be a hand-chosen
  number, which is what the derived floor exists to avoid. It is open decision 12 in
  METHODOLOGY.md; the test is there so that whatever is chosen is chosen deliberately.
- **2026-08-18 · The reproducibility suite lives in `repro/` with its own vitest
  config.** The operating manual lists `pnpm test` and `pnpm test:repro` as separate
  commands, and the suite is a hundred page loads through a real browser. Keeping it out
  of the normal loop is not the same as moving it to a nightly job: it runs on every push
  and pull request in CI.
- **2026-08-18 · No browser runs in this development environment.** Playwright reports
  its chromium download at 100 percent and exits zero, but the extracted app bundle is
  624 KB with no framework in it, on a disk with 295 GB free. The capture and
  reproducibility suites skip loudly rather than pretending. Nothing in the runner has
  been observed measuring a real page yet, and that stays true until either CI runs green
  or the local install is fixed.

## Open questions (product, not engineering)

Carried from operating manual section 31 and the design handoff. Do not build ahead of these.

1. Tender annex vs execution report: which pain is more acute?
2. Actual weighting of environmental criteria in tenders after 21 Aug 2026.
3. Generated document vs structured evidence pack?
4. White-label vs Balise named as independent third party (changes document branding; the
   prototype keeps it as a three-mode prop).
5. What proof formats are buyers asking for?
6. Reference model default (swd@4.0 today): may the customer change it, is the change ledgered?
7. Noise floor scaling factor final value (see decisions log).
8. Observatory consent: what may be published without opt-in?
