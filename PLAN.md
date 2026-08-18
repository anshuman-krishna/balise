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

**Phase: the comparison screen is engine output (2026-08-19).** `packages/attribution`
diffs two runs and names what grew, and the comparison screen now renders what it
computes rather than a sentence typed into a fixture. The canon's regression is two
actual builds with actual source maps: `pnpm gen:attribution-canon` runs the engine
over them and writes the result, and a test recomputes the whole thing and holds the
checked-in copy to it. The two resource lists sum to the transferred medians the
comparison fixture already published, so the attribution card and the metric table
above it describe the same two runs.

The diff is taken at **module** level, not file level: bundle names carry a content
hash and rotate on every build, so pairing files would mean matching on a name
pattern, while module identity comes from the source map and survives the rotation.
Every byte of a bundle is either credited to a source file or counted as
unattributed, and blame is the commits touching a file between the baseline and
candidate commits rather than whoever last edited it.

The honest paths are the tested ones. A bundle with no map, an unreadable map or a
map that does not describe the file it was given is reported by name; if a bundle is
readable on one side and not on the other the module changes are withheld entirely,
because emitting them would report every module of that bundle as removed. A
dependency's bytes are never blamed on whoever touched the lockfile. Reconciliation
compares against decoded bytes, never transferred ones, and the card states in words
what the modules explain and what is left over. 388 tests pass across eleven packages.

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

### Attribution (packages/attribution)
- Resource and origin diff, third-party vendors named from a maintained list only.
- Source map v3 reading with its own vlq decoder; bytes credited per source file.
- Module-level diff, so a content-hashed bundle rename does not defeat the comparison.
- Blame over the commit range between the two runs, through an injected git port.
- Every function can answer "could not determine", and the module diff is withheld
  rather than half-computed.

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

## To-do: criteria (brought forward from V5)

- [x] ~~`packages/criteria-engine`: pack validation, evaluation, completion by tier, blocking findings~~
- [x] ~~`packages/rule-packs` with rgesn-2024-v2~~ (78 criteria verbatim from the official evaluation spreadsheet; extraction and generation tools checked in)
- [ ] **Sign off the tier of each criterion.** The pack proposes 9 automated, 22 assisted,
      47 declarative and ships `tiersSignedOff: false`; until that is reviewed the engine
      answers nothing automatically. This is the gate, not a formality.
- [ ] Sign off the evaluation thresholds. The referential asks questions and sets almost
      no numbers, so every threshold in an `evaluation` block is ours.
- [x] ~~Decide the pack authoring format~~ (typescript module generated from the official
      spreadsheet, with the yaml emitted from it as the readable copy; inverts the workflow
      in section 21 and avoids a yaml parser in an OSS package)
- [ ] Wire the criteria workspace and the declaration editor's blocking list to the
      engine. Waits on the pack: feeding fourteen fixture criteria through it would produce
      totals that contradict the canon's 78.
- [ ] Evaluation types beyond `metric_threshold`, once the pack says which are needed

## To-do: attribution (V4)

- [x] ~~`packages/attribution`: resource diff, origin diff, source map reading, module
      diff, reconciliation, blame~~ (91 tests)
- [x] ~~Honest degradation on every path: per-bundle reasons, withheld module diff,
      no vendor named without a match, no person blamed for a dependency~~
- [ ] Fetch source maps from the customer's build artifacts or a configured url,
      use them and discard them. The package is pure and takes them as input; the
      fetching side and its retention rule belong to the runner or the api
- [x] ~~Wire the comparison screen to the engine~~ (`pnpm gen:attribution-canon`
      builds two bundles with real source maps, runs the engine over them and writes
      the result; a test recomputes it and holds the checked-in copy to it)
