# Runbook

Operational procedures. Written for the person on the other end of an alert, or
for the same person six months later.

**Scope, honestly.** There is no deployed system yet: no API, no database, no
queue, no object storage, no hosted runner. Procedures for those cannot be
written truthfully, and inventing them would produce a document that reads like
preparation and functions as fiction. What follows is what exists and can be
executed today. Section 9 lists what is missing and what each missing procedure
depends on, so the gaps are visible rather than implied.

Last revised: 2026-08-21.

---

## 1. Local setup

Requirements: Node 22 or newer, pnpm, git.

```bash
pnpm install
pnpm dev                  # the web app
pnpm test                 # every suite
pnpm typecheck
pnpm lint
pnpm build
pnpm check:packages       # published package surface
pnpm audit:prod           # what a consumer would install
```

The measurement suites need a pinned Chromium:

```bash
pnpm --filter @balise/runner exec playwright-core install --with-deps chromium
pnpm test:repro           # the reproducibility suite. slow. do not skip it
pnpm runner:local <url>   # measure a url with the pinned profile
```

**Known environment problem.** On some machines Playwright's Chromium extracts
an incomplete bundle. The four capture integration tests and the reproducibility
suite detect this and skip loudly rather than passing vacuously. A skipped
reproducibility suite is not a green reproducibility suite, and CI is the only
place its result counts.

---

## 2. A canon test failed

**Symptom.** A test named for a canon fails, saying the checked-in fixture and
the generator disagree.

**What it means.** An engine's output moved. That is the test working: the
application's numbers are produced by the engines and held to them
([ADR 0003](DECISIONS/0003-generated-canon.md)).

**Procedure.**

1. Do not regenerate first. Read the failure and work out **why** the number
   moved. The diff is the finding.
2. If the move is intended (a threshold changed, a model was corrected), run the
   generator and review the resulting diff line by line:

   ```bash
   pnpm gen:measurement-canon    # run this first; the others sit on it
   pnpm gen:carbon-canon
   pnpm gen:criteria-canon
   pnpm gen:budget-canon
   pnpm gen:attribution-canon
   pnpm gen:ledger-canon
   pnpm gen:findings-canon
   pnpm gen:corpus-canon
   pnpm gen:engagement-canon
   ```

   `capture-canon-source.ts` has no generator of its own: it is the authored
   resource list every other canon reduces, so a change there moves the
   measurement canon and everything under it.

3. Regeneration is deterministic. If a generator produces a different file on
   two consecutive runs with no input change, that is a defect in the generator
   (usually a clock or an unsorted iteration) and it is the thing to fix.
4. If the move is **not** intended, you have found a regression in an engine.
   Fix the engine, not the fixture.

**Never** hand-edit a generated fixture. The file header says so and the test
will catch it, but the reason is worth restating: a hand-edited canon is a
number nothing checks, which is the entire class of defect the canons exist to
remove.

---

## 3. The reproducibility suite is flaky

**Symptom.** `pnpm test:repro` passes sometimes.

**What it means.** The product does not work. The exit test for the whole
measurement contract is that the same commit measured twenty times produces the
same **verdict** twenty times: same pass or fail, same set of significant
changes, same confidence grades. Not the same numbers, which is impossible.

**Procedure.**

1. **Do not loosen the assertion.** Not the tolerance, not the run count, not
   the metric set. This is the one rule in this document with no exceptions.
2. Find the non-determinism. In order of likelihood:
   - the browser build is not pinned, or the container digest changed
   - a browser context is being reused between runs, so a cold pass is not cold
   - an extension, background sync, or Chrome's network prediction is enabled
   - the fixture site is not actually static
   - a timeout is being hit intermittently, so a hung run is being counted as a
     slow one instead of as a failure
3. Compare `EnvironmentFingerprint` across the failing sessions. A fingerprint
   difference explains a verdict difference and is the first thing to rule out.
4. Do not move the suite to a nightly job because it is slow. It runs on every
   merge to main, on purpose.

---

## 4. The noise floor drifted on a scenario

**Symptom.** Measured dispersion on a scenario widened suddenly.

**What it means.** Either the customer's site changed, or our runner environment
did. Both matter, and both are invisible without noticing this.

**Procedure.**

1. Check whether the widening is on one scenario or on many. Many scenarios at
   once points at us; one points at them.
2. If it is us: compare the fingerprints on either side of the change. A browser
   build, an image digest, a throttle profile or a region moved.
3. If it is them: the site became less deterministic. The answer is never to
   average harder. It is, in order:
   - raise the run count for that scenario
   - surface the dispersion to the customer explicitly
   - mark confidence low and disable budget failures until it stabilises
   - offer scenario configuration to stub the non-deterministic parts (rotating
     ads, A/B tests, personalised content), recorded in the fingerprint so it is
     visible in any report
