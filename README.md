## Balise

Evidence infrastructure for the environmental criterion in French public procurement,
applied to digital services.

Balise continuously measures a web service (bytes, requests, DOM, CPU, third parties),
does it reproducibly enough to survive a hostile audit, and converts those measurements
into the documents that decide public contracts:

1. The tender annex (annexe environnementale du mémoire technique) that wins the contract.
2. The execution report (rapport de suivi de la clause d'exécution) that keeps it.
3. The ecodesign declaration (déclaration d'écoconception RGESN) that the customer
   publishes on their own site.

Everything else in this repository exists to make those three documents credible.

## Why now

From 21 August 2026, article 35 of the loi Climat et Résilience requires every French
public buyer to include at least one environmental criterion in the scoring of offers,
and at least one environmental clause in the execution conditions of the contract. The
law names no standard form of proof. Balise is built to be that proof: reproducible,
multi-model, uncertainty-explicit, and chained to tamper-evident evidence.

## Principles

- **Uncertainty is drawn, never written.** Every figure ships with its spread across
  estimation models and its run-to-run noise floor. There is no bare-number mode.
- **A delta below the noise floor is not a change.** It is reported as no significant
  change, even when the sign looks favourable.
- **Median and MAD, never mean.** Robust statistics only; five runs per scenario minimum.
- **Models disagree; that is the point.** They are never averaged into a headline number.
- **Honest degradation.** Missing source maps, insufficient history, unstable runners:
  each is stated plainly, never guessed around.

## Repository layout

```
apps/
  web/                  React application (Vite, React 19)
  runner/               Playwright measurement worker, pinned Chromium

packages/
  schemas/              Zod contracts, single source of truth for every shape
  measure-core/         Metric extraction, statistics, noise floor, delta classification
  carbon-models/        Pluggable estimation models (ecoindex, swd v4, onebyte)
  criteria-engine/      Referential-agnostic rule evaluation, tiers and blocking findings
  rule-packs/           Versioned referentials. RGESN 2024 v2, statements verbatim
  attribution/          Bundle diff, source maps, blame, and honest unavailability
  ledger/               Append-only hash chain, Merkle anchoring, verification
  i18n/                 Every user-facing string, fr + en
  ui/                   Design tokens and shared components, including ToleranceBand

docs/
  METHODOLOGY.md        The public measurement contract, versioned
```

`measure-core`, `carbon-models`, `criteria-engine`, `rule-packs` and `schemas` are Apache-2.0 and intended for standalone
publication: audit evidence cannot come from a black box. The platform around them
(history, documents, multi-tenancy, workflow) is the proprietary part.

## Getting started

Requirements: Node 22+ and pnpm.

```bash
pnpm install
pnpm dev          # run the web app
pnpm test         # all test suites
pnpm test:repro   # the reproducibility suite, slow, needs a pinned browser
pnpm typecheck
pnpm lint
pnpm build
```

## Status

Early build. The measurement kernel, the carbon models with golden fixtures pinned to
published reference implementations, and the first application screens are in place; the
measurement runner, API, ledger and document generation are next. `PLAN.md` holds the
living roadmap, the to-do lists and the decisions log.

## Carbon model provenance

Model constants and formulas are taken from their published sources: EcoIndex quantile
tables and formula from the published CNUMR method (ecoindex.fr), Sustainable Web Design
v4 constants from sustainablewebdesign.org, and the 1byte model constants as carried by
the Green Web Foundation's co2.js. Golden fixture tests fail on any drift from those
references. Each model declares its assumptions as data, rendered wherever its output
appears.
