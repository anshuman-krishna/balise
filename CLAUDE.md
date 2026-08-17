# CLAUDE.md

Operating manual for Claude Code on the Balise repository. Read this fully before
touching anything. If a rule here conflicts with a request in the chat, say so and
ask, rather than silently picking one.

Last revised: 2026-08-15. Spec version: 1.0.

---

## 1. WHAT THIS PROJECT IS

Balise is evidence infrastructure for the environmental criterion in French public
procurement, applied to digital services.

We continuously measure a web service (bytes, requests, DOM, CPU, third parties),
we do it reproducibly enough to survive a hostile audit, and we convert those
measurements into the documents that decide public contracts:

1. The **tender annex** (annexe environnementale du mémoire technique) that wins
   the contract.
2. The **execution report** (rapport de suivi de la clause d'exécution) that keeps
   it.
3. The **ecodesign declaration** (déclaration d'écoconception RGESN) that the
   customer publishes on their own site.

Everything else in this repository exists to make those three documents credible.
The pull request check, the dashboard, the attribution engine, the ledger: all of
it is machinery underneath the documents.

### Why now

From 21 August 2026, article 35 of the loi Climat et Résilience requires every
French public buyer to include at least one environmental criterion in the scoring
of offers, and at least one environmental clause in the execution conditions of the
contract. The law names no standard form of proof. Buyers must score something with
no accepted yardstick. Suppliers must prove something with no accepted artifact.
That vacuum is the entire commercial opportunity.

### What we are not

We are not a carbon calculator. We are not a CSR reporting tool. We are not an
organisation-wide IT footprint platform. We do not do employee carbon, CSRD
modules, mobile app measurement, real-device labs, or AI-generated remediation
patches. Those are all defensible later and none of them helps win the first ten
customers. If a request drifts toward them, flag it.

### The competitive position, in one line

We are not the most accurate measurement on the market. Greenspector measures on
real hardware and will win that argument every time. We are the most **defensible**
measurement: reproducible, multi-model, uncertainty-explicit, and chained to
tamper-evident evidence. Every engineering decision should protect that position.

---

## 2. DOMAIN GLOSSARY

Read this section before writing any user-facing string, any database column name,
or any document template. Getting the vocabulary wrong makes the product look like
it was built by someone who has never seen a tender.

| Term | Meaning |
|---|---|
| **RGESN** | Référentiel Général d'Écoconception de Services Numériques. Published 2024 (version 2) by Arcep and Arcom with ADEME, DINUM, CNIL, INRIA. 78 criteria in 9 families. Our primary rule pack. |
| **Déclaration d'écoconception** | Public page the service owner publishes stating conformity criterion by criterion. Modelled on the RGAA accessibility declaration. Reachable from every page of the service, updated annually. |
| **Loi REEN** | Loi n° 2021-1485, 15 Nov 2021. Article 35 requires communes and EPCIs above 50,000 inhabitants to hold a responsible digital strategy from 1 Jan 2025. **Carries no sanction.** Never build a pitch or a UI message around enforcement risk. |
| **Loi Climat et Résilience** | Loi n° 2021-1104, 22 Aug 2021. Article 35 amends the Code de la commande publique. Effective 21 Aug 2026. This is our real driver. |
| **CCP** | Code de la commande publique. Article L. 2152-7 is the one that now requires an environmental award criterion. |
| **Marché public** | Public contract. 233 billion EUR in France in 2024, 223,000+ contracts, 60% to SMEs. |
| **Acheteur** | The public buyer. Writes the tender, scores the offers. Our P2 expansion user. |
| **Mémoire technique** | The technical response document a bidder submits. Our tender annex attaches to this. |
| **Critère d'attribution** | Award criterion. Used to score and rank offers. |
| **Clause d'exécution** | Execution clause. A contractual obligation carried for the full life of the contract, with reporting the buyer can demand. This is our retention mechanic. |
| **Coût du cycle de vie** | Whole-life cost. Where a buyer uses a single criterion, it must be this, including environmental externalities. |
| **EcoIndex** | Open source French scoring model. Weights DOM nodes ×3, requests ×2, page weight ×1. Produces an A to G grade. One of our carbon models. |
| **SWD** | Sustainable Web Design model, currently v4. Segments emissions across data centre, network, device, operational and embodied. One of our carbon models. |
| **1byte model** | Older per-byte energy model. Included for comparison and because some buyers still cite it. |
| **Base Empreinte / Base Carbone** | ADEME emission factor databases. Source of French-specific factors. |
| **GWF** | Green Web Foundation. Source of the green hosting dataset we check against. |
| **Grid intensity** | gCO2e per kWh for a given electricity grid. Varies enormously by country. France is unusually low, which materially changes results and must never be silently assumed. |
| **Parcours utilisateur** | User journey. RGESN audits are scoped to representative pages **and** principal journeys, typically 10 to 20 pages minimum. Our `Scenario` entity covers both. |
| **Tier (automation)** | Our own term. Every criterion is Automated, Assisted, or Declarative. See section 11. |
| **Noise floor** | Our own term. The measured dispersion below which a delta is not a change. See section 9. |
| **Tolerance band** | Our own term. The visual and data structure representing spread across carbon models plus measurement noise. The product's signature element. |

### Language rules

The product is French-market. The codebase is English. Do not mix.

- Code identifiers, comments, commit messages, table names, API fields: **English**.
- User-facing strings, document templates, criterion text: **French first**, English
  as a secondary locale.
- Domain nouns that have no good English equivalent stay French in the UI and get
  an English identifier in code. `mémoire technique` in the interface,
  `technicalMemo` in the codebase. Never invent a bad translation like "technical
  memory".
- All user-facing strings live in `packages/i18n`. Never hardcode a string in a
  component. Ever.

---

## 3. NON-NEGOTIABLE INVARIANTS

These are not preferences. Breaking any of them breaks the product's reason to
exist. If a task appears to require breaking one, stop and ask.

1. **Never display an estimate without its uncertainty band and its model version.**
   Not in the app, not in a PDF, not in a PR comment, not in a badge, not in a
   tooltip, not in a CSV export.

2. **Never report a delta below the computed noise floor as a change.** It is
   reported as "no significant change". No exceptions, including when a customer
   would prefer a nicer chart.

3. **Never compare runs with different `EnvironmentFingerprint` values** without an
   explicit, user-acknowledged, ledger-recorded flag.

4. **`LedgerEntry` is insert-only.** No UPDATE, no DELETE, ever, at any layer.
   Corrections are appended as superseding entries carrying a reason.

5. **Attribution degrades honestly.** If source maps are missing or resolution
   fails, the output is "attribution unavailable for this bundle". Never guess a
   cause, never infer from filename heuristics, never let an LLM speculate.

6. **Never round, smooth, or prettify a measurement for presentation.** Display
   precision is a formatting concern applied at the edge; stored values are raw.

7. **Every number in the UI renders in the mono face with tabular figures.**
   Numbers must be visually identifiable as measured values, and must align in
   columns.

8. **Interface copy never uses "sustainable", "eco-friendly", "green", "planet",
   "save the planet", or any variation.** The register is measurement and
   procurement. A criterion is "non conforme", not "needs attention".

9. **Every query touching tenant data is scoped by `organization_id`.** No
   exceptions, enforced by RLS as well as by application code.

10. **No customer repository is ever modified beyond opening a pull request.** No
    auto-merge, no force push, no direct commits to any branch we do not own.

11. **The RUM beacon collects no personal data, sets no cookie, and performs no
    fingerprinting.** If a proposed field could identify an individual or a
    session across visits, it does not ship.

12. **Rule packs and carbon models are versioned and pinned.** A historical
    assessment stays bound to the version it was made under, forever.

---

## 4. STACK

TypeScript monorepo. One language end to end. Playwright, the Chrome DevTools
Protocol, and source map tooling are all Node-native, and a solo builder cannot
afford a language boundary in the hot path.

| Layer | Choice | Rationale |
|---|---|---|
| Package manager | pnpm workspaces | Strict, fast, correct hoisting |
| Task runner | Turborepo | Caching across packages |
| Runner | Node 22 + Playwright, pinned Chromium | Determinism requires an exact build |
| API | Fastify | Small, fast, good schema story |
| Validation | Zod | Single source of truth for types |
| Queue | pg-boss | Postgres-backed. Do not add Redis |
| Database | Postgres 16 | Partitioned time-series tables for metrics |
| Object storage | S3-compatible on Scaleway | French sovereignty is a real selling point |
| Frontend | React 19 + Vite + TanStack Query | Standard, boring, fast |
| Styling | Tailwind with a custom token layer | Tokens in section 17 |
| Charts | visx | Enough control to build the tolerance band properly |
| Documents | Typst | Deterministic output. Report hashes must be stable |
| VCS integration | Octokit for GitHub, REST for GitLab | |
| Auth | better-auth, self-hosted | Public-sector buyers will ask where identity lives |
| Billing | Stripe + manual invoicing via Chorus Pro | Public bodies cannot pay by card |
| Email | Postmark or Brevo | Transactional only |
| Errors | Sentry, self-hosted or EU region | |

### Things deliberately not in the stack

Redis, Kafka, a second database, an ORM with lazy loading, GraphQL, a CSS-in-JS
runtime, Next.js, a state management library beyond TanStack Query and React
state, Inter as a typeface. If you think one of these is needed, ask first and
explain what specifically fails without it.

---

## 5. REPOSITORY LAYOUT

```
apps/
  api/                  Fastify REST API, webhooks, auth, billing
  web/                  React application
  runner/               Playwright measurement worker
  docs-service/         Typst rendering service
  observatory/          Public index, statically generated, separate deploy

packages/
  measure-core/         Metric extraction, statistics, noise floor        [OSS]
  carbon-models/        Pluggable estimation models, versioned            [OSS]
  criteria-engine/      Referential-agnostic rule evaluation              [OSS]
  rule-packs/           rgesn-2024-v2.yaml and future packs               [OSS]
  attribution/          Bundle diff, source maps, blame resolution
  ledger/               Hash chain, Merkle roots, verification
  ui/                   Shared components including ToleranceBand
  schemas/              Zod contracts shared across all apps
  i18n/                 All user-facing strings, fr + en
  config/               Shared eslint, tsconfig, tailwind preset

docs/
  METHODOLOGY.md        The public measurement contract. Versioned.
  DECISIONS/            ADRs, numbered, append-only
  RUNBOOK.md            Operational procedures
```

### The four OSS packages

`measure-core`, `carbon-models`, `criteria-engine` and `rule-packs` are Apache 2.0
and published to npm. Nobody will trust a proprietary black box that claims to
produce audit evidence, and open source is the only realistic distribution channel
with no marketing budget.

Consequences you must respect:

- Their dependency surface is a trust surface. **Do not add a dependency to any OSS
  package without asking.** Every dependency is something a sceptical auditor can
  question.
- They must build and run standalone, with no reference to Balise the service.
- They carry their own README, their own tests, their own semver.
- No telemetry, no phoning home, no license checks.
- Breaking changes require a major bump and a migration note.

The proprietary value is the platform: history, ledger, documents, multi-tenancy,
fleet view, integrations, and the procurement workflow. Not the measurement code.

---

## 6. PACKAGE CONTRACTS

### `packages/schemas`

The single source of truth for every shape crossing a boundary. Types are
**inferred** from Zod schemas, never hand-written alongside them.

```ts
// Correct
export const MetricValue = z.object({
  metricId: MetricId,
  value: z.number(),
  unit: Unit,
  confidence: Confidence,
});
export type MetricValue = z.infer<typeof MetricValue>;

// Wrong. Two sources of truth that will drift.
export interface MetricValue { metricId: string; value: number; }
export const MetricValueSchema = z.object({ ... });
```

Rules:
- No `any`. No `as` casts except at genuine IO boundaries, and those get a comment
  explaining why the cast is safe.
- Branded types for every identifier: `OrganizationId`, `RunId`, `CriterionId`.
  They are strings at runtime and distinct at compile time. Passing a `RunId` where
  a `ServiceId` is expected must fail to compile.
- Every schema exports both the schema and the inferred type under the same name.

### `packages/measure-core`

Pure functions. No IO, no database, no network, no logging. Given raw trace data,
produce metrics and statistics. This is what makes it testable and what makes it
credible as open source.

Public surface:

```ts
extractMetrics(input: RawCapture): MetricSet
aggregateRuns(runs: MetricSet[]): AggregatedMetrics   // median + MAD
computeNoiseFloor(history: AggregatedMetrics[], metricId: MetricId): NoiseFloor
classifyDelta(before, after, floor): Delta            // 'regression' | 'improvement' | 'no-significant-change'
gradeConfidence(agg: AggregatedMetrics): Confidence
```

`classifyDelta` is the most important function in the repository. It is the
mechanical implementation of invariant 2. It has the most tests. Any change to it
requires an ADR.

### `packages/carbon-models`

Every model implements one interface. Adding a model must never require touching
engine code.

```ts
export interface CarbonModel {
  readonly id: string;              // 'ecoindex', 'swd', 'onebyte'
  readonly version: string;         // semver of our implementation
  readonly specVersion: string;     // version of the published model itself
  readonly assumptions: Assumption[];  // rendered verbatim in the UI and PDFs
  readonly inputs: MetricId[];      // what it needs, validated before call
  estimate(input: ModelInput): ModelOutput;
}

export interface ModelOutput {
  value: number;
  unit: 'gCO2e' | 'score' | 'grade';
  low?: number;                     // model's own stated uncertainty, if any
  high?: number;
  notes: string[];
}
```

Rules:
- A model never reaches outside its inputs. No fetching, no config lookups, no
  environment variables.
- `assumptions` is not documentation. It is data, and it is rendered to the user on
  every surface where the model's output appears. If an assumption is not in that
  array, we are hiding it.
- Models disagree. That is expected and it is the point. Never reconcile them,
  never average them into a single headline figure, never quietly drop an outlier.

### `packages/criteria-engine`

Referential-agnostic. It knows nothing about RGESN specifically. It loads a rule
pack, evaluates what it can, and returns assessments.

This matters because RGAA (accessibility) is the P2 expansion, and it must be a new
rule pack rather than a rewrite. Any RGESN-specific logic that leaks into the
engine is a bug.

```ts
loadPack(id: string, version: string): RulePack
evaluate(pack: RulePack, evidence: EvidenceSet): CriterionAssessment[]
completion(assessments: CriterionAssessment[]): CompletionByTier
```

### `packages/attribution`

Given two runs, explain what changed and who did it.

```ts
diffResources(before: Run, after: Run): ResourceDiff
resolveModules(diff: ResourceDiff, sourceMaps: SourceMapSet): ModuleAttribution[]
blame(modules: ModuleAttribution[], repo: RepoRef): CommitAttribution[]
```

Every function in this package returns a discriminated result that can express
"could not determine". There is no fallback path that produces a plausible guess.
See invariant 5.

### `packages/ledger`

```ts
append(entry: LedgerInput): Promise<LedgerEntry>
verify(fromHash: string, toHash: string): Promise<VerificationResult>
anchor(): Promise<MerkleRoot>
```

`append` is the only write. There is no update, no delete, no admin override, no
"fix the chain" utility. If the chain is broken, that fact is the finding and it
gets surfaced, not repaired.

### `packages/ui`

Shared components. The `ToleranceBand` lives here and is the most important
component in the product. See section 17.

Components in this package must render identically in the browser and in a
headless screenshot context, because the PR comment SVG and the PDF both go
through it.

---

## 7. THE MEASUREMENT CONTRACT

`docs/METHODOLOGY.md` is a public, versioned document. It is a sales asset, not a
legal footnote. Changing it is a breaking change and requires an ADR plus a version
bump plus a migration note explaining how historical data relates to the new
method.

The rules it encodes, which the runner must implement exactly:

1. Chromium is pinned to an exact build. The container image digest is recorded on
   every run.
2. Default 5 runs per scenario. Configurable up, never down below 3.
3. Report median and median absolute deviation. Never mean. Never a single run.
4. Cold-cache and warm-cache passes are measured separately and never averaged
   together. They are different questions.
5. Throttling profiles are named and fixed: `desktop-fibre`, `mobile-4g`,
   `mobile-3g`. Their exact parameters are in `METHODOLOGY.md` and changing them is
   a breaking change.
6. Viewport, device scale factor, user agent, locale and timezone are fixed per
   profile.
7. Every run records a complete `EnvironmentFingerprint`.
8. Noise floor is computed per metric, per scenario, from a rolling window of at
   least 20 historical aggregations.
9. Deltas below the noise floor are `no-significant-change`.
10. Every estimate names its model id and version. No estimate is ever displayed
    without its band.

### What "reproducible" means as an exit test

The same commit measured twenty times produces the same verdict twenty times.
Not the same numbers, which is impossible. The same **verdict**: same pass or fail,
same set of significant changes, same confidence grades. If that test is flaky, the
product does not work, regardless of how good the dashboard looks.

Write this test early. Keep it in CI. Never skip it.

---

## 8. RUNNER RULES

The runner is the only part of the system that talks to the outside world at
measurement time. Treat it as hostile territory.

- Always run in a container with a locked image digest. Never `latest`.
- Never reuse a browser context between runs. Fresh profile every time.
- Disable extensions, disable background sync, disable Chrome's own network
  prediction.
- Set a hard timeout per run and a hard timeout per scenario. A hung run is a
  failed run, not a slow one.
- Capture: full HAR, CDP performance trace, DOM node count at load complete and at
  network idle, coverage data, console errors, all response headers.
- Store raw captures in object storage. They are the evidence. Retention follows
  the customer's plan and is never shorter than the life of any contract that
  references them.
- Respect `robots.txt` on any URL we did not receive explicit authorisation for.
  The free scan is authorised only for the domain entered by the user; the
  observatory crawler is authorised only for public-sector domains on an allowlist
  we maintain and can defend.
- Rate limit per target host. We are not a load test.
- Identify ourselves in the user agent with a URL explaining who we are.

---

## 9. STATISTICS RULES

This section exists because getting statistics casually wrong is the most likely
way this product quietly becomes worthless.

- **Median, not mean.** Page load distributions have long right tails. A mean is
  dominated by outliers and is not reproducible.
- **MAD, not standard deviation.** Same reason.
- **Noise floor** for a metric is derived from the historical MAD of that metric on
  that scenario, scaled by a factor defined in `METHODOLOGY.md`. It is not a fixed
  percentage and it is not guessed.
- **A delta is significant only if it exceeds the noise floor.** Implemented once,
  in `classifyDelta`, and called from everywhere. There is no second implementation
  in the API or the frontend.
- **Confidence grading** is derived from run dispersion, sample count, and
  fingerprint stability. It is High, Medium, or Low. It appears next to every
  figure it applies to.
- **Never extrapolate.** If a customer has 4 runs of history, we do not draw a
  trend line. We say there is not enough history yet.
- **Never impute missing data.** A failed run is a failed run and is visible as
  such.
- When a scenario's noise floor cannot be computed for lack of history, everything
  from that scenario is Low confidence and no budget can fail on it. Budgets
  activate once the floor is established.

---

## 10. CARBON ESTIMATION RULES

- Run all configured models on every run. Storage is cheap; retroactively adding a
  model to historical data is not.
- The primary display is a band across models with the customer's selected
  reference model marked. There is no single headline number anywhere in this
  product.
- Grid intensity: use the customer's real visitor geography where RUM data exists.
  Otherwise use a declared default, and state the assumption on the face of every
  report.
- France's grid is unusually low carbon. Never let a default silently flatter a
  French customer or silently penalise an international one. The assumption is
  always visible.
- Green hosting: check against the Green Web Foundation dataset, record the result
  and the check date in the ledger. A hosting claim without a date is worthless
  eight months later in an audit.
- Embodied emissions: where a model includes them, say so. Where it does not, say
  that too.

---

## 11. CRITERIA ENGINE AND RULE PACKS

### The three tiers

Every criterion in every pack is classified into exactly one tier. The tier is
shown openly in the UI. Claiming full automation would be a lie and would collapse
on first contact with an auditor.

| Tier | Meaning | Behaviour |
|---|---|---|
| **Automated** | Machine-verifiable from measurement or static analysis | Auto-answered, re-evaluated every run, no human step |
| **Assisted** | System gathers evidence and proposes an answer | Requires human confirmation before it counts |
| **Declarative** | Human attestation only | Requires an uploaded artifact and a named responsible person |

Rough expectation for RGESN 2024 v2: around 20 Automated, around 25 Assisted, the
remainder Declarative. Do not inflate the Automated count to make a demo look
better. The completion meter is split by tier precisely so nobody mistakes 20
auto-answered criteria for a finished declaration.

### Rule pack format

```yaml
pack:
  id: rgesn
  version: "2024.2"
  locale: fr
  source: "https://ecoresponsable.numerique.gouv.fr/publications/referentiel-general-ecoconception/"
  families:
    - id: strategie
      label: "Stratégie"
      criteria: [1.1, 1.2, ...]

criteria:
  - id: "4.3"
    family: strategie
    tier: automated
    statement_fr: "..."          # verbatim from the referential, never paraphrased
    evaluation:
      type: metric_threshold
      metric: dom.node_count
      operator: lte
      value: 1000
      scope: representative_pages
    evidence_required: []
    notes_fr: "..."

  - id: "5.1"
    family: contenus
    tier: declarative
    statement_fr: "..."
    evidence_required:
      - kind: document
        label_fr: "Politique éditoriale"
      - kind: attestation
        label_fr: "Responsable désigné"
```

Rules:
- `statement_fr` is verbatim from the official referential. Never paraphrase,
  never summarise, never translate a criterion into friendlier language. Auditors
  read the official text.
- Criterion IDs are the official IDs. Never renumber.
- A pack is immutable once published. Changes create a new version.
- Assessments store `pack_version`. A declaration made under 2024.2 stays bound to
  2024.2 forever, even after 2025.1 exists.
- Statuses follow the official grid exactly: `conforme`, `partiellement_conforme`,
  `non_conforme`, `non_applicable`. Anything not `conforme` requires justification
  text and the UI enforces it.

### The declaration template

The generated declaration must force a "known gaps" section. Published declarations
that admit gaps read as credible. Ones claiming 100% conformity read as marketing
and get challenged. The template is designed to make honesty the path of least
resistance.

---

## 12. ATTRIBUTION RULES

The feature developers will love and that competitors do not have. Also the feature
most likely to embarrass us if it guesses.

Pipeline:
1. Diff the resource graph between baseline and candidate runs.
2. For each new or grown bundle, fetch its source map.
3. Resolve grown bytes to modules, modules to packages, modules to source files.
4. Map source files to the introducing commit and author via `git log`.
5. Emit plain language: `/checkout gained 184 KB. 160 KB is date-fns locale data
   introduced by PR #412.`

Rules:
- Source maps are fetched from the customer's own build artifacts or from a
  configured URL. We never publish them and never store them beyond the analysis.
- If source maps are absent, malformed, or do not cover the grown range, the output
  is explicitly "attribution unavailable for this bundle". There is no heuristic
  fallback and no LLM inference. See invariant 5.
- Third-party attribution works differently: identify new origins, match against a
  maintained list of known tag vendors, size the cost. An unmatched origin is
  reported by its hostname, not guessed at.
- Attribution output is advisory. It never blocks a merge on its own. Budgets block
  merges; attribution explains them.

---

## 13. LEDGER RULES

The ledger is what separates us from a dated PDF.

- Append-only hash chain. Each entry carries `prev_hash` and `payload_hash`.
- Entry kinds: `run`, `attestation`, `declaration_version`, `budget_override`,
  `rebaseline`, `report_generated`, `methodology_version`.
- Per-tenant chain. Periodic Merkle root anchored and published. Optional RFC 3161
  timestamping for customers who ask.
- Public verification at `/v/<hash>`, no account required. Shows what was recorded,
  when, under which methodology and pack versions, and whether the chain validates.
- Every generated PDF carries its hash and its verification URL in the footer.
- Database enforcement: the application role has INSERT and SELECT on
  `ledger_entry` and nothing else. REVOKE UPDATE, DELETE. This is a migration, not
  a convention.
- Corrections append a superseding entry with a `supersedes` reference and a
  mandatory reason. The original stays visible.

### Why the budget override is in the ledger

Teams will disable a check that has no escape hatch. So we give them one, we log
it, and every override appears in the execution report. Visible escape hatches keep
the system honest; absent ones get bypassed entirely.

---

## 14. DATA MODEL

```
Organization
  └── Project
        └── Service                    audited digital service, RGESN scope unit
              ├── Scenario             page or scripted journey
              │     └── Run
              │           ├── ResourceRecord
              │           ├── MetricValue      (metric_id, value, unit, confidence)
              │           └── EstimateValue    (model_id, model_version, value, low, high)
              ├── Budget → BudgetViolation
              ├── Baseline             per branch, with rebaseline audit trail
              ├── CriterionAssessment  (criterion_id, pack_version, status,
              │                         justification, evidence[], attested_by, attested_at)
              ├── Declaration → DeclarationVersion
              ├── Tender → TenderAnnex
              └── Contract → Commitment → ExecutionReport

EnvironmentFingerprint   browser build, image digest, throttle profile, region
RulePackVersion          versioned criteria definitions
CarbonModelVersion       versioned model plus declared assumptions
LedgerEntry              (prev_hash, payload_hash, kind, ref_id, created_at)
MerkleRoot               periodic anchor
```

### Database conventions

- Table names: `snake_case`, singular. `run`, not `runs`.
- Primary keys: UUIDv7. Sortable by creation time, no sequence contention.
- Every tenant-scoped table carries `organization_id` and has an RLS policy. No
  exceptions, including for tables that "obviously" cannot leak.
- Timestamps: `timestamptz`, always UTC, always named with a `_at` suffix.
- Money: integer cents, with the currency in a separate column. Never a float.
- Units are in the column name: `transferred_bytes`, not `size`. `duration_ms`, not
  `duration`. This has caught more bugs than any type system.
- Enums live in the database as check constraints, and in Zod. Not as Postgres enum
  types, which are painful to alter.
- `metric_value` and `resource_record` are partitioned by month. They are the
  tables that will grow.
- Soft deletes only where a legal retention requirement exists. Otherwise hard
  delete and let the ledger hold the record.

### Migrations

- One migration per change, forward-only, checked in.
- Every migration is reversible in principle and has a documented rollback plan in
  its header comment, even when the down migration is "restore from backup".
- Never edit a migration that has run in any environment.
- Data backfills are separate from schema migrations and are idempotent.

---

## 15. API CONVENTIONS

- REST, versioned at `/v1`. No GraphQL.
- Request and response bodies validated against Zod schemas from
  `packages/schemas`. The schema is the contract; the OpenAPI document is generated
  from it, never hand-maintained.
- Errors use a single envelope:

```ts
{
  error: {
    code: 'BUDGET_NOT_FOUND',        // stable, machine-readable, SCREAMING_SNAKE
    message: 'Budget introuvable',   // localised, human-readable
    details?: unknown,               // structured, optional
    requestId: string
  }
}
```

- Error codes are a closed enum in `packages/schemas`. Adding one is a deliberate
  act, not a string literal typed inline.
- Never leak an internal exception message to a client. Log it with the request id,
  return a code.
- Idempotency keys required on every mutating endpoint that a webhook or a CI job
  might retry.
- Webhooks out are signed. Webhooks in are verified before parsing.
- Pagination is cursor-based. Offset pagination on `run` will hurt.
- Long operations return a job id and a polling URL. Nothing blocks for more than
  five seconds.

---

## 16. FRONTEND CONVENTIONS

- Server state through TanStack Query. Local state through `useState` and
  `useReducer`. No global state library.
- No `useEffect` for data fetching. If you are writing one, you want a query.
- Components are functions. No classes.
- One component per file, named export matching the filename.
- Colocate: `ToleranceBand.tsx`, `ToleranceBand.test.tsx`,
  `ToleranceBand.stories.tsx` in the same directory.
- Every interactive element is keyboard reachable with a visible focus ring. We
  sell to a market where accessibility declarations are a legal artifact. Shipping
  an inaccessible compliance tool would be an unforced embarrassment, and RGAA is
  the P2 expansion.
- `prefers-reduced-motion` respected everywhere.
- Responsive down to 375px. Bid directors open things on phones.
- No loading spinners that block a whole page. Skeletons that match the shape of
  the content that will arrive.
- Empty states are an invitation with exactly one action.
- Error states say what happened and what to do. They do not apologise and they are
  never vague.

### Dogfooding

The web app is measured by Balise and has budgets in `balise.yml` at the repo root.
If our own tool fails our own check, the build fails. This is not a gimmick; it is
the only way to find out what the check feels like to live with.

Initial budgets, tightened over time:
- Dashboard route: 350 KB transferred, 60 requests, 1500 DOM nodes.
- Public scan page: 120 KB transferred, 15 requests, 400 DOM nodes.
- Observatory: 200 KB transferred, 25 requests, 1200 DOM nodes.

---

## 17. DESIGN TOKENS AND THE SIGNATURE COMPONENT

### Thesis

This product's commercial claim is honest measurement. The interface looks like an
instrument, not like an environmental campaign. Reference points are metrology
certificates, oscilloscope readouts and laboratory notebooks.

Two registers, deliberately different:

- **Instrument register** (the app): dense, cool, functional, monospaced numerals,
  tight rules, no decoration.
- **Document register** (declarations, annexes, reports): formal, printed,
  generous margins, hairline rules, a hash and seal block. When a user exports, the
  visual shift from workbench to notarised copy is intentional and meaningful.

### Palette

Green appears only as a pass state. It is never a brand colour.

| Token | Hex | Use |
|---|---|---|
| `paper` | `#F3F4F1` | App background, cool off-white, not cream |
| `ink` | `#15181B` | Primary text, document register background |
| `graphite` | `#5A6169` | Secondary text, rules, axis labels |
| `signal` | `#2B3FD9` | Primary action, measurement highlights, links |
| `caution` | `#C4761A` | Low confidence, stale data, approaching threshold |
| `breach` | `#B3312C` | Budget breach, non-conforming criterion |
| `pass` | `#3E7A5E` | Conformity and pass states only, muted, never celebratory |

### Typography

- Display: **Archivo Expanded**. Wide industrial grotesk, reads like instrument
  panel labelling. Used sparingly, and for section eyebrows in small caps with wide
  tracking.
- Body: **Public Sans**. Neutral, high legibility at small sizes.
- Data: **Martian Mono** with `font-variant-numeric: tabular-nums`. Every number,
  everywhere, always.

Do not use Inter. It is the default that makes every SaaS look identical.

### `ToleranceBand`

The single most important component in the product. It renders a metric as a value
with a horizontal band showing spread across carbon models, overlaid with a lighter
shaded region marking the measurement noise floor.

```tsx
<ToleranceBand
  value={1.84}
  unit="gCO2e"
  modelSpread={{ low: 1.42, high: 2.31 }}
  referenceModel={{ id: 'swd', version: '4.0.2' }}
  noiseFloor={0.09}
  confidence="high"
  delta={{ value: +0.12, classification: 'no-significant-change' }}
/>
```

Behaviour:
- A regression is drawn as a regression only when it clears the noise region.
  Visually obvious, no interpretation required.
- Low confidence renders in `caution` with a hover explanation, in every context.
- Renders identically in the browser, in a headless screenshot for the PR comment
  SVG, and in the Typst PDF pipeline. Test all three.

This component appears on the dashboard, in the PR comment, in the declaration, in
the tender annex, and in the embeddable badge. It is the thing the product is
remembered by. Spend the design boldness here and keep everything around it quiet.

---

## 18. COPY AND VOICE

- French first, sentence case, plain verbs, no filler.
- Active voice. A control says exactly what happens: "Publier la déclaration", not
  "Soumettre".
- An action keeps the same name through the whole flow. The button that says
  "Publier" produces a toast that says "Publiée".
- Name things by what people control, never by how the system is built. A person
  manages "budgets", not "threshold configuration entities".
- Errors explain what happened and how to fix it, in the interface's voice. They do
  not apologise.
- Never celebrate. No confetti, no "Great job!", no emoji in product surfaces. A
  passing check says "Conforme au budget". That is all.
- Banned words in all user-facing copy: sustainable, eco-friendly, green, planet,
  carbon-neutral, journey (in the marketing sense), empower, seamless, leverage,
  unlock, revolutionise.
- Numbers in copy are always accompanied by their unit and, where they are
  estimates, their model.

---

## 19. DOCUMENT GENERATION

Typst, in `apps/docs-service`.

- Determinism is a hard requirement. The same inputs must produce a byte-identical
  PDF, because the report's hash goes in the ledger and on the document itself.
  That means no timestamps in the render, no embedded random ids, pinned fonts,
  pinned Typst version.
- Templates live in `apps/docs-service/templates`, versioned. A report records
  which template version produced it.
- Every document footer carries: generation date, methodology version, rule pack
  version, content hash, verification URL.
- White-label: agency logo, agency colours, agency voice. Balise appears only as
  the named measurement methodology. That is where we earn credibility. A vendor
  logo on a client's tender response looks like an advert and gets removed by the
  bid director anyway.
- The tender annex is editable before export. Bid directors will not accept a
  locked document, and pretending otherwise loses the sale.
- Documents render in French by default.

---

## 20. TESTING STRATEGY

| Package | Approach | Bar |
|---|---|---|
| `measure-core` | Pure unit tests, property-based where useful | Highest in the repo. `classifyDelta` has exhaustive tests |
| `carbon-models` | Golden fixtures per model, checked against published reference values | Any drift fails |
| `criteria-engine` | Fixture packs plus evaluation snapshots | |
| `attribution` | Real bundle fixtures with known injected regressions | Must correctly name the dependency |
| `ledger` | Chain integrity, tamper detection, verification | Adversarial tests: try to break the chain |
| `runner` | Playwright integration against a fixture site served locally | The reproducibility test lives here |
| `api` | Route tests with a real Postgres in a container | No mocked database |
| `web` | Vitest for logic, Playwright for critical flows | Not chasing coverage |

### Hard rule

**Any change touching measurement, statistics, the ledger, or the criteria engine
requires a test that would fail without it.** No exceptions. These four areas are
the product's credibility, and a silent regression in any of them is worse than an
outage because nobody notices.

### The reproducibility test

Lives in CI, runs on every merge to main, measures a fixed fixture site twenty
times and asserts verdict stability. It is slow. Do not move it to a nightly job
because it is slow. If it becomes flaky, the fix is to find the source of
non-determinism, never to loosen the assertion.

---

## 21. COMMON TASKS

### Adding a carbon model

1. Create `packages/carbon-models/src/models/<id>.ts` implementing `CarbonModel`.
2. Fill `assumptions` honestly and completely. If you are unsure whether something
   is an assumption, it is.
3. Add golden fixtures with reference values from the model's own publication.
4. Register in the model index. Do not touch engine code.
5. Add a section to `docs/METHODOLOGY.md`.
6. Bump the package minor version.

### Adding a criterion to a rule pack

Rule packs are immutable once published. You are creating a new pack version.

1. Copy `rgesn-2024-v2.yaml` to the new version.
2. Add the criterion with its verbatim official statement and its tier.
3. Write the evaluation block if Automated or Assisted.
4. Add fixtures.
5. Write a migration note describing what changed relative to the previous version.
6. Existing assessments stay pinned to the old version. Do not migrate them.

### Adding a metric

1. Add the metric id to the `MetricId` enum in `packages/schemas`.
2. Implement extraction in `measure-core`. Pure function, no IO.
3. Decide and document its noise floor scaling factor.
4. Add it to `METHODOLOGY.md`.
5. Add a database column with the unit in the name.
6. Only then wire it into the UI.

Never do these in the reverse order. A metric that appears in the UI before its
noise floor is defined will produce false regressions on day one.

### Adding a scenario type

Scenarios are pages or scripted journeys. A new type needs: a schema, a runner
implementation, a budget shape, and a display in the UI. Journeys are first class,
not a special case of pages. RGESN audits are scoped to journeys as well as pages,
so this is domain-required, not a nice-to-have.

### Handling a customer's flaky site

Some sites are genuinely non-deterministic (rotating ads, A/B tests, personalised
content). The answer is never to average harder. The answer is:
1. Raise the run count for that scenario.
2. Surface the dispersion to the customer explicitly.
3. Mark confidence Low and disable budget failures until it stabilises.
4. Offer scenario configuration to stub the non-deterministic parts, recorded in
   the fingerprint so it is visible in any report.

---

## 22. GIT AND WORKFLOW

- Trunk-based. Short-lived branches off `main`.
- Branch names: `feat/`, `fix/`, `chore/`, `docs/`, `adr/`.
- Conventional commits. The scope is the package: `feat(measure-core): ...`.
- Every PR: what changed, why, and what would break if it is wrong.
- PRs touching the four credibility areas (measurement, statistics, ledger,
  criteria) require an explicit note in the description confirming a failing test
  was written first.
- Architectural decisions get an ADR in `docs/DECISIONS/`, numbered, append-only.
  Superseded ADRs are marked superseded, never deleted.
- No force push to `main`. No rewriting published history.

### Working with me

- **Plan first on anything non-trivial.** Show the plan, get agreement, then write
  code. Especially for anything in the four credibility areas.
- **Vertical slices.** One narrow path end to end before breadth. Every slice ends
  with tests and a commit.
- **Ask before adding a dependency**, and always before adding one to an OSS
  package.
- **Ask before changing** `METHODOLOGY.md`, any invariant in section 3, the
  statistics rules, the ledger, or a published rule pack.
- **Do not refactor opportunistically** while doing something else. Separate PR.
- When you are uncertain about a domain fact, say so rather than inferring.
  Procurement law and the referential are areas where a confident guess is worse
  than a question.

---

## 23. DEFINITION OF DONE

A change is done when:

1. It has tests that would fail without it.
2. Types check with no `any` and no unexplained casts.
3. Lint passes.
4. User-facing strings are in `packages/i18n`, French written first.
5. Every displayed number has a unit, and every estimate has a band and a model
   version.
6. Keyboard navigation and focus states work.
7. The mobile layout is not broken.
8. If it touches measurement, `METHODOLOGY.md` is updated.
9. If it touches the data model, the migration is written and reversible.
10. If it touches tenant data, the RLS policy is in place and tested.
11. The dogfood budgets still pass.
12. The reproducibility test still passes.

---

## 24. SECURITY AND PRIVACY

- Tenant isolation enforced twice: application scoping and RLS. Test that a
  cross-tenant read fails.
- Secrets in the environment, never in the repository, never in the database in
  plaintext. Customer integration tokens encrypted at rest with a key that is not
  in the same store.
- GitHub App permissions are the minimum: read contents, read pull requests, write
  checks. We never request write access to code.
- Source maps are fetched, used, and discarded. Never stored, never logged.
- The RUM beacon: no cookies, no localStorage, no fingerprinting, no session
  identifier, no IP retention beyond country resolution at the edge. Aggregate
  only. If a proposed field could identify an individual or link two visits, it
  does not ship.
- Data residency: EU only, France preferred. This is a sales requirement for
  public-sector customers, not a preference.
- Retention: raw captures retained at least for the life of any contract that
  references them. Deletion requests honoured except where a ledger entry or an
  active contractual obligation requires retention, and that exception is explained
  to the customer in plain French.
- Dependency audit in CI. A high-severity advisory in an OSS package blocks
  release.

---

## 25. OBSERVABILITY

- Structured JSON logs. Every log line carries `requestId`, and where applicable
  `organizationId`, `serviceId`, `runId`.
- Never log: tokens, source map contents, customer page content, personal data from
  a scanned page.
- Metrics that matter: run success rate, run duration p50 and p95, noise floor
  stability per scenario, attribution resolution rate, document generation time,
  queue depth.
- **Alert on noise floor drift.** If the measured dispersion on a scenario suddenly
  widens, either the customer's site changed or our runner environment did. Both
  matter and both are invisible without an alert.
- Alert on ledger chain verification failure, immediately, at any hour.

---

## 26. MULTI-TENANCY

- `Organization` is the billing and isolation boundary.
- `Project` groups services, usually per client for an agency.
- Agencies invite their clients with scoped access: a client sees their own service
  and nothing else, and cannot see the agency's other clients or the fleet view.
- White-label configuration lives on `Organization` and cascades to documents.
- An organisation can be a reseller. Reseller-created organisations are linked but
  isolated.
- Never write a query that could return rows from more than one organisation. If a
  cross-tenant aggregate is genuinely needed (observatory benchmarks), it goes
  through a dedicated, reviewed, anonymising path, and the anonymisation is tested.

---

## 27. BILLING

- Stripe for cards. Manual invoicing plus Chorus Pro for public bodies, who cannot
  pay by card and will not create a Stripe account.
- Tiers: Scan (free), Service (79 EUR per service per month), Agence (449 EUR per
  month for 10 services), Contrat (149 EUR per contract per month), Public (from
  6,000 EUR per year).
- Usage is metered on services and contracts, not on runs. Never bill per
  measurement; it creates a reason to measure less, which breaks the product.
- Downgrades never delete evidence. A customer who stops paying keeps read access
  to their ledger and their published declarations. Holding evidence hostage in a
  compliance product would be indefensible and would end the business.
- Trials do not require a card.

---

## 28. ANTI-PATTERNS

Things that will look reasonable in the moment and will damage the product.

- **Producing a single headline carbon number.** Every competitor does this. It is
  the easiest thing to build and it is the thing a sharp prospect destroys in the
  first meeting.
- **Smoothing a chart** so a trend looks cleaner.
- **Averaging models** to avoid explaining that they disagree.
- **Guessing at attribution** when source maps fail, because "usually it is the
  biggest new import".
- **Widening a noise floor** to make a customer's regressions disappear.
- **Auto-answering a Declarative criterion** because an LLM produced a plausible
  justification. Attestations are a human act with a named person attached.
- **Adding Redis** because the queue felt slow before profiling it.
- **A generic dashboard** with cards, sparklines and a big number. The whole visual
  thesis is that this is an instrument.
- **Green branding.** Leaves, globes, gradients from teal to lime.
- **Marketing copy in the product.** Nobody using a compliance tool wants to be
  sold to inside it.
- **Building the RGAA axis early** because it is architecturally interesting. It is
  P2. Ship the procurement documents first.
- **Optimising the runner for speed** at the cost of determinism. Slow and
  reproducible beats fast and noisy, permanently.

---

## 29. THINGS TO NEVER DECIDE ALONE

Ask before acting on any of these. They are product or legal decisions wearing
engineering clothes.

- Anything in `docs/METHODOLOGY.md`.
- The noise floor scaling factor.
- The tier classification of a criterion.
- The wording of any generated document section that a buyer will read as a claim.
- Whether a customer can edit a figure in a tender annex. (Current answer: they can
  edit narrative, never a measured value.)
- Retention periods.
- Anything that changes what a historical report would say if regenerated.

---

## 30. COMMANDS

```bash
pnpm install
pnpm dev                    # all apps
pnpm dev --filter=web
pnpm test
pnpm test:repro             # the twenty-run reproducibility test, slow, do not skip
pnpm lint
pnpm typecheck
pnpm db:migrate
pnpm db:reset               # local only, refuses outside NODE_ENV=development
pnpm runner:local <url>     # measure a URL locally with the pinned profile
pnpm pack:validate <file>   # validate a rule pack against the schema
pnpm docs:render <report>   # render a document locally
pnpm ledger:verify <org>    # verify a tenant chain end to end
```

### Suggested slash commands to create

- `/new-model` scaffold a carbon model with fixtures and a methodology section.
- `/new-criterion` add a criterion to a new rule pack version with fixtures.
- `/new-metric` walk the full metric checklist in order.
- `/adr` create the next numbered ADR from a template.
- `/repro` run the reproducibility test and summarise dispersion by metric.

---

## 31. CURRENT STATE

Update this section as work progresses. It is the first thing to read after
section 3.

**Phase:** V0 shipped (2026-08-17). Monorepo (pnpm + turborepo), `packages/schemas`,
the measurement kernel core in `measure-core` (median/MAD, noise floor, `classifyDelta`,
confidence grading, extraction) with full test suites, `carbon-models` (ecoindex, swd v4,
onebyte) with golden fixtures pinned to published reference implementations, `i18n` (fr + en),
`ui` (tokens + `ToleranceBand` canonical/compact/badge with print patterns), and `apps/web`
with the Dashboard on fixture data from the design's scenario canon. The living roadmap,
to-do list and decisions log are in `PLAN.md`; read it next after this file. Design
references live in `testing/` (gitignored).

**Immediate sequence:**
1. Weeks 1 to 2: measurement kernel. Runner, extraction, statistics, noise floor,
   fingerprinting, multi-model estimation, `METHODOLOGY.md` published. Exit test:
   twenty runs, same verdict.
2. Week 3: budgets and the GitHub check.
3. Week 4: attribution.
4. Week 5: criteria engine, declaration, ledger.
5. Week 6: tender annex and contract tracker.
6. Week 7: free scan, observatory, multi-tenancy, billing. Ship.

Weeks 1 and 2 produce nothing demonstrable. That is expected and correct. The
reproducibility kernel is the only part that cannot be retrofitted, because every
measurement taken before it exists is worthless as evidence, and evidence is the
entire product.

**Open questions being resolved with customers, not with reasoning:**
1. Is the tender annex or the execution report the more acute pain?
2. What weighting are environmental criteria actually receiving in digital services
   tenders after 21 August 2026?
3. Do bid directors want a generated document, or a structured evidence pack they
   assemble themselves?
4. Will agencies white-label, or do they want Balise named as an independent third
   party for credibility? The second would change the branding strategy entirely.
5. What proof formats are public buyers actually asking for, given the law names
   none?

Do not build features that depend on these answers before the answers exist.
