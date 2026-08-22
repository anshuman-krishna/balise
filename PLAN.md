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

**Phase: the environment is one object (2026-08-21).** Invariant 3 says two runs are
comparable only when their fingerprints match. The schema was real, the runner built one on
every capture, the ledger recorded one per run, and the interface described the environment
four other ways, none of them connected to any of that.

The app bar carried a typed string reading `desktop-fibre + mobile-4g`, which is two
throttle profiles at once and therefore no fingerprint at all, on the bar whose stated
purpose is answering "how do I know this is comparable". The run detail's panel typed
`mobile-4g (1.6 Mbps / 4x CPU)`, which is the runner's profile table restated by hand and
free to drift from it, and omitted viewport, device scale factor, locale and timezone, which
are fields the comparison actually checks. The comparison screen printed a green
`FINGERPRINT MATCH` chip and the run detail a green "comparison permitted without a flag"
note, **with nothing checking either**. Three more surfaces typed `profile: 'mobile-4g'`.

A scenario names a profile now and everything else is expanded from it. `THROTTLE_PROFILES`
moved to `@balise/schemas`, where the runner and the screens read one table.
`buildFingerprint`, `fingerprintsMatch`, `fingerprintDifferences` and
`summariseFingerprints` moved to `@balise/measure-core`, because comparability is a
measurement rule and an auditor reading the open packages should find invariant 3
implemented there. `fingerprintDifferences` is driven from `FINGERPRINT_FIELDS`, which a
compile-time assertion holds exhaustive against the schema, so a field added to the
fingerprint is compared from the day it exists.

What the bar says now is derived and is more interesting than what it said: the service
median runs without coverage instrumentation and the pull request scenario runs with it,
because the check reports unexecuted bytes and v8 precise coverage costs time on every run.
So the bar states the browser, the image, the profile and the region as themselves, and
prints **coverage varies** in caution. Those two scenarios are not comparable to each other,
and the product says so on its busiest surface, which puts METHODOLOGY open decision 14 in
front of a user rather than in a document.

**Two failures were sitting behind the task cache.** `turbo.json` declared `test` and
`typecheck` with no `dependsOn`, so a package's hash covered its own files and nothing
upstream: changing `packages/schemas` re-ran one task and left eleven cached. Which means
`pnpm typecheck` and `pnpm test` could report green on a workspace that does not compile,
and did. `apps/runner/src/measure.ts` had not compiled since the slice that made
`ConfidenceContext.noiseFloor` required, in the only code that measures anything. And
`packages/budgets/test/report.test.ts` had been failing for three slices, still expecting
`842 KB ± 3 KB` after the shared formatter started keeping a decimal below 10 KB. Both were
found the moment the cache key was corrected. The runner's grading is also extracted into
`gradeAggregate` now, so the decision can be tested without a browser: nothing caught it
because `measure()` needs chromium and no test called it. ADRs 0007 and 0008. 879 tests.

**Then: the palette is measured (2026-08-21).** A product whose second rule pack is RGAA
had never computed a contrast ratio against its own tokens. Four failures, all on text a
keyboard or low-vision reader has to read.