- [x] ~~Phrase the plain-language sentence in `packages/i18n`~~ (`fillParts` keeps
      the sentence one translatable string while still marking its identifiers and
      quantities, so the clause order stays the translator's)
- [ ] Index maps (`sections`), once a customer build produces one

## To-do: ledger (brought forward from V5)

- [x] ~~`packages/ledger`: canonical json, entry hashing, per-tenant chain, append-only~~
- [x] ~~Verification that reports findings instead of repairing anything~~
- [x] ~~Merkle root and anchoring~~
- [x] ~~Adversarial tests: edited payload, recomputed hashes, removal, reordering, splicing, backdating, edited correction reason~~
- [x] ~~Wire the web app's canon to a computed chain~~ (generated by `pnpm gen:ledger-canon`, held to the generator by a test)
- [ ] Postgres store with INSERT and SELECT grants only, and the migration that revokes UPDATE and DELETE
- [ ] RFC 3161 timestamping for customers who ask

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

- **2026-08-18 · The ledger was brought forward from V5.** It needs no browser, no
  database and no network, so it could be built and fully verified now, while the runner
  work is blocked on an environment that cannot install a browser. Nothing else in the
  roadmap was reordered.
- **2026-08-18 · Canonical json before hashing.** Key order, `undefined`, `-0` and
  non-finite numbers all have to be pinned down, or the same facts hash differently
  depending on how the object was built and the chain stops verifying. `undefined` is
  dropped from objects but refused inside an array, where dropping it would silently shift
  every later element.
- **2026-08-18 · An odd node in the Merkle tree is promoted, not duplicated.**
  Duplicating the last leaf, as bitcoin does, makes two different leaf sets produce the
  same root. That is precisely the property a tamper-evident structure must not have.
  Pinned by a test.
- **2026-08-18 · `LedgerStore` has no update and no delete.** Invariant 4 is enforced by
  the shape of the interface as well as by the database grants that will sit behind it.
  There is no repair utility: a broken chain is the finding, and it is surfaced.
- **2026-08-18 · The entry hash covers position, time and the correction reason.**
  Backdating an entry, moving it, or editing why a correction was made all change the
  hash, and the next entry's link then fails. Each case has its own adversarial test.

- **2026-08-18 · The canon register is generated, not typed in.**
  `apps/web/scripts/ledger-canon-source.ts` builds the chain with fixed timestamps and
  fixed payloads, so running it twice is byte-identical, and the generator writes only the
  entries a surface cites. Everything displayed is then a real sha-256 of a real payload
  at a real position. The full chain is 4 820 entries because the canon retains 4 812
  runs; the run every document cites lands at entry 4 819 rather than the design's
  4 812, and the difference is the seven narrative entries interleaved by date.
- **2026-08-18 · Crypto stays out of the browser bundle.** The ledger is a server
  concern, so the web app never hashes anything: it reads generated data, and the
  verification statement it shows was computed by the real verifier at generation time.
  The generated file carries one `as unknown as` cast, explained in place, and the test
  that parses every entry through `LedgerEntry` and recomputes both hashes is what makes
  it safe. Doing it any other way would have pulled zod into the bundle.
- **2026-08-18 · The verification page shows nothing an entry does not carry.** Models,
  environment fingerprint and recorded values are rendered only when the payload holds
  them, so a declaration entry does not borrow a run's fingerprint to look complete.
- **2026-08-18 · A canon inconsistency inherited from the design, now visible.** The
  declaration editor shows v3 as a blocked draft while the published declaration document
  renders v3 as established. Wiring the register forced the question, because a version
  either has a ledger entry or it does not. The chain records `declaration_v3` so the
  document has something real to cite; the editor screen is unchanged. Resolving which of
  the two is right is a product call.

- **2026-08-18 · The criteria engine was brought forward from V5**, for the same reason
  as the ledger: it is pure, so it could be built and fully verified here while the runner
  is blocked on the environment.
- **2026-08-18 · An unanswerable criterion is `non_evalue`, never `non_conforme`.** Not
  having looked is not the same as having failed, and a declaration that reported one as
  the other would be lying in the customer's favour or against it depending on the
  criterion. The engine carries the reason in french on every one of them.
- **2026-08-18 · An assisted answer is a proposal and counts for nothing.** It is
  excluded from the completion figure, excluded from the conformity rate, and it blocks
  publication until a person confirms it. This is the tier model made mechanical rather
  than left to the interface.
- **2026-08-18 · A human attestation overrules a measurement.** A named person put their
  name to it; the engine does not get to overrule that. The assessment records who and
  when.
- **2026-08-18 · `non_applicable` needs a justification too.** The official grid requires
  one for anything that is not conforme, and "does not apply" is the easiest status to
  reach for. Whitespace does not count as a justification.
- **2026-08-18 · The rgesn pack is not written and will not be invented.** Section 11
  requires the statement text verbatim from the official referential and section 29 makes
  the tier of each criterion a decision to take with someone. The engine ships with two
  fixture packs instead, which is also what proves it is referential-agnostic.

- **2026-08-18 · The referential text comes from the official spreadsheet, not the
  PDF.** Both are published; the spreadsheet is the machine-readable one and its "libellé
  du critère" column is the statement verbatim. Extracting from the PDF was tried first
  and lost text in 21 of 78 statements; where the PDF extraction was intact it agreed with
  the spreadsheet exactly, which is what confirms the source. The extraction tool is
  checked in with the source json it produced.
- **2026-08-18 · The pack is authored in typescript and the yaml is generated from it.**
  The operating manual section 21 has it the other way round, but reading yaml means a
  parser dependency inside an OSS package, and section 5 makes that a trust-surface
  decision to ask about. The yaml is still checked in and is still what an auditor reads.
  Reversible the day a parser is agreed.
- **2026-08-18 · `tiersSignedOff` is a gate in code, not a note in a document.** An
  unsigned pack cannot produce a single automatic answer: every criterion comes back
  `non_evalue` naming the pack, and only a human attestation gets through. The tier of a
  criterion decides whether the product may answer it without a person, which section 29
  puts outside engineering, so the safe state had to be the default rather than the
  reminder.
- **2026-08-18 · The automated count is 9, not the manual's rough 20.** Automated is used
  only where the current metric set answers the question outright. The referential is
  mostly organisational, and most of what looks automatable needs a person to confirm what
  the capture found. Under-claiming is the correct direction of error here.
- **2026-08-18 · The criteria workspace is not wired to the pack yet.** With the tiers
  unsigned the engine answers nothing, so a wired screen would show 78 criteria at zero
  percent and contradict the canon's 59%. Wiring needs either the sign-off or a full set
  of fixture attestations for all 78, and either is a deliberate act rather than a side
  effect of landing the pack.

- **2026-08-19 · Attribution was brought forward from V4**, for the third time the
  same reason: it is pure, so it could be built and fully verified here while the
  runner waits on an environment that cannot install a browser. Nothing else in
  the roadmap was reordered.
- **2026-08-19 · The diff is taken at module level, not at file level.** Bundle
  file names carry a content hash and rotate on every build, so pairing
  `app.a3f2.js` with `app.b81c.js` would mean matching on a name pattern, which is
  the filename heuristic the honest-degradation rule forbids. Module identity comes
  out of the source map and survives the rename, so that comparison is exact. The
  resource diff still reports the rename as one removal and one addition, because
  that is what happened on the wire.
- **2026-08-19 · An asymmetric failure withholds the whole module diff.** If a
  bundle is readable on one side and not on the other, no module changes are
  emitted at all. The alternative is worse than useless: every module of that
  bundle reads as removed, and a fabricated 160 KB removal is a finding we
  invented. The first version of this rule withheld the diff whenever *any*
  bundle failed, which one unmappable third-party tag would have been enough to
  trigger for the whole page; the rule is now symmetry, not perfection. A bundle
  that fails identically on both sides contributes nothing to either total, so
  the comparison still holds and its bytes surface in the reconciliation as
  unexplained. The per-bundle outcomes are in the report either way, so a surface
  can name the bundle that stopped it.
- **2026-08-19 · Reconciliation is against decoded bytes, never transferred
  ones.** A source map explains the file as written, not as compressed. The report
  carries both quantities and never substitutes one for the other, in either
  direction, which is the same rule the run-detail coverage column already
  follows.
- **2026-08-19 · Unmapped bytes are reported, not spread.** Bundler prelude,
  runtime and banners are counted as unattributed. Distributing them across the
  named sources would make the columns add up and would attribute bytes to files
  that did not contain them.
- **2026-08-19 · Blame is a commit range, not a last-touch.** The commits asked
  for are those touching the file between the baseline run's commit and the
  candidate run's commit, which are the commits responsible for the change being
  explained. "Who last edited this file" is a different question and frequently
  names the wrong person.
- **2026-08-19 · A dependency is never blamed on a person.** Bytes under
  node_modules come back as `third-party-module` with the package named, and the
  repository is not even queried. The lockfile author is not the author of those
  bytes.
- **2026-08-19 · The source map reader is written here, not taken from a
  dependency.** The vlq decoder and the mapping walk are about a hundred and fifty
  lines, and this package's whole job is to be defensible in front of an auditor.
  The package's only dependency stays `@balise/schemas`.
- **2026-08-19 · The vendor list is short and matched exactly.** Third-party
  origins match on the full hostname or on a dot boundary. No fuzzy matching: a
  near miss would put a named company on traffic that is not theirs. An unmatched
  origin is still reported, by hostname, with its measured cost.
- **2026-08-19 · The git port is injected, and the cli implementation is a
  separate entry point.** The pure core imports nothing from node, and the one
  place that shells out passes its arguments as an array, never through a shell,
  refuses a path that leaves the repository, and only ever reads. Invariant 10
  holds by construction rather than by care.
- **2026-08-19 · The bundle fixtures carry their own vlq encoder.** The test
  builder encodes mappings independently of the decoder under test and counts
  expected bytes with TextEncoder rather than with the package's own counter, so a
  green test is not two halves of the same mistake agreeing. The decoder is
  additionally held to hand-computed literals from the base64 alphabet.

- **2026-08-19 · The canon's regression is two real builds, not a sentence.**
  `apps/web/scripts/attribution-canon-source.ts` assembles a baseline and a candidate
  bundle with real source maps and runs the engine over them, the way the ledger
  canon builds a real chain. Every figure on the comparison screen is therefore
  computed: the 160 KB is the sum of three locale modules the map actually points at,
  and the 24 KB remainder is bundler output no mapping covers. The two resource lists
  sum to the transferred medians the comparison fixture already published (1 114 000
  and 1 298 000 bytes, 82 and 84 requests), so the card and the metric table above it
  are two views of the same pair of runs rather than two unrelated fixtures.
- **2026-08-19 · The suggested-fix panel became a coverage statement.** The mockup
  ends the attribution card with a remediation and an estimated recovery. Neither is
  measurable from a source map, and inventing them is the speculation the attribution
  rules exist to prevent. The panel now says what the modules explain and what they do
  not, in the same position and the same register. A deliberate deviation from the
  handoff.
- **2026-08-19 · The lead sentence stays one translatable string.** `fillParts` fills
  the placeholders and marks each substitution as an identifier or a measured
  quantity, so the card can typeset them differently without the sentence being cut
  into fragments a translator cannot reorder. French and English word order differ
  here and the fragment approach would have forced one of them to read badly.
- **2026-08-19 · A sub-kilobyte delta is shown in bytes.** `src/lib/dates.ts` grew by
  120 bytes, which rounds to 0 KB. A change rounded away is still a change, so the
  formatter switches unit rather than losing it.
- **2026-08-19 · The screen no longer names a PR number.** The mockup's sentence ends
  "introduced by PR #412". Blame returns commits, so the card names the commit and its
  author; the pull request number survives in the commit subject where a squash merge
  puts it. Nothing is invented to match the mockup's wording.

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