4. **Never widen a floor to make regressions disappear.** The floor is derived
   from measured dispersion; changing it by hand is falsifying the instrument.

---

## 5. Ledger chain verification failed

**Severity: highest in this document.** Page immediately, at any hour.

**What it means.** An entry's `prev_hash` or `payload_hash` does not reconcile.
Either data was altered, or a bug wrote an entry incorrectly. Both are serious
and only one of them is fixable.

**Procedure.**

1. **Do not repair the chain.** There is no repair utility, deliberately, and
   building one would be the wrong response to this alert. If the chain is
   broken, that fact **is** the finding and it gets surfaced.
2. Run verification and record the full output, including every affected entry.
   `verify` reports all of them, not just the first.
3. Establish which entry is the earliest affected, and what wrote it.
4. Preserve everything. Do not delete, do not re-run the writer, do not
   regenerate a document that referenced an affected entry.
5. A correction is an **appended superseding entry** carrying a `supersedes`
   reference and a mandatory reason. The original stays visible forever.
6. If a customer-visible document referenced an affected entry, tell the
   customer. A compliance product that quietly fixes its own evidence has no
   product.

Database enforcement is the backstop: the application role has INSERT and SELECT
on `ledger_entry` and nothing else, by migration rather than by convention. If
an UPDATE succeeded, the grants are wrong and that is a second incident.

---

## 6. Releasing the published packages

Five packages go to npm: `@balise/schemas`, `@balise/measure-core`,
`@balise/carbon-models`, `@balise/criteria-engine`, `@balise/rule-packs`.

**Publishing is manual**, by `workflow_dispatch` on the `release` workflow,
defaulting to a dry run. An automated publish on every green main would put the
measurement kernel on npm before a person decided it was ready, and once someone
has installed a version, unpublishing is not a fix.

**Before dispatching:**

1. `pnpm check:packages` passes. It checks licences, READMEs, changelogs, the
   dependency allowlist, and that no published source calls `fetch`, reads
   `process.env`, or reaches for `Date.now` or `Math.random`.
2. The changelog for each package being released is true, including the
   migration note if anything is breaking.
3. Version bumps follow semver **per package**, independently.
4. A breaking change to `classifyDelta`, the noise floor, or a pack format
   carries an ADR ([docs/DECISIONS](DECISIONS/)).

**The workflow** runs lint, typecheck, tests, build, the surface check and the
production audit, then packs all five, installs the tarballs into an empty
directory and runs them there. That last step is the only one that exercises the
resolution path a consumer takes; inside the workspace everything resolves
through a symlink to a sibling's `src`.

Run the dry run first. Read its output. Then dispatch with `dry_run: false`.

---

## 7. A dependency advisory landed

**Blocking:** a high-severity advisory in the production tree. That is what a
consumer of the published packages installs.

**Non-blocking but fix it:** anything in the dev tree.

```bash
pnpm audit:prod                    # the blocking gate
pnpm audit --audit-level moderate  # the full picture
```

If the advisory is in a runtime dependency of a published package, it is on a
two-item allowlist (`zod`, and the packages themselves) and the decision is
whether to upgrade or to remove the dependency. Removing is usually available,
because the surface is small on purpose.

---

## 8. Regenerating a document after an engine change

Anything that changes what a **historical** report would say if regenerated is a
decision nobody takes alone (operating manual section 29).

Before regenerating a document that a customer has already received:

1. Establish what would change and by how much.
2. If any figure moves, the old document is still valid evidence under the
   methodology and pack versions in its own footer. Its hash is in the ledger.
3. A new document is a new ledger entry, not a replacement. Both exist.
4. Tell the customer which one their buyer is holding.

---

## 9. Procedures that do not exist yet

Listed so the gaps are visible. Each depends on something that has not been
built.

| Procedure | Depends on |
| --- | --- |
| Deploy, roll back, staging promotion | Scaleway infrastructure as code |
| Database migration in production, and its rollback | `apps/api`, Postgres |
| Backup and a restore that has actually been performed once | Postgres |
| Queue drained, stuck job, dead letter handling | pg-boss |
| Runner container digest rotation | the digest-locked container |
| Object storage retention and deletion requests | S3-compatible storage, and a retention decision |
| Merkle anchoring schedule and publication | the ledger in Postgres |
| Incident comms and a status page | a deployed system |
| Rotating a customer integration token | `apps/api`, auth |
| On-call rotation and escalation | more than one person |

---

## 10. Alerts that must exist before launch

Not yet wired. Recorded here so that "we never set up the alert" is a visible
gap rather than a discovery.

- **Ledger chain verification failure.** Immediately, at any hour. Section 5.
- **Noise floor drift** on any scenario. Section 4. Invisible without it.
- Run success rate falling.
- Run duration p50 and p95 moving.
- Attribution resolution rate falling, which usually means source maps stopped
  being published rather than that anything broke.
- Document generation time.
- Queue depth.