`--text-tertiary` (#8b939b) reaches **2.82:1** on paper against the 4.5 body text needs, at
70 call sites, every one of them between 7.5 and 10 px. `--caution` (#c4761a) reaches
**3.20:1**, and caution is the low confidence colour, which invariant 1 requires to be
visible on every surface a figure appears on. `--on-dark-muted` reaches **3.87:1** on ink.
And the global focus ring was signal blue, 6.8:1 on paper and **2.4:1 on ink**, so keyboard
focus was effectively invisible on the navigation rail, which is the one component a
keyboard user traverses on every route.

None of the three could be fixed by restricting them to large text: the exemption starts at
24 px and this interface runs from 7.5 px to about 15 px. So the three are darker, preserving
hue, at 4.67, 4.64 and 4.76. The focus ring is a token now, `--focus-ring`, redefined inside
`.nav-rail` and `.card-dark`; an element that is itself a dark button keeps the default,
because its ring is drawn on the page behind it rather than on the button.

`packages/ui/test/contrast.test.ts` reads `tokens.css` and computes the ratios, so the list
of tokens allowed as text is the policy rather than a convention. Reverting one value fails
two tests by name. The audit also confirmed what does not need changing: `--conforme` 4.58,
`--breach` 5.61, `--measured` 6.76, all as the brief wrote them.

Three structural fixes came with it. A **skip link**, off screen until focused, first in the
tab order, clearing the 212 px rail so its own ring lands on paper: the rail is seventeen
links deep and a keyboard reader should not walk it on every route. **`lang` is declared
where the language actually changes**: the document element takes the app locale from
`i18n.ts` rather than from a string typed in `index.html`, and `<main>` carries `lang="fr"`
on the document and public registers, which are french whatever the chrome is. And `/v/:hash`,
the permalink printed on every document, had **no `main` landmark at all**, because it
deliberately renders with no chrome; it now takes a bare shell that gives it the landmark and
the language without giving it navigation. A `prefers-reduced-motion` block is in place ahead
of any motion existing, so the preference is respected rather than remembered. 844 tests.

**Then: the packages are publishable (2026-08-21).** The whole competitive argument is
that our measurement is the most *defensible* on the market, not the most accurate, and the
mechanism for that argument is that four packages are Apache-2.0 and an auditor can read
every line that produced a number. None of the four could have been published.

There was no `LICENSE` file in any of them, on packages whose `license` field said
Apache-2.0. There was no README for `measure-core` or `criteria-engine`, the two that matter
most. There was no `files` field, so a publish would have shipped tests and fixtures; no
`repository` field, so npm would have shown no source link on packages whose entire claim is
that you can read the source; no build, so the published `exports` pointed at TypeScript;
and no check that any of it stayed true.

Five packages are published, not four: `@balise/schemas` goes too, because the other four
depend on it and a dependency an auditor cannot read defeats the purpose of the four. Each
one now carries the Apache text, a README written for someone who has never seen this
repository, a changelog, and a `tsconfig.build.json` that emits JavaScript and declarations.
`publishConfig` swaps the exports map at pack time, so the workspace keeps resolving to
`src` while the tarball resolves to `dist`.

Two scripts hold it. `scripts/check-package-surface.mjs` reads every published package and
fails on a missing licence, a missing changelog, a runtime dependency not on an explicit
allowlist, an import of something undeclared, an import of a Node builtin, or a source file
that calls `fetch`, reads `process.env`, or reaches for `Date.now` or `Math.random`. The
last three are the reproducibility promise stated as a grep: a model that can read a clock
is a model whose output is not reproducible. `scripts/verify-standalone.mjs` packs the five,
installs the tarballs into an empty directory, and runs them there, which is the only path a
consumer will ever take. It asserts the refusals rather than the answers: no history gives
no floor, no floor gives `indeterminate` and `low`, and an unsigned pack answers nothing.

The dependency audit the operating manual has required since day one is in CI now, in two
steps: the production tree at high severity blocks, the full tree at moderate reports.
Releasing is `workflow_dispatch` only, and the reasoning is in the workflow file: an
automated publish on every green main would put the measurement kernel on npm before a
person decided it was ready, and once an auditor has installed 0.2.0, unpublishing is not a
fix. 817 tests.

**Then: an engagement is one object (2026-08-21).** The tender proposes contractual
engagements, the contract carries them, and the execution report reports on them. All three
authored their own copy of the same four rows, and the copies disagreed.

The tender put 11 % of headroom on 1 258 KB against a 1 400 KB ceiling and the tracker put
10 % on the same pair, because each screen carried a number rather than a definition. The
tracker filled the conformity gauge to 0 % and the report filled the same gauge to 78 %,
both saying they read the assessments. And the execution report's table reported the
supplier `nonTenu` on the third-party share, which is a declaration of contractual breach,
for an engagement the tender left unchecked and the contract does not contain. Two
paragraphs below it, on the same page, the narrative calls that figure a target "que nous
nous fixons". A document that contradicts itself about whether the supplier is in breach is
worse for the supplier than no document. The dashboard tile made the same claim in three
words: "seuil contractuel dépassé", in red, for a threshold nobody signed.

An engagement is authored once now, with the only two things that genuinely are: the
wording it carries into the annexe, and the threshold a supplier signs. `pnpm
gen:engagement-canon` derives the rest from the canons. Headroom has one definition,
`(seuil - mesuré) / seuil`, published on both surfaces that show a margin; over the measured
value it gives 11.3 % where the ceiling gives 10.1 %, which is where the two numbers came
from, and the ceiling is the denominator because a ceiling is what was signed. The gauge and
the figure beside it are one computation. A trend is `classifyDelta` over the scenario's own
kept history against its own floor, and the service scenario now keeps that history so the
line comes from twenty-four aggregations rather than from a polyline typed on a viewbox.

Three refusals. **An engagement nobody signed has no status**: `inOffer: false` means no
contractual state at all, the contract surfaces do not carry the row, and the tender shows
it as the proposal it is while still saying it is over by 8 points today, a figure that used
to be typed beside the sentence that reads it. **The carbon commitment renders its band**,
on the workspace that produces the annexe, where it was a bare "0.076 g" with no model
version. **No figure after a remediation is stated**: the report said replacing the video
player "ramènera la part attendue à 26 %", which is a projected saving in the document a
buyer reads to decide whether to keep the contract.

The conformity sparkline was fourteen coordinates typed on a 46-high viewbox captioned
"taux de conformité 28 % → 59 %", where the 28 was declaration version 1's count of
conforming criteria read as a percentage. 28 of 78 is 36 %, so the caption was wrong about
both ends of its own line. It plots the three published versions now, as the counts they
are, with the draft drawn open. Also fixed on the way past: the execution report rendered
its engagement states in English, and a document is French in both locales. 817 tests.

**Then: a comparison is a position in a corpus (2026-08-20).** Two surfaces in the
product compare services with each other, and on both of them almost every figure is a
position rather than a quantity. All of them were authored. The public index printed a
rank of 14 out of a total of 412; the fleet printed a percentile of 38 against an n of 112
and drew the distribution behind it as twelve x/y/height triples copied out of a mockup,
with the marker at x=99 and the median line at x=200. Four claims about three
distributions, none of which existed and none of which could have agreed with each other
if they had.

The grades were the same kind of thing. Every row on the index carried a letter and the
table carried no DOM count and no request count, so no grade on it could have come from
the model that produces grades. The audited service was printed at B on the public page
while the model this build ships grades it E, which is a contradiction a buyer finds by
opening two tabs. And "n=112 services mesurés. Votre client se situe dans les meilleurs
38%. Citable dans l'annexe avec la taille d'échantillon indiquée." invited a customer to
put that number in a tender response.

There is a corpus now: twelve services, each one a capture, in `capture-canon-source.ts`
with the rest. A `site()` builder takes a compact description of a page and expands it to
a real resource list, so each is about twelve authored lines and still reduces through
`extractMetrics` like every other capture. The measurement canon builds a scenario per
service with two aggregations ninety days apart and its own history, and `corpus-canon-source.ts`
reads the result back. The rank is the position when the corpus is ordered on measured
page weight. The grade is `computeEcoIndexScore` over the three metrics printed beside it.
The trend is `classifyDelta` over the two aggregations against that scenario's floor. The
histogram is the corpus's own distribution in eight buckets, emitted as counts and edges,
with the screen turning fractions into pixels rather than a fixture carrying coordinates.

Four things the corpus refuses. **It states the size it holds**: twelve, not four hundred
and twelve, because a rank against a corpus nobody measured is not a rank. **It ranks on a
measurement**, transferred page weight, not on the reference model's estimate: the bands
of adjacent services overlap, so ordering by them asserts a precision the bands themselves
deny, and the footer says so. **It gives a position and not a percentile**, "6e sur 12",
because a percentile over twelve services is a rank wearing a statistic's clothes. And
**it applies green hosting per service and only where the check was made**: an unverified
host gets a factor of zero rather than the one the whole canon used to share, four of the
twelve have never been checked, and the index prints how many.

One kernel bug fell out of building it. METHODOLOGY.md section 7 says a scenario with no
established floor is low confidence, and `classifyDelta` and the budget engine both
implement their half of that rule, but `gradeConfidence` was never given the floor and so
graded a hospital's home page high confidence on eleven weeks of history, while the same
scenario could not say whether anything on it had changed. `ConfidenceContext` now carries
`noiseFloor` as a required field, so a caller has to answer the question rather than
inherit a default, and section 9's table carries the condition section 7 already stated.

Also derived rather than typed: the declaration tone, which used to draw a declaration 426
days old in caution where the referential asks for republication once a year; the fleet's
alert column, which held "runner unstable 3 d" and "3p share 41%" beside rows carrying
neither figure; and the summary strip above it. A sub-floor trend prints "non sig." rather
than a signed percentage in a quieter grey, because a number in a column headed "tendance"
reports a change whatever colour it is in. 799 tests.

**Then: a finding is a measurement (2026-08-20).** The free scan carried three findings
and all three were written by hand: "-214 KB, quatre images en PNG non redimensionnées",
"-96 KB, deux familles de polices, six graisses, aucune sous-classée", and a DOM figure.
The first two stated things a capture does not hold, since nothing in a capture says an
image is a PNG at the wrong size or that a font file is one of six unsubset weights, and
both put a saving in the measurement column, which is a counterfactual about a page nobody
measured. The third was a real number with no sentence behind it. On the one public surface
the product has, that is the whole claim to measure rather than to estimate, spent for
three lines of copy.

`findings` in `measure-core` raises them now, from the capture the same run publishes. Six
findings are quantities the capture holds: image weight, font weight, third-party weight
counted by distinct origin, the heaviest single response, and the decoded bytes coverage
found unexecuted for scripts and for stylesheets. Each carries what it is a share of, named
in the data rather than implied, because a share basis nobody states is a rumour: the
unexecuted bytes are a share of the decoded bytes coverage measured, never of the page.

The seventh is a position rather than a weight. EcoIndex publishes quantile tables for DOM
nodes, requests and page weight, so `ecoIndexPercentile` places a measured value in that
published distribution and the finding reads "au-delà de 90,2 % des pages de la distribution
de référence publiée par EcoIndex". It is the only comparison the product makes between one
service and others, it is made against a table anyone can read, and the source and its
version travel with the number. The kernel holds no corpus and takes the position as an
input, which is also why `measure-core` still depends on nothing.

Two things the engine refuses. Coverage is off by default on a measured run, so the scan's
unexecuted-byte findings are withheld with the count of files they would have covered
rather than reported as zero unused bytes; the scan prints that, which makes open decision
14 visible on a public surface instead of buried in a document. And where coverage was
captured for some files of a type and not others, the finding is raised over what was
measured and states what it could not see, so the quantity reads as a floor.

The scan needed a capture, so it has one: 61 requests, 980 KB, a WordPress library site
whose home page is 66 % images. Its medians are what they were, because a capture that
reduces to the same three numbers is the same page described properly. The tail generator
learned to spread around its own mean and to throw rather than emit a response below a
kilobyte, which is the bug from the previous slice caught in code instead of by reading.

Two surfaces read it, and they demonstrate opposite paths: the free scan, where coverage
was not captured, and the run detail's resources tab, where it was. 776 tests.

**Then: one run, one capture (2026-08-20).** Run #4812 had two resource lists and they
described different pages. The run detail held eight resources plus a tail of seventy-six
weighing two kilobytes between them, which is twenty-six bytes each and is not a thing a
browser can fetch. The attribution canon held eighty-four real ones, with different bundle
names, a different hero image and different third parties. The two also disagreed about what
the run's third parties weighed, 340 KB against 180 KB on the baseline, so the metric row and
the origin diff below it on one screen were answering from different measurements. Nothing
tied them together because the kernel's own `extractMetrics` was not being called by anything
in the app, exactly as `aggregateRuns` had not been before the previous slice.

A capture is now authored once, in `capture-canon-source.ts`, and everything reduces it:
`extractMetrics` for the six metrics, `summariseResources` for the inventory, the attribution
engine for the diff, the budget engine for the verdicts. No generator sums a resource list of
its own; the budget canon's `fromSide`, which was a third implementation of the first-party
test and used a url prefix rather than an origin, is gone. Where a scenario is one page the
centre is not authored either: `fromCapture` reads it off the capture, so a page cannot weigh
one thing in its metric row and another in its resource list. An aggregate over several pages
has no single capture and still states a centre, which is the honest difference between the
two. A test extracts the published capture again and holds the aggregation to it.

The screens follow. The run detail's waterfall draws the twelve heaviest resources in the
order they were requested, positioned and sized by the timings the capture now records rather
than by a start fraction typed into a fixture and a width taken from bytes. The resources tab
lists all eighty-four records instead of eight and a line reading "76 requests, no records
kept". The regression is marked from the bundle the attribution engine named.

Underneath, the runner learned to capture what the inventory shows: resource type from the
browser rather than a file extension, decoded size from the body, per-resource timing, and js
and css coverage. Coverage is real work: `unusedBytesFromCoverage` resolves v8's nested
ranges, because a function that ran with an unexecuted branch inside it is credited for the
branch by anything that sums the ranges carrying a count, and it counts bytes over the text
the offsets cut rather than scaling a character count. It refuses rather than approximates on
a report that does not describe its source. It is off by default and recorded in the
fingerprint, because instrumenting execution moves `js_execution_ms` and the size of that
movement is unmeasured; METHODOLOGY.md section 12 carries it as open decision 14. One
correction fell out of the new test: the third-party draw was rotated against the first-party
one to give the share metric dispersion, which moved the middle run off its centre, so the
share an aggregation reported was not the share of the capture it publishes. It is reversed
now, which gives the same dispersion and leaves the middle run alone. 724 tests.

**Then: every statistic is the kernel's (2026-08-20).** The medians, dispersions, noise
floors and confidence grades the application prints were typed into fixtures, and five
generators each fabricated their own. Three of them contradicted the runs printed beside
them. The run detail drew five run dots and stated a MAD of 9 where those five give 4. The
comparison marked DOM nodes low confidence where `gradeConfidence` grades them medium. The
free scan printed "confiance élevée", in green, on a single cold pass with no history, where
the kernel grades it low.

`pnpm gen:measurement-canon` now builds runs and hands them to `aggregateRuns`,
`computeNoiseFloor` and `gradeConfidence`. What is authored is a distribution: what a
scenario settles at, how far its runs spread, how many there were, and how much history sits
behind it. Everything after that is derived, and a test recomputes the median, the MAD, the
extremes and the grade from the run values written beside them, so a fixture cannot state a
statistic its own runs do not give. A floor belongs to a scenario rather than a run, so
baseline #4790 and candidate #4812 are two aggregations of one route read against one number,
while each keeps its own dispersion and the dispersion card draws a box per side.

Where the kernel disagrees with the design, the kernel stands. Two extra requests against a
1.2-request floor is a real change; the pull request did add a bundle. The service's DOM count
grades medium, not high, and says so on the tile, in the comparison and in the annex. The free
scan says low confidence in caution rather than high in green. The carbon, budget and ledger
canons read their byte counts and floors from this one place, so the estimate, the verdict and
the register describe the same run: the register's entry for #4812 used to name `/accueil` and
carry the service median's bytes beside the candidate's request count, and the annex's
measured-state table mixed three different measurements into one page of a tender document.
Both are one measurement now. `formatMeasured` keeps a decimal under 10 KB, which is what
stopped one floor reading 7.4 KB on the run detail and 7 KB in the annex. 674 tests.

**Then: the criteria workspace answers the pack (2026-08-20).** The workspace ran
on fourteen hand-written rows whose tier split, 31 automated, the pack it named
contradicts at 9. It now runs on the pack itself: `pnpm gen:criteria-canon` hands
`@balise/criteria-engine` the measured metrics and the two reviewers' attestations
and writes back all 78 assessments, the completion by tier, the per-family rollup
and the blocking findings. Choosing what the reviewers answered is the fixture's
job. Every status, count, bar and finding after that is derived, and a test answers
the pack again and holds the checked-in copy to it.

Four surfaces carried a conformity number and now carry one number: the workspace,
the dashboard completeness card, the declaration editor and the published
declaration. The document's non-conformity table used to list short paraphrases,
one of them for criterion 6.9, which the referential does not have; it now prints
the referential's own wording verbatim beside the reviewer's justification, and
prints in breach red where a justification is missing, which is what the official
grid requires and what stops the declaration publishing.

The pack's gate is now on the screen rather than in a to-do list. It ships
`tiersSignedOff: false`, so the engine answers nothing from measurement and every
answer is one a named person put their name to. The card that says AUTOMATED 9/9
would read as nine automatic answers, so the source breakdown sits beside it: 0
from measurement, 73 attested, 5 not looked at. The notice above says what signing
off would buy, and that one criterion in seventy-eight carries an evaluation rule
this engine can run, which is the second sign-off and the real bottleneck.
The fleet, the execution report and the contract tracker read that rate too, so
six surfaces now share one figure. The tracker's early warning used to claim
conformity was rising at 1.9 pt per month, extrapolated from history nothing
holds. It states a ceiling instead: what answering the five open criteria can
reach at best, and how far short of the contractual target that leaves you. The
90-day trend cell on that row reads no history rather than drawing a line.
606 tests pass across twelve packages.

**Then: every carbon figure is the package's (2026-08-20).** The application's carbon
numbers were the design canon's, drawn before `packages/carbon-models` existed: four
models spanning 0.31 to 0.58 gCO2e, one of them a model this build does not implement.
The three real models disagree by 31x on the canon's own pages, and the reason is
structural rather than a bug: EcoIndex reads a figure off a score and cannot see the
grid, while the other two compute an energy. So the band carries the energy models and
EcoIndex is reported beside it as the grade and score it publishes, its own gCO2e figure
named rather than hidden. `bandModels()` decides that from what each model declares about
itself, and the sensitivity test corrected the rule on its first run when it found 1byte
uses fixed published intensities and never applies the visitor grid.

`pnpm gen:carbon-canon` now estimates every page in the canon and writes back the band,
the reference value, the measurement floor carried through the model, and every assumption
of every model that ran. Eleven surfaces read it: the dashboard tile, the run detail's two
axes, the comparison row, the free scan, the annex's figure 3 and its caption, the fleet
table and its sector benchmark, the observatory, the tender commitment, the contract
tracker, the execution report and the ledger entry a verification permalink resolves. The
figures that were stale are gone with them: a caption naming ADEME Base Empreinte, a check
comment naming `ademe@2024`, a free-scan lede promising five runs and four models where
one cold pass and three models ran, and an observatory footnote saying four. The metric
tile used to swap its provenance line for a state message, which dropped the model version
from the carbon tile; both render now and a test asserts it. 646 tests.

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
- Resource inventory and coverage: unexecuted decoded bytes from v8's nested ranges,
  measured over the text the offsets cut or refused entirely.
- `findings`: what a capture shows about itself, as measured quantities with the basis of
  every share named. no projected savings, and a position in a published reference
  distribution only when the caller supplies one.
- Confidence takes the scenario's floor, so a figure nothing can be detected against is
  low confidence however tight its runs were.

### Carbon models (packages/carbon-models) [OSS]
- One `CarbonModel` interface; adding a model never touches engine code.
- `ecoindex` (CNUMR reference: quantile tables, score, grade A-G, GES gCO2e). The same
  tables place a measured value in the published distribution, for findings.
- `swd` v4 (Sustainable Web Design: published segment constants, grid intensity input).
- `onebyte` (Shift Project via co2.js reference constants).
- `ademe` (Base Empreinte factors): planned, needs verified factor data first.
- Assumptions are data, rendered wherever an output appears. Models are never averaged.

### Schemas (packages/schemas)
- Zod as single source of truth, branded IDs, inferred types, closed error-code enum (V2).

### Contractual engagements (apps/web)
- One object across the tender, the contract tracker and the execution report. Only the
  wording and the threshold are authored.
- One headroom definition, published beside the numbers it produced.
- An engagement that was proposed and not signed has no contractual status anywhere.
- Trends from the scenario's own kept history through `classifyDelta`, or no line at all.

### Comparison surfaces (apps/web)
- One corpus of measured services behind the fleet and the public index, with the rank,
  the grade, the trend, the histogram and the summary strip all computed from it.
- The corpus states its own size, ranks on a measured quantity, gives a position rather
  than a percentile, measures every row identically, and credits green hosting only where
  the check was made.

### UI (packages/ui + apps/web)
- Design tokens per the brief: ink/paper/surface palette, Archivo + Public Sans + Martian Mono,
  zero radius, no shadows, no gradients.
- ToleranceBand: canonical / compact / badge, plus trend, dispersion and the print register.
  `@balise/ui/svg` renders it to a standalone svg document for the check comment, the
  embeddable badge and the typst pipeline: the same component, never a second drawing.
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
- [x] ~~Wire the screens to `aggregateRuns`, `computeNoiseFloor` and `gradeConfidence`~~
      (`pnpm gen:measurement-canon`; the dashboard tiles, the trend, the run-detail
      dispersion, the comparison rows, the free scan and the annex's measured-state table
      all read it, and the carbon, budget and ledger canons take their byte counts and
      floors from it)
- [x] ~~Wire the run detail's waterfall and resource inventory to the run's capture~~
      (`extractMetrics` and `summariseResources` over one `RawCapture`; all 84 records, the
      waterfall drawn from the timings the capture records, the regression marked from the
      bundle attribution named)
- [x] ~~The free scan's findings are still three authored sentences with authored savings~~
      (`findings` in `measure-core`, `pnpm gen:findings-canon`; six weight findings from the
      capture plus a position in EcoIndex's published distribution, no saving anywhere, and
      the coverage findings withheld rather than zeroed. read by the free scan and the run
      detail's resources tab)
- [x] ~~The fleet and the public index compare services against corpora that do not
      exist~~ (`pnpm gen:corpus-canon`; twelve services, each one a capture, with the rank
      from measured page weight, the grade from `computeEcoIndexScore`, the trend from
      `classifyDelta` and the histogram from the corpus's own distribution. the index
      states the twelve it holds instead of the 412 it claimed)
- [x] ~~Confidence renders in the pass colour on the metric tiles~~ (green is a pass state
      and a confidence grade is not one; `--text-secondary` on high, asserted by a
      rendering test, and the two new comparison surfaces obey the same rule through
      `confidenceTone`)
- [ ] ToleranceBand print register for trend and dispersion (the handoff specifies print for the canonical band only; needed when the Typst pipeline lands)
- [ ] Self-hosted font subsetting check (weight budget)
- [x] ~~The tender, the contract tracker and the execution report each author their own
      copy of the same engagements~~ (`pnpm gen:engagement-canon`; one object, the wording
      and the threshold authored and everything else derived. an engagement nobody signed
      carries no contractual status, so the report stopped declaring a breach of an
      obligation the contract does not contain)
- [ ] The engagement wording that says ten pages binds fourteen scenarios. Either the
      wording changes or the basis does, and both are the maintainer's call
      (METHODOLOGY.md open decision 17)
- [ ] The fleet's other clients still carry an authored RGESN rate. Only the audited
      service is assessed by the engine, which is honest, but five numbers on that column
      are backed by nothing. Either assess them or say the column is the agency's own
      record

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
- [x] ~~Wire the criteria workspace and the declaration editor's blocking list to the
      engine~~ (`pnpm gen:criteria-canon` answers all 78 criteria through
      `@balise/criteria-engine` and writes the result; a test answers them again and holds
      the checked-in copy to it. The workspace, the dashboard completeness card, the
      declaration editor and the published declaration all read it, so the four places that
      carried a conformity number now carry one number)
- [x] ~~Wire the fleet's rate and the execution report's rgesn engagement~~ (both read
      `conformityPct()`; the report's gauge fills against the contractual target rather
      than a number typed beside it. six surfaces, one figure)
- [ ] Evaluation types beyond `metric_threshold`, once the pack says which are needed
- [ ] Do findings and criteria meet? Several RGESN criteria ask questions a finding already
      answers (unused code shipped, third-party weight, image weight). Wiring a finding to a
      criterion is an evidence question and waits on the tier sign-off

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
- [x] ~~Place attributed bytes at a line of the original file~~ (`SourceBytes.span` and
      `ModuleChange.span` from the candidate map; `placeGrowth` returns only what may be
      annotated)
- [ ] Index maps (`sections`), once a customer build produces one
- [x] ~~One resource list per run~~ (both attribution sides read the capture the measurement
      canon publishes, so the origin diff and the metric row above it are the same run)

## To-do: budgets and the check (V3)

- [x] ~~`packages/budgets`: balise.yml reader, budget evaluation, check summary~~ (80 tests)
- [x] ~~A yaml subset reader with no dependency, refusing everything outside it by
      name and line~~
- [x] ~~Nothing fails on a scenario with no established noise floor, and a growth
      limit goes through `classifyDelta` before anything else~~
- [x] ~~Overrides that lift the merge block and never the breach, with expiry~~
- [x] ~~Our own `balise.yml` at the repo root, held to the reader by a test~~
      (the manual's budgets for the dashboard, the scan and the observatory; not
      enforced until the runner measures this app and the floors exist)
- [x] ~~Wire the Budgets screen and the PR check screen to the engine~~
      (`pnpm gen:budget-canon` evaluates a real balise.yml against the runs the
      other canons publish and writes the result; a test recomputes it. The yaml
      view renders the file the engine actually read)
- [x] ~~The check run payload: title, markdown body, annotations~~ (`buildCheckRun`
      in `packages/budgets`; annotations land on the line of `balise.yml` that
      decided, which is why the yaml reader records a line per threshold)
- [x] ~~The band as a standalone svg through `packages/ui`~~ (`@balise/ui/svg`
      renders the component itself with react-dom, so the browser, the comment
      and the pdf are the same code. no headless browser, no screenshot)
- [x] ~~Show the posted artifact on the check screen~~ (a Markdown view beside the
      rendered one, built from the same assessments and in the interface locale)
- [ ] Post it: Octokit, check run creation, comment upsert, annotation batches.
      Needs the api and a GitHub App, so it waits on V2
- [x] ~~Decide how a measured value under 10 KB is written~~ (one decimal below 10 KB,
      whole kilobytes above; two significant figures anywhere the unit is kilobytes. the
      same floor was reading 7.4 KB on the run detail and 7 KB in the annex)
- [ ] Serve the band svg from the api, so the comment can embed one
      (`bandImageUrl` is already an input and is omitted while nothing serves it)
- [ ] Record an override as a ledger entry when the api can write one
- [x] ~~Annotate a source file once attribution can place a line in it~~ (`sourceGrowth`
      on `CheckReportInput`, fed by `placeGrowth`; a notice across the lines the candidate
      map named, and nothing at all for a file it could not place)

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
- [~] Full HAR + CDP trace persisted to object storage. The capture now carries a real
      per-resource record (type, transferred, decoded, coverage, timing) rather than a url
      and a size, which is what the resource inventory renders; the full har and the trace
      are still not persisted and need object storage
- [x] ~~EnvironmentFingerprint recorded on every run~~ (V1.0, every field compared for invariant 3, with a test that fails if a field is ever left out of the comparison)
- [~] METHODOLOGY.md v1 **drafted**, not published and not in force. Seventeen open decisions in its section 12 need sign-off (operating manual section 29)
- [ ] Sign off the noise floor scaling factor, the throttle profile parameters and the confidence thresholds
- [ ] **Measure what coverage instrumentation costs**, then decide whether it is on for a
      measured run. It is written, off by default, and on the fingerprint; METHODOLOGY.md open
      decision 14. The free scan now shows what the off case looks like: two findings
      withheld, which is honest and is also two findings a prospect does not see
- [ ] **Sign off the finding thresholds** (METHODOLOGY.md open decision 15). They decide
      what a public surface calls a problem on a service whose owner never asked to be
      measured
- [ ] **Sign off what a comparison surface compares** (METHODOLOGY.md open decision 16 and
      section 10.2). The rank is taken on transferred page weight, which is one metric
      standing in for a page's cost; the reference model's estimate and the EcoIndex score
      are the alternatives and each says something different about what an index is for.
      The 270 days at which a declaration is flagged as due is ours too; the 365 is the
      referential's
- [ ] Crawl a real corpus. The index is twelve authored captures and says so. It needs the
      public-sector allowlist, `robots.txt` compliance and the rate limit in the operating
      manual section 8 before it measures anything nobody asked us to measure
- [x] ~~The reproducibility test: twenty runs, same verdict, in CI~~ (V1.1, `pnpm test:repro`, its own vitest config so it stays out of the normal loop, plus a CI job that installs the browser)
- [ ] Run the reproducibility suite for real and record what it says; it has never executed

Later versions: see roadmap; detailed to-dos are appended when the version starts.

---

## Decisions log

- **2026-08-22 · A table of measured numbers carries its columns, not its alignment.**
  Thirteen tables were CSS grids of `div` and `span`. Alignment is the whole meaning of a
  column and it is the one thing a screen reader cannot see, so each one reads as a flat run
  of values: 546 of them on the criteria workspace. The roles apply to the existing markup
  without moving a pixel, and `row-cell-count` makes the promise mechanical, because a row
  that disagrees with its header row puts its values under the wrong headings, which is
  worse than carrying none at all.
- **2026-08-22 · A note that spans a table is a row, not a sixth cell.** Counting
  `aria-colspan` is what makes that expressible. The alternative, a five-column row with six
  cells, announces the note under the wrong heading and breaks the count for the rows below.
- **2026-08-22 · An element hidden from assistive technology is not a cell.** The bars drawn
  beside printed figures repeat them. Giving each one a cell would announce every measured
  value twice, so they stay `aria-hidden` and the cell count skips them.
- **2026-08-22 · A name is read aloud; a display string is not a name.** The eyebrows in this
  app are typed in capitals rather than transformed in CSS, so reusing one as an `aria-label`
  hands a screen reader a string some will spell out letter by letter. `shouty-name` fires on
  two or more words with no lowercase letter, which leaves an acronym alone.
- **2026-08-22 · `table` and `tablist` take their name from the author only.** Asking for an
  accessible name falls back to content, and their content is the cell text and the tab
  labels, so both reported named when a screen reader would announce neither. The same bug
  twice, which is why it is now one function.
- **2026-08-21 · A role is a promise about the keyboard.** `role="tab"` tells an assistive
  technology that the arrow keys move within the set and that the set is one stop in the page
  tab order. Three screens declared it and implemented neither. The pattern is implemented
  once, in `packages/ui`, with a required list label, because a tablist takes no name from
  the tabs inside it.
- **2026-08-21 · Only the open tab names its panel.** Panels are rendered when they open
  rather than all rendered and hidden, so `aria-controls` on a closed tab would point at an
  id that is not on the page. `aria-controls` is recommended by ARIA, not required, and a
  dangling reference is worse than its absence: it is a promise of somewhere to go, made to
  the one reader who cannot check.
- **2026-08-21 · Keyboard reachability is a test, not a memory of having looked.**
  `auditMarkup` applies eleven rules to the rendered markup of every route, from a route
  table the router also reads. Every rule is shown catching something before it is trusted to
  catch nothing, and the markup reader throws on input it cannot parse rather than
  recovering, because a parser that recovers silently lets a screen fall out of the audit
  while the audit goes on reporting nothing wrong.
- **2026-08-21 · A scenario names a profile and the rest is expanded.** The profile table
  moved to `@balise/schemas`, where the runner that applies it and the screens that state it
  read one copy. The duplicate said "1.6 Mbps" and nothing would have noticed if the runner
  had stopped applying it. ADR 0007.
- **2026-08-21 · Invariant 3 lives in the kernel.** `fingerprintsMatch` and
  `summariseFingerprints` are in `@balise/measure-core` beside `classifyDelta`, because
  comparability is a measurement rule and the open packages are what an auditor reads.
- **2026-08-21 · A surface describing several scenarios names what varies.** It does not
  concatenate two values into a line no run was measured under. `summariseFingerprints([])`
  reports not uniform, because an empty set describes nothing.
- **2026-08-21 · The task cache includes what a package depends on.** `dependsOn` on `test`
  and `typecheck`. Without it a local `pnpm test` can report green on a workspace whose
  tests fail, and it had been doing so for three slices. A local check that lies is worse
  than no local check, because it is trusted. ADR 0008.
- **2026-08-21 · Three palette values are darker than the brief's.** `--text-tertiary`,
  `--caution` and `--on-dark-muted` all failed wcag aa as text and none could be fixed by
  restricting them to large sizes, because nothing in the instrument register reaches 24 px.
  The alternative considered first, a `--caution-text` sibling following the `-on-dark`
  precedent, was abandoned: of 41 `--caution` references most flow through view modules whose
  colour is consumed as text, so the split would have left the wrong one reachable by default.
  ADR 0006.
- **2026-08-21 · The focus ring is a token, not a colour.** Signal blue reaches 2.4:1 on ink,
  below the 3.0 a ui component boundary needs, so focus was invisible on the navigation rail.
  `--focus-ring` is redefined on dark containers and left alone on dark buttons, whose ring is
  drawn on the page behind them.
- **2026-08-21 · `lang` is declared where the language changes.** The app locale drives
  `document.documentElement.lang` from `i18n.ts`, so flipping one line cannot leave the page
  declaring the wrong language, and `<main>` carries `lang="fr"` on the document and public
  registers. A screen reader switching voice mid-page is the whole point of the attribute.
- **2026-08-21 · The decisions log graduates into ADRs.** `docs/DECISIONS/` exists, with
  the five records that were owed: the one-verdict rule, rule pack authoring, the generated
  canon, the carbon band split, and confidence requiring a floor. The rule for which log a
  decision belongs in: this one is a running record, an ADR is a considered one, and an
  entry graduates when someone would otherwise have to reconstruct the reasoning from a
  diff.
- **2026-08-21 · The runbook states what it cannot state.** There is no deployed system, so
  procedures for deploys, migrations, backups and the queue would be fiction. `docs/RUNBOOK.md`
  covers what can be executed today and carries a table of the ten missing procedures with
  what each depends on, plus the seven alerts that must exist before launch. A gap that is
  listed is a gap; a gap that is implied is a surprise.
- **2026-08-21 · `@balise/schemas` is published too.** The operating manual names four OSS
  packages and all four depend on schemas. Shipping four readable packages that rest on a
  fifth nobody can read is the black box the licence was meant to avoid, so schemas carries
  the same licence, the same README bar and the same surface check.
- **2026-08-21 · The published tarball ships `src` as well as `dist`.** It doubles the
  tarball and it is the point: the argument for open sourcing the kernel is that you can
  read it, and `npm install` should be enough to do that. Tests and fixtures stay out.
- **2026-08-21 · A clock or a random number in a published package is a build failure.**
  `scripts/check-package-surface.mjs` greps for `Date.now`, `new Date()`, `Math.random`,
  `fetch`, `XMLHttpRequest`, `sendBeacon` and `process.env` in published sources. Given the
  same input these packages must return the same output forever, and that promise is easier
  to keep mechanically than by review.
- **2026-08-21 · Releasing is manual.** `workflow_dispatch`, defaulting to a dry run. An
  automated publish would put the kernel on npm before a person decided it was ready, and
  an unpublish is not a fix once someone has installed it. The workflow still runs lint,
  typecheck, tests, build, the surface check, the audit and the standalone install first.
- **2026-08-21 · The dependency audit blocks on the production tree only.** A high-severity
  advisory in something a consumer installs stops a release; one in a devDependency is
  reported and does not stop a merge. The manual says an advisory in an OSS package blocks
  release, and the production tree is the accurate reading of "in an OSS package".
- **2026-08-21 · Headroom has one definition and it is published.** `(seuil - mesuré) /
  seuil`. The alternative, over the measured value, is where the tender's 11 % came from
  against the tracker's 10 % on one contract. A supplier signs a ceiling, so the ceiling is
  the denominator, and the definition prints under both tables that use it.
- **2026-08-21 · An engagement nobody signed has no contractual status.** `inOffer: false`
  produces `status: null` and `gaugePct: null`, the contract tracker and the execution
  report do not carry the row at all, and the generator throws if one ever does. It is still
  shown in the tender, still says it is over by 8 points today, and is named as a proposal
  rather than given one of the contract's words.
- **2026-08-21 · A threshold is authored and everything around it is derived.** The two
  authored parts of an engagement are the wording it carries into the annexe and the number
  the supplier signs. The product's job is to say whether the number is met, not to choose
  it. METHODOLOGY.md 10.3, open decision 17.
- **2026-08-21 · The wording that says ten pages is carried, not corrected.** "Poids médian
  des 10 pages principales" binds the service median over fourteen scenarios. Changing the
  wording of a commitment a buyer reads is a section 29 decision, so the mismatch is flagged
  in the code and in METHODOLOGY.md rather than quietly fixed to match the basis.
- **2026-08-21 · A document states nothing about a measurement it has not made.** The
  execution report said a planned replacement "ramènera la part attendue à 26 %". That is a
  projected saving, in the document a buyer reads to decide whether to keep the contract,
  and the same rule that removed savings from the free scan removes it here. The report says
  what is planned and when, and that the next quarter's measurement will say what the figure
  is.
- **2026-08-21 · A tile does not call an internal target a contractual one.** The dashboard
  read "engagement ≤30" and "seuil contractuel dépassé" in red for the engagement that was
  proposed and not taken. It reads the threshold off that engagement now and names it as
  the internal target it is.
- **2026-08-21 · The conformity history is the versions that were published.** Three points,
  drawn as counts of conforming criteria, with the draft open rather than filled. The
  fourteen coordinates it replaces were captioned as a rate and read version 1's count of 28
  criteria as 28 %, which is 36 %.

- **2026-08-20 · The index states the corpus it holds.** The observatory said "412
  services mesurés en continu" and held six rows. Nothing had measured 412 services, and
  every position on the surface, the rank especially, counted against that number. The
  fiction is cheap and the claim is not: the whole proposition of a public index is that
  the field was measured and here is where you stand. It now holds twelve captures and
  says twelve. When a crawler exists the number becomes real, and until then a small
  honest corpus reads better to a buyer than a large invented one.
- **2026-08-20 · A rank is taken on a measurement, not on an estimate.** Ordering by the
  reference model's gCO2e was the design's rule and is the wrong one: adjacent rows' bands
  overlap, so an ordering by them claims a precision the bands deny on the same screen.
  Transferred page weight orders almost identically here, is a measured quantity, and can
  be checked against the row beside it. The consequence is visible and kept: rank 8 scores
  better on EcoIndex than rank 7, because a rank on one metric and a composite score are
  different questions. METHODOLOGY.md 10.2, open decision 16.
- **2026-08-20 · A position is stated as a position.** "6e sur 12", never "P38". A
  percentile computed over twelve services is a rank wearing a statistic's clothes, and
  the fleet's caption used to invite the customer to cite it in a tender annex. The
  caption now says how many services the corpus holds, twice.
- **2026-08-20 · This does not reopen the kernel's rule about corpora.** The decision of
  the previous slice stands: `measure-core` holds no corpus, and the only comparison a
  finding makes is against EcoIndex's published tables. The corpus here is application
  data, it is a set of captures anyone can read, and the surfaces that use it state its
  size. The kernel still takes a position as an input and depends on nothing.
- **2026-08-20 · Every row in a comparison is measured identically.** One page per service,
  cold, `mobile-4g`, five runs. The audited service therefore has two measurements: the
  service median over fourteen scenarios on desktop that the workspace shows, and the home
  page on mobile that the index ranks. They are different questions and they sit on
  different screens. A shared axis across rows measured differently is invariant 3 with
  the fingerprint quietly dropped out of the argument, which is what an index does by
  accident the moment two rows come from different profiles.
- **2026-08-20 · Green hosting is credited per service and only where checked.** The canon
  ran every model with `greenHostingFactor: 1`, which zeroes SWD's data centre term. Fine
  for the audited service, whose host was checked; applied to twelve services in a public
  index it flatters eleven of them on a fact nobody looked up. An unchecked host now gets
  zero, the check date travels with the ones that have it, and the index prints how many
  were never checked and what that does to their estimate.
- **2026-08-20 · `gradeConfidence` takes the noise floor, and the field is required.**
  METHODOLOGY.md section 7 already said a scenario without a floor is low confidence.
  `classifyDelta` returns `indeterminate` for it and the budget engine refuses to fail on
  it, but the confidence grade was computed from dispersion alone, so eleven weeks of
  tight runs graded high. Optional with a default would have left every existing call site
  silently wrong; required makes each one answer. Section 9's table now carries the
  condition, which is a correction to the document, not a change to the method.
- **2026-08-20 · A histogram is emitted as counts and edges.** The generator publishes
  buckets, a median and a corpus size; the screen turns fractions into pixels. The version
  this replaced put x, y and height in the fixture, which meant the bars, the marker and
  the median line were three independent authored numbers that never had to agree.
- **2026-08-20 · A sub-floor movement prints no percentage.** The trend column drew "+0.6%"
  in a quieter grey. Rule 2 says a delta below the floor is not a change, and a signed
  number in a column headed "tendance" reports one whatever colour it is in. It reads
  "non sig." now, and a scenario with no floor reads "n/a".
- **2026-08-20 · A declaration's state is its age against the referential's year.** The
  tone was typed beside the age, which is how 426 days came to be drawn in caution. Over
  365 days is expired, which is the RGESN republication rule and not our choice; the 270
  days at which one is flagged as due is ours, and is open decision 16.

- **2026-08-20 · A finding states a measured quantity, never a projected saving.** The
  free scan's findings were "-214 KB" and "-96 KB": what the page would weigh if someone
  did something we did not measure. A saving is a claim about a page that was never
  loaded, and a report carrying one measurement and one projection has to be read as a
  projection throughout. `findings` in `measure-core` has nowhere to put one: every
  finding carries a value read off the capture and the basis it is a share of, and a test
  asserts the published canon contains neither the word nor the shape.
- **2026-08-20 · A share names its basis in the data.** Unexecuted script bytes are a
  share of the decoded bytes coverage measured, not of the page, and the two differ by a
  factor of four on a compressed bundle. `FindingShare` carries `basis`, so a surface
  cannot pair "55.6 %" with the wrong denominator, and the sentences in `packages/i18n`
  say which one they mean.
- **2026-08-20 · The only comparison to other services is against a table someone else
  published.** EcoIndex's quantile tables are part of its published method and already in
  `carbon-models` for the score; `ecoIndexPercentile` reads a position off them. The
  alternative, a Balise corpus of scanned public-sector sites, would be a benchmark no
  buyer can audit and a privacy question we have not answered. The kernel takes the
  position as an input and holds no corpus at all, which also keeps `measure-core`
  dependency-free.
- **2026-08-20 · Findings live in `measure-core`, which is open source.** A finding a
  customer cannot check is marketing. Putting the rule in the OSS kernel means an auditor
  reads the function that raised it and the capture it read, and the two agree or they do
  not. Nothing was added to the dependency surface to do it.
- **2026-08-20 · A finding coverage could not see is withheld, not zeroed.** Coverage is
  off by default on a measured run, so the scan's scripts carry no coverage. Reporting
  zero unexecuted bytes would be a claim about execution nobody instrumented. The engine
  returns the finding as withheld with the count of files, and the scan prints it, which
  puts open decision 14 on a public surface rather than in a document. Where coverage
  covered some files of a type and not others, the finding is raised over what was
  measured and states the rest, so the number reads as a floor.
- **2026-08-20 · The finding thresholds are provisional and are one constant.** What
  share of a page in images is worth saying out loud is a methodology decision, not an
  engineering one, and it decides what a public surface calls a problem on a service whose
  owner never asked to be measured. `PROVISIONAL_FINDING_THRESHOLDS` sits beside the noise
  floor scaling factor in the same posture: named, in one place, overridable by the
  caller, and METHODOLOGY.md open decision 15.
- **2026-08-20 · Weight findings sort before reference positions, and a percentile is
  never sorted against a share.** Inside one severity the engine orders by what the page
  is made of, then by where the page sits among other people's pages. Sorting 0.902 (a
  percentile) above 0.663 (a share) would have led the public scan with a statistic about
  other services rather than with a fact about this one, and the two quantities are not
  comparable in the first place.
- **2026-08-20 · The public surfaces read the french catalog explicitly.** They were
  french-in-both-locales by writing french into `en.ts`, which works until a string is
  shared with an interface surface: the finding sentences are on the free scan and on the
  run detail. `tFr` in the app's i18n module names the intent instead, and the finding
  strings are translated normally. Existing blocks are left as they are.
- **2026-08-20 · The tail generator spreads around its own mean and refuses a response
  under a kilobyte.** The previous slice found a fixture tail of seventy-six requests at
  twenty-six bytes each by reading it. A fixed base size produces that again the moment a
  tail's mean changes, so the size is drawn from the mean and the floor is asserted in
  code, with the origin named in the error.

- **2026-08-20 · A capture is authored once and everything else reduces it.** Run #4812 had
  two resource lists describing different pages, and they disagreed about the run's third
  parties by 160 KB. The run detail's list also could not have been measured: eight resources
  plus a tail of seventy-six weighing two kilobytes between them is twenty-six bytes each,
  and a response cannot be smaller than its headers. `capture-canon-source.ts` now holds the
  only list; `extractMetrics`, `summariseResources`, the attribution engine and the budget
  engine each reduce it. The budget canon's `fromSide` is deleted, which removes a third
  implementation of the first-party test that matched a url prefix rather than an origin and
  would have counted `sevre-et-loire.fr.example.com` as first party.
- **2026-08-20 · Where a scenario is one page, even the centre is derived.** `fromCapture`
  reads the metric centres off the capture, so the only authored numbers for a page are its
  resource list and how far its runs spread. An aggregate over several pages, like the service
  median or a journey, has no single capture and still states a centre. That difference is
  the honest one and it is now visible in the scenario declarations.
- **2026-08-20 · The waterfall draws timings, because the capture now records them.**
  `CapturedResource` carries `startMs` and `durationMs` from the browser's own resource
  timing. The bar starts where the request started and is as long as the response took; the
  weight is the column beside it. The version that positioned a bar by time and sized it by
  bytes was two scales on one mark, and both were fixture values. A resource the browser
  reports no timing for draws no bar rather than one at zero.
- **2026-08-20 · Coverage is measured or it is absent.** `unusedBytesFromCoverage` resolves
  v8's nested ranges: a character is executed when the innermost range holding it ran, so a
  function that ran with a dead branch inside it is not credited for the branch. It counts
  bytes over the text the offsets cut rather than scaling a character count, because coverage
  offsets are positions in the source and a bundle with accented strings has more bytes than
  characters. A report that does not describe the text it arrived with returns null, and the
  resource records no coverage rather than an approximate figure.
- **2026-08-20 · Coverage instrumentation is part of the environment, and is off by default.**
  V8's precise coverage instruments execution and therefore moves `js_execution_ms`. Until
  that movement is measured, the runner leaves it off, records `coverageEnabled` on the
  environment fingerprint, and invariant 3 keeps an instrumented run and an uninstrumented one
  from being compared. METHODOLOGY.md open decision 14 states the three ways out.
- **2026-08-20 · The third-party draw is reversed, not rotated.** Rotating the run offsets
  gave the share metric its dispersion but moved the middle run off its centre, so the share
  an aggregation reported was not the share of the capture it publishes. The offsets are
  symmetric about the middle run, so reversing them gives every other run a different share
  and leaves the middle one exactly where it was. The test that extracts a published capture
  and holds the aggregation to it found this on its first run.
- **2026-08-20 · `medianRunIndex` names the run a capture belongs to.** An aggregate holds no
  capture, so anything that shows one page has to name a run, and it is the one sitting on the
  reported median. With an even run count the median falls between two runs and the answer is
  null: no capture recorded that page, and picking the nearer of the two would put an
  inventory under a figure it does not add up to.

- **2026-08-20 · Every statistic in the application is one the kernel computed.** Medians,
  dispersions, noise floors and confidence grades were typed into fixtures, and five
  generators each fabricated their own. Three of them contradicted the runs printed beside
  them: the run detail drew five run dots and stated a MAD of 9 where those five give 4, the
  comparison marked DOM nodes low confidence where `gradeConfidence` grades them medium, and
  the free scan printed "confiance élevée" in green on a single cold pass with no history,
  where the kernel grades it low. `pnpm gen:measurement-canon` now builds runs and hands them
  to `aggregateRuns`, `computeNoiseFloor` and `gradeConfidence`, and everything after that is
  derived. A test recomputes the median, the MAD, the extremes and the grade from the run
  values written beside them, so a fixture cannot state a statistic its own runs do not give.
- **2026-08-20 · What is authored is a distribution, never an aggregate.** The fixture says
  what a scenario settles at, how far its runs spread, how many there were and how much
  history sits behind it. It never says what the median is. The runs are shaped rather than
  random so the file regenerates identically, five per aggregation with the middle one exactly
  on the centre, because the median run is the capture the run detail and the resource
  inventory hold and a median falling between two runs would describe a page no capture
  recorded.
- **2026-08-20 · A noise floor belongs to a scenario, not to a run.** Baseline #4790 and
  candidate #4812 are two aggregations of one route, so the comparison reads both against one
  floor computed from that route's history. Modelling them as two scenarios would have given
  one route two different floors and made the verdict depend on which side you asked. The
  candidate's own dispersion still differs from the baseline's, and the dispersion card now
  draws a box per side rather than one shared MAD.
- **2026-08-20 · The kernel's verdict stands where it disagrees with the design.** With the
  floor derived rather than typed, two extra requests on a 1.2-request floor is a real change,
  where the design canon showed it as no significant change. The pull request did add a
  bundle. Nothing was widened to put the old verdict back.
- **2026-08-20 · A measured value under 10 KB keeps a decimal.** `formatMeasured` rounded to
  whole kilobytes above 1 000 B, so a 7 380 byte floor and a 7 490 byte one both read "7 KB",
  and the same floor read "7.4 KB" on the run detail and "7 KB" in the annex. One decimal below
  10 KB, whole kilobytes above, which leaves at least two significant figures anywhere the unit
  is kilobytes. Closes the open to-do from the check slice.
- **2026-08-20 · Run #4812's register entry describes run #4812.** The ledger recorded the
  retained run against `/accueil` carrying the service median's bytes and the candidate's
  request count, while the run detail that links to it shows `/demarches/acte-naissance`. It
  now carries that run's own scenario, metrics, dispersion, confidence and estimate.
- **2026-08-20 · The annex's measured-state table is one measurement.** It mixed the candidate
  run's request count with the service median's bytes and the baseline's DOM dispersion, and
  its prose stated a third-party share the row above it did not. All four rows and the sentence
  now come from the service aggregation.

- **2026-08-20 · Only energy models share the gCO2e band.** EcoIndex reads its figure off
  a score and is blind to the grid and to hosting; SWD v4 and 1byte compute an energy. On
  France's grid that is a 31x gap, and averaging it or plotting it on one linear axis would
  both have been lies of a different kind. `bandModels()` splits on `method === 'energy'`,
  computed from what each model declares about itself. EcoIndex is reported beside the band
  as its own grade and score, with its gCO2e figure named. `METHODOLOGY.md` 10.1.
- **2026-08-20 · Every carbon figure in the application is an estimate the package
  produced.** `pnpm gen:carbon-canon` runs all three models over the measurements the other
  canons publish and writes back the band, the reference value, the noise carried through
  the model, and every assumption. The dashboard, the run detail, the comparison, the free
  scan, the annex figure, the fleet, the observatory, the tender, the contract tracker, the
  execution report and the ledger entry all read it, so no two surfaces state a different
  footprint for the same service. A test estimates every page again and holds the
  checked-in copy to it.
- **2026-08-20 · Provenance is never displaced by an alert.** The metric tile swapped its
  provenance line for a state message when it had one, which dropped the model and version
  from the carbon tile exactly where the figure is read most closely. Both lines render now,
  and a rendering test asserts it, because invariant 1 is a rendering rule.
- **2026-08-20 · The estimate's noise region is the measured floor carried through the
  model, not a second uncertainty.** An estimate has no runs of its own, so it has no
  dispersion of its own. The comparison row's band is what the band models each make of the
  size of the change, its noise region is the transferred-bytes floor run through the
  reference model on both sides, and its verdict is inherited from the measured metric that
  drives it. Nothing on that row can make an estimate significant on its own.
- **2026-08-20 · The contract tracker states a ceiling, never a rate of rise.** Its early
  warning read "conformity is rising at 1.9 pt/month", extrapolated from history nothing
  holds, and named 14 unassessed declarative criteria where the engine finds 3. It now says
  what is measurable: the rate today, what answering the open criteria can reach at best,
  and how far short of the target that leaves you. The 90-day trend cell on that row reads
  "no history" rather than drawing a line, because the two would have contradicted each
  other on one screen.
- **2026-08-20 · The criteria canon answers the pack; it does not describe an answer.**
  The workspace ran on fourteen hand-written rows whose tier split (31 automated) the real
  pack contradicts (9). The generator now hands the engine a measured metric set and the
  two reviewers' attestations and writes what comes back. Choosing the inputs is the
  fixture's job; every status, count, family bar and blocking finding is derived.
- **2026-08-20 · Answered is reported beside where the answer came from.** With
  `tiersSignedOff: false` the engine answers nothing from measurement, so a criterion the
  pack proposes as automated and a person attested reads 9/9 on the tier card. That is true
  and it is misleading alone, so the screen carries `bySource` next to it: 0 from
  measurement, 73 attested, 5 not looked at.
- **2026-08-20 · The sign-off gate is on the screen, not in a comment.** The workspace and
  the dashboard state that the tier split is a proposal and that one criterion in
  seventy-eight carries a rule the engine could run. It is the decision the product is
  waiting on, and it belongs where it is read rather than in a to-do list.
- **2026-08-20 · A published declaration quotes the referential, never a label we wrote.**
  The document's non-conformity table listed short paraphrases, one of them for criterion
  6.9, which the referential does not have. It now prints `statementFr` verbatim beside the
  reviewer's justification, and prints in breach red where a justification is missing.
- **2026-08-20 · A family entirely out of scope reads N/A, not 0/0.** Algorithmie is seven
  criteria about model training and this service trains nothing, so its applicable count is
  zero. An empty bar beside 0/0 reads as a failure.
- **2026-08-20 · A source span is two line numbers and nothing else.** `SourceBytes.span`
  carries the first and last original line the bundle took a byte from, and no per-line
  weight. A heaviest-line figure was drafted and dropped: it would have pointed a developer
  at the line that produced the most output, which is not the line that grew, and it does
  not merge exactly when one module is split across two chunks. Min and max do.
- **2026-08-20 · A span is read from the candidate side alone.** Line numbers from two
  builds of one file describe two files, so nothing is compared across versions. A module
  the candidate dropped is left unplaced rather than placed where it used to be.
- **2026-08-20 · A segment carrying no byte does not widen a span.** Bundlers emit
  zero-width segments; a position the bundle took nothing from is not a line it uses. A
  source whose every segment is empty comes back `span: null`, not `1..1`.
- **2026-08-20 · `placeGrowth` is the only thing allowed to say a file can be annotated.**
  Three refusals, each where a guess would fit: no position from the map, a dependency, a
  path that leaves the repository. `@balise/budgets` takes what it is given and checks none
  of it, so the honesty rule lives in one place.
- **2026-08-20 · A placed source file annotates as a notice, never higher.** Attribution
  explains a breach and the budget file decides it. Notices also sort last, so the fifty per
  request cap drops an explanation before it drops a finding.
- **2026-08-20 · The check screen's inline annotation card is now the real annotation.**
  It was a mockup: a hand-written sentence, a hand-picked line 14, and date-fns's +160 KB
  printed beside `src/lib/dates.ts`, which the module diff puts at +120 B. The diff hunk
  stays, because it is the customer's own code that github renders and we never fetch; the
  note beside it is what `buildCheckRun` produced.
- **2026-08-20 · The canon's source maps now carry one segment per original line.** They
  mapped every module to line 0, so every span would have been `1..1` and the first thing
  the placement rendered would have been the default it exists to refuse.
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

## Resolved: the carbon band the models actually produce

Decided 2026-08-20, option 2. Kept here because the reasoning is the point.

Every carbon figure in the application came from the design canon, drawn before
`packages/carbon-models` existed. It showed four models spanning 0.31 to 0.58 gCO2e per
visit, one of them ADEME Base Empreinte, which this build does not implement. Running the
three models we do have over the canon's own measurements said something else entirely:

| Page | EcoIndex | SWD v4 | 1byte | Spread |
| --- | --: | --: | --: | --: |
| Dashboard route | 2.436 | 0.078 | 0.301 | 31x |
| Free scan page | 2.280 | 0.059 | 0.227 | 39x |
| Baseline before PR #412 | 2.407 | 0.067 | 0.258 | 36x |

The gap is structural. EcoIndex returns 2.436 for that page on a French grid, on a
European grid, and on grey hosting: it reads a figure off a score and electricity is not
one of its inputs. The other two compute an energy and multiply it by an emissions
intensity, which is why they land an order of magnitude lower.

The band now carries the energy models and EcoIndex is reported beside it as the grade and
score it publishes, with its own gCO2e figure named rather than hidden. `METHODOLOGY.md`
10.1 carries the reasoning; `bandModels()` applies it from what each model declares about
itself, never from a list of names.

One correction the work produced: the rule was first written as "models that respond to
grid intensity and hosting", on the assumption that both energy models track the grid. The
sensitivity test found on its first run that 1byte does not, and never did: it uses fixed
published intensities of 519 and 475 gCO2e/kWh, which its own first assumption already
said verbatim. Under the rule as first written the band would have held one model. The
rule moved to `method === 'energy'`, which is the line that actually holds.

Still open, and not ours to decide alone: whether `swd` stays the reference model, and
what the tender's contractual ceiling should be. This build sets it at 0.100 gCO2e per
visit, proportionate to the 0.076 the reference model gives, which is a placeholder for a
number a supplier signs.

---

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

- **2026-08-19 · Budgets were built before the api, for the same reason as the
  ledger and the criteria engine.** Evaluation is pure, so it can be built and fully
  verified here, while the api needs a database container and the github check needs
  an app registration. Nothing in the roadmap was reordered otherwise.
- **2026-08-19 · balise.yml is read by a parser written in the package**, over a
  documented subset of yaml: comments, mappings, sequences, single-line flow
  collections, plain and quoted scalars. Anchors, aliases, tags, block scalars, merge
  keys, several documents and tab indentation are refused by name with their line.
  This avoided a parser dependency and, more importantly, made the failure mode a
  refusal rather than a misreading. A file that decides whether a build fails is not
  a place for a parser to guess. Swapping in a full parser later is one file behind
  the same interface.
- **2026-08-19 · An unknown key in balise.yml is an error, not a shrug.** A typo in
  a budget key would otherwise switch a limit off in silence, which is the worst
  thing this package could do.
- **2026-08-19 · No budget is decided on a scenario whose noise floor is not
  established.** The statistics rules say budgets activate once the floor exists; the
  engine returns `non_evalue` with the reason, and the check reports neutral rather
  than green or red. A budget that fails on measurement noise gets switched off
  within a week, and a check nobody trusts is worse than no check.
- **2026-08-19 · A growth limit is passed through `classifyDelta` first.** If the
  kernel does not call the change a change, the limit cannot have been broken by it,
  whatever the percentage says. There is no second implementation of that decision in
  this package.
- **2026-08-19 · `withinNoise` reports, it does not decide.** When the distance to
  the deciding threshold is smaller than the noise floor, the assessment says so and
  the verdict is unchanged. Moving the verdict instead would have meant a route could
  park just past a threshold forever; saying nothing would have meant presenting a
  coin toss as a result.
- **2026-08-19 · An override lifts the merge block and never the breach.** The
  breach is still counted, still shown and still goes to the execution report. The
  override expires, and an expired one stops applying on its own.
- **2026-08-19 · A `service` scope is checked on every scenario measured.** Checking
  it against a service-wide aggregate would let it hold while a single route breached
  it, and would also mean inventing an aggregation rule the methodology does not have.
- **2026-08-19 · `noise_floor` accepts only `auto`.** A written floor would be a
  hand-chosen number, which is exactly what a derived floor exists to avoid.
- **2026-08-19 · The budget engine emits reason codes, not sentences.** Unlike the
  criteria engine, whose french text is domain content quoted from the referential,
  nothing a budget reports is domain text: the strings live in `packages/i18n` and the
  engine stays free of the interface language.
- **2026-08-19 · The repository carries its own balise.yml.** The operating manual
  sets budgets for the dashboard, the free scan and the observatory; they are now
  written down and a test holds the file to the reader. They are not enforced: no run
  has been taken against this app, so no scenario has a floor, and by the rule above a
  budget without a floor decides nothing. They go live the day the runner measures us.

- **2026-08-19 · The budgets screen shows main and the check shows the head.** The
  mockup's table mixes them: it puts the pull request's 1 298 KB on a screen labelled
  `branch main` next to the journey's baseline figure. Wiring the engine forced the
  question, because an evaluation runs against one set of aggregates or another. The
  branch view carries no baseline, so the growth rule comes back `non_evalue` there,
  which is also what the mockup's dash in that row was saying.
- **2026-08-19 · The canon's pull request verdicts are the reverse of the mockup's
  rows, and agree with the mockup's own summary line.** It labels the route `fail` and
  the journey `warn` while its status line reads "1 route over budget, 1 real
  regression". Against the file it publishes, the journey at 1 442 KB is the only
  thing over a limit (1 400 KB) and the route at 1 298 KB is a warning sitting 2 KB
  under its own. The status line is computed now and says two significant regressions,
  because the journey walks through the same page.
- **2026-08-19 · The canon gained `/actualites`, so the recorded override has
  something to override.** 1 240 KB against a 900 KB budget is 340 KB over, which is
  the video hero the override quotes. Its third-party share is where the service-wide
  38 percent in the mockup comes from.
- **2026-08-19 · An override on one metric does not cover another.** The video pushed
  both the transferred bytes and the third-party share past their limits. The recorded
  override lifts the block on the one it was asked for; the share breach still blocks
  the merge and still shows. A visible escape hatch stays honest only while it is
  narrow.
- **2026-08-19 · The override the engine honours is the ledger entry.** Reason,
  author, date and pull request are read from the recorded payload rather than typed
  into a fixture, and the card links to `/v/<hash>`. A test fails if the two ever
  disagree.
- **2026-08-19 · The yaml view renders the file the engine read.** The highlighter is
  presentational, never parses, and leaves a line it does not understand as plain
  text; a test asserts it loses no character of the file. The threshold column shows
  the limit in the unit of the value beside it, with the customer's own text on the
  title attribute, so `1300KB` and `1 298 KB` do not sit next to each other pretending
  to be comparable.
- **2026-08-19 · The check comment carries the same attribution sentence as the
  comparison screen.** Both call `attributionLead`. The mockup's "suggested fix" line
  is replaced by the coverage statement for the reason already recorded: a remediation
  estimate is not measurable from a source map.
- **2026-08-19 · The comment renders through the component, not through a
  screenshot.** The operating manual asks for the same band in the browser, in the
  pull request and in the pdf, and the only way to be sure of that is for the three
  to be the same code. `@balise/ui/svg` renders `ToleranceBand` with react-dom and
  returns a standalone document. A headless screenshot would have introduced a
  second renderer, a font race and a png with a timestamp in it, and the document
  hash goes in the ledger. react-dom is added to `packages/ui` as a peer: it was
  already in the workspace, and `./svg` is a separate entry point so nothing pulls
  the server renderer into the browser bundle. Verified against the built bundle.
- **2026-08-19 · Annotations point at the budget file and nothing else.** Every
  annotation names a line that was actually read: the yaml reader records a line per
  threshold, so the note sits on the rule that decided. Attribution resolves grown
  bytes to a source file but not to a position, so no source file is annotated;
  pointing at line 1 would be exactly the guess invariant 5 forbids. Recorded as a
  to-do: the mappings carry original lines, and `attributeBundle` currently discards
  them.
- **2026-08-19 · One annotation per rule, decided by its worst scenario.** A
  service-wide rule evaluated over four scenarios would otherwise leave four notes on
  one line of the file. The note names the scenario it was decided by when the rule
  covered more than one.
- **2026-08-19 · The check line counts budgets, not routes.** The mockup says "1
  route over budget"; in the canon the breach is on a journey, so the copy was wrong
  on its own data. It now reads "1 budget over its limit".
- **2026-08-19 · Blocking is matched by value, never by object identity.** A summary
  and its assessments reach a renderer through json as often as through memory. The
  identity check worked in the package tests and stopped working the moment the
  generated fixture round-tripped it, which is the failure a test now holds shut.
- **2026-08-19 · Measured values are formatted in `@balise/schemas`, beside the
  `Unit` they are formatting.** The screen, the check comment and the documents all
  need "842 KB" to be the same string, and there was nowhere both a react package and
  a node package could import it from. `@balise/ui` re-exports it, so no surface
  changed.
- **2026-08-19 · The metric labels moved to a top-level `metrics` in the catalog.**
  They were under the budgets screen, and the artifact needs the same words.
- **2026-08-19 · Axis ticks are formatted, measurements are not.** The band's default
  tick formatter dropped binary floating point noise (`2.4000000000000004`), which is
  a derived axis position and never a measured value. Invariant 6 is untouched: no
  measurement passes through it.
- **2026-08-19 · The check screen shows the artifact verbatim.** A Markdown view
  beside the rendered one, built at render time from the same assessments so it
  follows the interface locale. The generated canon carries the runs and the
  provenance; the text is never baked into a fixture.

