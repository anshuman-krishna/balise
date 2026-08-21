## Balise

Evidence infrastructure for the environmental criterion in French public procurement,
applied to digital services.

Balise measures a web service continuously (bytes, requests, DOM, CPU, third parties),
does it reproducibly enough to survive a hostile audit, and turns those measurements into
the documents that decide public contracts:

1. The tender annex (annexe environnementale du mémoire technique) that wins the contract.
2. The execution report (rapport de suivi de la clause d'exécution) that keeps it.
3. The ecodesign declaration (déclaration d'écoconception RGESN) that the customer
   publishes on their own site.

Everything else in this repository exists to make those three documents credible. The
pull request check, the dashboard, the attribution engine, the ledger: all of it is
machinery underneath the documents.

## Why now

From 21 August 2026, article 35 of the loi Climat et Résilience requires every French
public buyer to include at least one environmental criterion in the scoring of offers,
and at least one environmental clause in the execution conditions of the contract.

The law names no standard form of proof. Buyers have to score something with no accepted
yardstick, and suppliers have to prove something with no accepted artifact. Balise is
built to be that artifact: reproducible, multi-model, explicit about uncertainty, and
chained to evidence you can check without asking us.

## What it is not

Not a carbon calculator. Not a CSR reporting tool. Not an organisation-wide IT footprint
platform. There is no employee carbon module, no CSRD export, no AI-generated remediation
patch. Those are all defensible products and none of them is this one.

We are also not the most accurate measurement on the market. Measuring on real hardware
beats a headless browser and always will. We are the most **defensible** measurement:
reproducible, multi-model, uncertainty-explicit, and chained to tamper-evident evidence.
Every engineering decision in here protects that position.

## Principles

These are enforced in code and tested, not aspirational.

- **Uncertainty is drawn, never written.** Every figure ships with its spread across
  estimation models and its run-to-run noise floor. There is no bare-number mode, in the
  app, in a PDF, in a PR comment, in a badge or in a CSV.
- **A delta below the noise floor is not a change.** It is reported as no significant
  change, even when the sign looks favourable. One function decides this, and everything
  else calls it.
- **Median and MAD, never mean.** Page load distributions have long right tails. Five runs
  per scenario minimum, and cold and warm passes are never averaged together.
- **Models disagree, and that is the point.** They are never averaged into a headline
  number, and no outlier is quietly dropped.
- **Honest degradation.** A missing source map, thin history, an unstable runner: each is
  stated plainly and named, never guessed around. Attribution that cannot resolve says so
  rather than picking the largest new import, and a finding coverage could not see is
  withheld rather than reported as zero.
- **No saving is ever projected.** A finding states a quantity measured on the page and
  what it is a share of. What the page would weigh in another format is a statement about a
  page nobody loaded, and one projection in a report makes the whole report a projection.
- **An engagement nobody signed is never reported as breached.** A contractual commitment
  is a measured figure, a threshold someone signed, and one definition of the margin between
  them. The three surfaces that carry commitments read one object, so they cannot disagree
  about the headroom, the gauge or whether the supplier is in breach.
- **A comparison is a position in a corpus that exists.** The public index ranks services
  against the ones actually measured, states how many that is, orders on a measured
  quantity rather than on an estimate whose bands overlap, and gives a rank rather than a
  percentile. Every row in it is measured on the same page, the same pass and the same
  profile.
- **The register is measurement, not campaign.** No leaves, no globes, no gradients from
  teal to lime. Green appears as a pass state and never as a brand colour.

## How it fits together

**Measure.** `apps/runner` drives a pinned Chromium through named throttle profiles, with
a fresh browser context per run so a cold pass stays cold. Every response is recorded with
what the browser did with it, what crossed the wire, what it decompressed to, when it started
and how long it took, and, when coverage is asked for, how much of it never ran. Every run
records a complete environment fingerprint, and two runs with different fingerprints are not
compared without a flag that goes on the record. Coverage instrumentation is one of those
fields, because instrumenting execution changes the execution time it reports.

**Reduce.** `packages/measure-core` is pure functions over raw captures: median and MAD,
the per-metric noise floor from rolling history, confidence grading, and `classifyDelta`,
which is the mechanical form of the rule that nothing fails on noise. It also holds the three
reductions of a capture, the six metrics, the resource inventory and the findings, so a
screen's totals and the figures above them cannot come from different arithmetic. It has no
IO and the heaviest test suite in the repository.

A finding is what the capture shows about itself: images are 66 % of the page, one response
is a quarter of it, 442 KB of a bundle's decoded bytes never executed. Each carries the basis
it is a share of, because unexecuted bytes are a share of what decompressed and not of what
crossed the wire. None of them is a projected saving, and the only comparison to other
services is a position in the quantile tables EcoIndex publishes, with the source and its
version printed beside the number.

**Estimate.** `packages/carbon-models` runs every configured model on every run. Each one
declares its assumptions as data, and those assumptions render wherever its output
appears. What you get back is a band across models with your reference model marked, never
a single figure.

**Explain.** `packages/attribution` diffs the resource graph, reads source maps, credits
decoded bytes to modules, and names the commits that touched a first-party file between
two runs. It refuses in four places rather than guess: no map, an unreadable map, a
dependency (whose growth is a manifest change and a different question), and a path that
leaves the repository.

**Enforce.** `packages/budgets` reads `balise.yml`, evaluates each rule through
`classifyDelta` first, and builds the check run: the line beside the check name, the
markdown body, and the annotations. A budget on a scenario with no established noise floor
is not active and says so. An override lifts the merge block, never the finding, and lands
in the ledger.

**Assess.** `packages/criteria-engine` evaluates a rule pack without knowing anything about
which referential it is. Every criterion is Automated, Assisted or Declarative, and the
tier is enforced in code: an assisted answer is a proposal that counts for nothing until a
person confirms it, a declarative criterion is never touched by a machine, and a human
attestation always overrules measurement.

**Record.** `packages/ledger` is an append-only, per-tenant hash chain with Merkle
anchoring. There is no update, no delete and no repair utility. If the chain is broken,
that fact is the finding and it gets surfaced.

**Commit.** The tender proposes contractual engagements, the contract carries the ones that
were signed, and the execution report reports on those. All three read one object, so the
headroom on a commitment is one number and an engagement that was proposed and not taken is
never reported as breached. Only the wording each carries into the annexe and the threshold
the supplier signs are authored; the margin, the status, the gauge and the trend are derived.

**Compare.** The fleet view and the public index set services against each other, which
makes almost every figure on them a position rather than a quantity. Each one is computed
from the corpus of services actually measured: the rank from their measured page weights,
the grade from the metrics printed beside it, the trend from two measurements read against
that scenario's own floor, the histogram from the corpus's own distribution. Green hosting
credit is applied per service and only where the check was made, so an unverified host is
not quietly credited with a data centre it may not have.

## The tolerance band

One component carries the product's whole argument, so it lives in `packages/ui` and gets
the design boldness that everything around it does without.

`ToleranceBand` draws a measured value with the band of disagreement across estimation
models, overlaid with a lighter region marking the measurement noise floor. A regression
draws as a regression only once it clears the noise region, which makes the rule visible
instead of asking anyone to trust it.

It renders identically in the browser, as a standalone SVG for the pull request comment
and the embeddable badge, and in the document pipeline, because all three go through the
same component rather than three drawings of it.

## Vocabulary

The product is French-market and the codebase is English. Domain nouns with no good
English equivalent stay French in the interface and get an English identifier in code.

| Term | What it means |
| --- | --- |
| RGESN | Référentiel général d'écoconception de services numériques. 78 criteria in 9 families, published 2024 by Arcep and Arcom with ADEME, DINUM, CNIL and INRIA. Our primary rule pack. |
| Déclaration d'écoconception | The page the service owner publishes stating conformity criterion by criterion, modelled on the RGAA accessibility declaration. |
| Mémoire technique | The technical response a bidder submits. The tender annex attaches to it. |
| Critère d'attribution | Award criterion. Used to score and rank offers. |
| Clause d'exécution | Execution clause. A contractual obligation carried for the life of the contract, with reporting the buyer can demand. |
| Acheteur | The public buyer, who writes the tender and scores the offers. |
| Parcours utilisateur | User journey. RGESN audits are scoped to journeys as well as pages, so journeys are first class here, not a special case. |
| Noise floor | Our term. The measured dispersion below which a delta is not a change. |
| Tolerance band | Our term. The spread across models plus measurement noise, drawn rather than described. |

## Repository layout

```
apps/
  web/                  React application (Vite, React 19)
  runner/               Playwright measurement worker, pinned Chromium

packages/
  schemas/              Zod contracts, single source of truth for every shape
  measure-core/         Metric extraction, statistics, noise floor, delta classification, findings
  carbon-models/        Pluggable estimation models (ecoindex, swd v4, onebyte)
  criteria-engine/      Referential-agnostic rule evaluation, tiers and blocking findings
  rule-packs/           Versioned referentials. RGESN 2024 v2, statements verbatim
  attribution/          Bundle diff, source maps, blame, and honest unavailability
  budgets/              balise.yml, budget evaluation, and what the check posts
  ledger/               Append-only hash chain, Merkle anchoring, verification
  i18n/                 Every user-facing string, fr + en
  ui/                   Design tokens and shared components, including ToleranceBand

docs/
  METHODOLOGY.md        The public measurement contract, versioned
  DECISIONS/            Architecture decision records, numbered, append-only
  RUNBOOK.md            Operational procedures, and the ones that do not exist yet
```

`schemas`, `measure-core`, `carbon-models`, `criteria-engine` and `rule-packs` are
Apache-2.0 and meant for standalone publication. Nobody should trust a black box that
claims to produce audit evidence, so the parts that produce it are open and their
dependency surface is kept deliberately small: a dependency is one more thing a sceptical
auditor gets to question. The platform around them (history, documents, multi-tenancy,
workflow) is the proprietary part, and that is the right way round.

Between them those five packages carry two runtime dependencies: `zod`, and each other.
`scripts/check-package-surface.mjs` keeps it that way, and fails the build on a published
source file that imports something undeclared, imports a Node builtin, or calls `fetch`,
`process.env`, `Date.now` or `Math.random`. The last three are the reproducibility promise
written as a check: given the same input these packages must return the same output
forever, and a clock is the easiest way to break that without noticing.

```bash
pnpm check:packages   # licences, readmes, changelogs, dependency surface
pnpm audit:prod       # what a consumer installs, high severity and above
```

Publishing is manual, by `workflow_dispatch`, and the release workflow packs the five,
installs the tarballs into an empty directory and runs them there before it will publish
anything. That last step is the only one that exercises the resolution path a consumer
actually takes.

## Getting started

Requirements: Node 22 or newer, and pnpm.

```bash
pnpm install
pnpm dev              # run the web app
pnpm test             # every suite
pnpm typecheck
pnpm lint
pnpm build
```

Measurement and evidence:

```bash
pnpm test:repro       # the reproducibility suite, slow, needs the pinned browser
pnpm runner:local     # measure a url locally with the pinned profile
```

The generated fixtures the application screens read are rebuilt from their engines, never
edited by hand. Each has a test that recomputes it and fails if the checked-in copy and the
generator ever disagree.

```bash
pnpm gen:attribution-canon
pnpm gen:budget-canon
pnpm gen:carbon-canon
pnpm gen:corpus-canon
pnpm gen:criteria-canon
pnpm gen:engagement-canon
pnpm gen:findings-canon
pnpm gen:ledger-canon
pnpm gen:measurement-canon
```

`gen:measurement-canon` sits underneath the other seven. It is the one place a median, a
dispersion, a noise floor or a confidence grade is produced, and the carbon, budget and
ledger canons read their byte counts and floors from it rather than restating them, so the
estimate, the verdict and the register all describe the same run.

Underneath that again is one capture per run: a real list of responses that the metrics are
extracted from, the inventory is grouped from, the findings are raised from, and the
attribution and budget engines are run over. Nothing sums a resource list of its own, which is
how a page stops weighing one thing in its metric row and another in its resource table.

## Status

Early build, and honest about which parts are real.

Real and tested: the measurement kernel, the carbon models with golden fixtures pinned to
published reference implementations, the RGESN 2024 v2 pack with all 78 statements
verbatim from the official evaluation spreadsheet, the criteria engine, the attribution
package, the budget and check engine, the ledger, and the application screens, which read
generated fixtures rather than typed numbers.

Not yet real: the API and its database, document rendering, multi-tenancy and billing. The
runner exists but has never executed its reproducibility suite in anger, and says so rather
than implying otherwise. The five publishable packages are packaged, verified standalone and
not published: `0.1.0` is the shape of a first release rather than a release.

Waiting on a decision rather than on code: `docs/METHODOLOGY.md` is a v1.0 draft and not in
force, the RGESN tier split ships as a proposal that nothing is answered automatically
from, the evaluation thresholds are ours to set because the referential sets almost none,
the finding thresholds decide what a public surface calls a problem on a service whose
owner never asked to be measured, and what a comparison surface is allowed to compare is
a question about what an index is for. Those gates are stated in the interface, not buried
in a to-do list.

`PLAN.md` holds the living roadmap, the to-do lists and the decisions log.

## Carbon model provenance

Model constants and formulas come from their published sources: the EcoIndex quantile
tables and formula from the published CNUMR method (ecoindex.fr), Sustainable Web Design
v4 constants from sustainablewebdesign.org, and the 1byte model constants as carried by the
Green Web Foundation's co2.js. Golden fixture tests fail on any drift from those
references.

Each model declares its assumptions as data rather than as documentation, and those
assumptions are rendered on every surface where the model's output appears. If an
assumption is not in that array, we are hiding it.
