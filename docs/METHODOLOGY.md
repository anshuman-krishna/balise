# Balise measurement methodology

**Version 1.0-draft. Not yet in force.**

This document is the public measurement contract. It states exactly how a figure
produced by Balise was arrived at, so that a buyer can check the claim without
trusting the supplier who makes it, and so that two measurements taken months
apart can be compared at all.

It is versioned. Every stored measurement records the methodology version it was
taken under, and a historical report regenerated later says what it said at the
time. Changing anything in this document is a breaking change: it requires a new
version, an ADR, and a migration note explaining how existing data relates to the
new method.

**This draft is not signed off.** The parameters below are the ones the runner
implements today. Section 12 lists every one that is a decision rather than a
consequence, and none of them are settled until that section is empty. Until then
no measurement taken by Balise should be presented as evidence under "methodology
v1.0".

---

## 1. What is measured

A **service** is a digital service under audit. A **scenario** is one page or one
scripted journey within it. A **run** is one loading of one scenario under one
throttle profile and one cache pass.

Six metrics are extracted from every run:

| Metric | Unit | Definition |
| --- | --- | --- |
| `transferred_bytes` | bytes | Sum, over every response, of the encoded response body plus its response headers. What crossed the wire, not what the page decompressed to. |
| `request_count` | count | Every request the page issued, including redirects and requests that returned no body. |
| `dom_node_count` | count | `document.getElementsByTagName("*").length` at network idle. |
| `js_execution_ms` | ms | Chrome DevTools Protocol `Performance.getMetrics` → `ScriptDuration`, converted from seconds. |
| `third_party_bytes` | bytes | Transferred bytes from any origin other than the service origin. |
| `third_party_share_pct` | pct | `third_party_bytes / transferred_bytes`, as a percentage. Zero when nothing was transferred. |

The DOM node count is also captured at the `load` event and retained on the raw
capture, but `dom_node_count` is the network-idle figure: it is the stricter of
the two, and it is the one that reflects what the page settles at.

**Third party** means a different origin, decided by exact origin comparison and
nothing else. A resource whose URL cannot be parsed, or whose origin is opaque
(`data:`, `blob:`, `about:`), has no network host of its own and is counted as
first party rather than guessed at.

Every metric in this table falls into the same direction of harm: it regresses
when it grows.

### 1.1 The resource inventory

The six metrics are a reduction of the run's capture, and the capture is kept.
For every response the page received, the capture records:

| Field | What it is |
| --- | --- |
| URL | The address requested, unmodified. |
| Resource type | What the browser did with the response: document, script, stylesheet, image, font, media, or other. Anything the browser reports outside those six is `other`; no category is inferred from a file extension. |
| Transferred bytes | Encoded body plus response headers. The quantity `transferred_bytes` sums. |
| Decoded bytes | The body after content-encoding is undone. Recorded as unavailable, never substituted from the transferred size, when the browser hands back no body: a redirect, an evicted body, or a response above the runner's read cap of 8 MB. |
| Unused decoded bytes | Decoded bytes never executed, from the coverage capture. Applies to scripts and stylesheets only; anything else records it as not applicable rather than as zero. |
| Start and duration | When the request started, measured from the start of the navigation, and how long it took to the last byte. Recorded as unavailable where the browser reports no timing. |

Two consequences worth stating, because both are places a report could quietly
overstate itself:

**Unused decoded bytes are not a saving.** They are a share of what the page
decompressed, not of what it transferred. What compression would have done with
those bytes is a different question, and the figure is never presented as bytes
that could be removed from the wire.

**Coverage is measured, not estimated.** V8 reports nested execution ranges, and
a character counts as executed only when the innermost range containing it ran;
a function that ran while one of its branches did not is credited for the branch
by any method that simply sums the ranges with a count. Offsets are positions in
the source text rather than byte offsets, so the unused share is measured over
the text those offsets cut. A coverage report that does not describe the text it
arrived with yields no figure at all rather than an approximate one.

### 1.2 Findings

A finding is a quantity read off the capture, stated with what it is a share of.
It is never a projected saving. "Convert these images and save 214 KB" is a
statement about a page nobody measured, and a report that mixes one measurement
with one projection has to be read as a projection throughout.

Seven findings are defined. Six are quantities the capture holds:

| Finding | The quantity | Its share is of |
| --- | --- | --- |
| Image weight | Transferred bytes of every image response | The page's transferred bytes |
| Font weight | Transferred bytes of every font response | The page's transferred bytes |
| Third-party weight | Transferred bytes from origins other than the service's, counted by distinct origin | The page's transferred bytes |
| Heaviest response | Transferred bytes of the single largest response | The page's transferred bytes |
| Unexecuted script bytes | Decoded script bytes coverage found unexecuted | The decoded bytes of the scripts coverage measured |
| Unapplied stylesheet bytes | Decoded stylesheet bytes coverage found unapplied | The decoded bytes of the stylesheets coverage measured |

The seventh is a position rather than a weight. EcoIndex publishes quantile
tables for DOM node count, request count and page weight, and a measured value
can be placed in that published distribution: "past the 90th percentile of the
pages EcoIndex's reference distribution covers". This is the only comparison
Balise makes between one service and others, it is made against a table anyone
can read, and the source and its version are printed with the number. Balise
maintains no corpus of its own and states no position against one.

Three rules govern how findings degrade:

**A finding coverage could not see is withheld, not zeroed.** Coverage is off by
default on a measured run (open decision 14), so on most runs the unexecuted-byte
findings are reported as not measured, with the number of files they would have
covered. Reporting zero unused bytes would be a claim; withholding is what
happened.

**Partial data is counted, not dropped.** Where coverage was captured for some
files of a type and not others, the finding is raised over the files it measured
and states how many it could not see, so the quantity reads as a floor rather
than as the whole.

**Nothing is raised below a minimum weight.** On a 40 KB page the fonts are most
of the page and saying so is arithmetic. The minimum is 50 KB.

The thresholds that decide whether a share is raised at all, and whether it is
raised as a caution or as a breach, are provisional: see open decision 15.

## 2. What is not measured

Balise measures a web service loaded in a browser. It does not measure server
infrastructure, employee devices, mobile applications, or organisation-wide IT
footprint. It does not run on real hardware: measurements are taken in a
headless browser in a container, which is a deliberate trade of absolute
accuracy for reproducibility. A competitor measuring on real devices will report
different numbers, and for some questions theirs are better ones. Ours are
repeatable, and repeatability is what a contractual claim needs.

## 3. The browser

Measurements are taken with Chromium, pinned to an exact build:

- Playwright `1.56.1`, Chromium revision `1194`.
- The **full Chromium build**, not Playwright's headless shell. The shell omits
  parts of the rendering and networking stack, and we are measuring what a
  visitor's browser does.
- The container image digest is recorded on every run. A run taken outside the
  pinned container records `unpinned-local` in place of a digest and is marked
  as not audit evidence, at every surface where it appears.

The browser is launched with Chrome's own adaptive behaviour disabled, because
those features change what a page does between two identical runs:

```
--disable-extensions
--disable-background-networking
--disable-background-timer-throttling
--disable-client-side-phishing-detection
--disable-component-update
--disable-default-apps
--disable-sync
--no-first-run
--no-default-browser-check
--metrics-recording-only
```

Every run gets a fresh browser context. Nothing is reused between runs: a reused
profile carries cache, storage and connection state from the previous run, and a
cold pass would stop being cold.

## 4. Throttle profiles

Three named profiles. A profile fixes the network, the CPU, the viewport, the
device scale factor, the locale, the timezone and the user agent, because a run
is only comparable to another run taken under an identical description of a
machine.

| | `desktop-fibre` | `mobile-4g` | `mobile-3g` |
| --- | --- | --- | --- |
| Download | unthrottled | 1.6 Mbps | 400 Kbps |
| Upload | unthrottled | 750 Kbps | 400 Kbps |
| Added latency | none | 150 ms | 400 ms |
| CPU throttling | 1x | 4x | 4x |
| Viewport | 1440 x 900 | 390 x 844 | 390 x 844 |
| Device scale factor | 1 | 3 | 3 |
| Locale | fr-FR | fr-FR | fr-FR |
| Timezone | Europe/Paris | Europe/Paris | Europe/Paris |

Throttling is applied through the Chrome DevTools Protocol
(`Network.emulateNetworkConditions` and `Emulation.setCPUThrottlingRate`), not
at the operating system level.

The user agent is fixed by the profile and does not vary with the host the
runner happens to be running on: a run from a developer's laptop and a run from
the container must ask the server the same question. Only the Chromium major
version varies, so a patch upgrade does not change the user agent, while the
recorded browser build does.

Balise identifies itself in the user agent, on every request it makes:

```
Balise/0.1 (+https://balise.fr/robot)
```

## 5. Runs and passes

- **Five runs per scenario** by default. Configurable upward, never below three.
  A single run is not a measurement.
- **Cold and warm passes are measured separately and never averaged together.**
  They answer different questions. The cold pass is a fresh context; the warm
  pass is a second navigation within the same context, with the cache primed.
- A run has a hard timeout. A hung run is a failed run, not a slow one.
- **A failed run is a failed run.** It is recorded and visible. It is never
  imputed, interpolated, or quietly dropped from the denominator.
- Below three successful runs there is no aggregate. The result is reported as
  insufficient runs, and no budget or verdict may rest on it.

## 6. Aggregation

Across the runs of one scenario and one pass, Balise reports the **median** and
the **median absolute deviation**.

Never the mean, and never the standard deviation. Page load distributions have
long right tails; a mean is dominated by outliers and is not reproducible, and a
standard deviation inherits the same problem. The median absolute deviation is
the median of the absolute deviations from the median.

Values are stored raw. Rounding, thousands separators and decimal precision are
formatting applied at the point of display, never to the stored figure.

## 7. The noise floor

The noise floor is the dispersion below which a difference is not a change. It
is computed **per metric, per scenario**, from that scenario's own measurement
history:

```
noise floor = scaling factor x median(historical MADs)
scaling factor = 1.2
minimum history = 20 prior aggregations
```

It is not a fixed percentage of the value, and it is not chosen by hand. It is
derived from how much that scenario actually varies, measured.

**With fewer than 20 historical aggregations there is no floor.** Everything on
that scenario is low confidence, no delta receives a verdict, and no budget can
fail on it. Budgets activate once the floor is established. This is the honest
degradation: without a floor there is nothing to say.

## 8. What counts as a change

A delta between two aggregates is classified once, by one function, called from
everywhere. There is no second implementation in the API or the interface.

1. If the noise floor is not established, the classification is
   **indeterminate**. No floor, no verdict.
2. If the absolute delta is **less than or equal to** the floor, the
   classification is **no significant change**. Equality is not significance.
3. Otherwise the delta is a **regression** if it moved in the direction of harm,
   and an **improvement** if it moved the other way.

A delta below the floor is reported as no significant change even when its sign
looks favourable, and even when a nicer chart would result from saying
otherwise.

Comparing two runs with different environment fingerprints is not permitted
without an explicit, user-acknowledged flag, which is recorded in the ledger.

## 9. Confidence

Every figure carries a confidence grade, derived from dispersion, sample count
and fingerprint stability:

| Grade | Condition |
| --- | --- |
| **Low** | Fingerprints differed between runs, or the scenario has no established noise floor, or fewer than 3 runs, or MAD above 15% of the median |
| **Medium** | MAD at or below 15% of the median |
| **High** | At least 5 runs and MAD at or below 5% of the median |

A median of zero with any dispersion is unstable by definition and grades low; a
median of zero with no dispersion is perfectly stable.

The floor condition is section 7's rule, stated here because it belongs in this
table. Dispersion says how repeatable five runs were; the floor says whether a
change on that scenario could be detected at all. Five tight runs on a scenario
with eleven aggregations of history are repeatable and undetectable, and calling
that high confidence would say we know something we do not.

Low confidence is shown wherever the figure is shown. It is never omitted to
save space.

## 10. Carbon estimation

Every configured model runs on every measurement. Models are versioned, and a
historical estimate stays bound to the model version it was made under.

| Model | Spec version | Source |
| --- | --- | --- |
| EcoIndex | 1.0 | Published CNUMR method: quantile tables and formula |
| Sustainable Web Design | 4.0 | Published segment constants |
| 1byte | 2021 | Constants as carried by the Green Web Foundation's co2.js |

Rules:

- **There is no headline number.** The primary display is a band across the
  models, with the customer's chosen reference model marked. Models disagree,
  that disagreement is information, and it is never averaged away, reconciled,
  or trimmed of outliers.
- **A gCO2e band carries only models that respond to grid intensity and to
  hosting.** See section 10.1. Every model still runs, and every model's output
  is still shown; what this rule governs is which outputs share one axis.
- Each model declares its assumptions **as data**. Those assumptions are
  rendered wherever that model's output appears, including in PDFs and in the
  embeddable badge. An assumption that is not in that list is an assumption we
  are hiding.
- Grid intensity materially changes results, and France's grid is unusually low
  carbon. Where real visitor geography exists it is used; otherwise a declared
  default is used and the assumption is stated on the face of every report.
  A default must never silently flatter a French customer or silently penalise
  an international one.
- Green hosting is checked against the Green Web Foundation dataset. The result
  and the date of the check are both recorded: a hosting claim without a date is
  worthless eight months later in an audit.
- Where a model includes embodied emissions, that is stated. Where it does not,
  that is stated too.

### 10.1 Which models share a band

Two models can be drawn on one axis when they estimate the same quantity. Not
all of ours do.

SWD v4 and 1byte are energy models: they multiply data volume by an energy
intensity and an emissions intensity. EcoIndex is not. Its published method
scores a page from three measurements (DOM nodes, requests, page weight), and
the gCO2e figure it carries is read off that score with the formula
`2 + 2 x (50 - score) / 100`. Feed EcoIndex a page served from a French data
centre on renewable electricity and the same page served from a coal grid, and
it returns the same number, because nothing about electricity is an input.

That is not a defect in EcoIndex. It answers a different question: how heavy is
this page, on a scale calibrated against the French web. It is a useful question
and the referential's own audiences read the grade fluently. But a rating
converted to grams is not the same quantity as grams computed from energy, and
putting the two on one axis states a comparison that is not true.

So, in force from this version:

- The gCO2e band carries the **energy models**: SWD v4 and 1byte.
- **EcoIndex is reported as its published output**, a score out of 100 and a
  grade from A to G, shown beside the band and never inside it. Its gCO2e figure
  remains available in the model detail, labelled as derived from the score.
- A model declares its method **as data**, in the same way it declares its
  assumptions, and the rule above is applied from that declaration rather than
  from a list of model names here. Adding an energy model widens the band.
  Adding a score-derived one does not, and it is reported on its own terms.

#### What the band does and does not respond to

Being an energy model is not the same as tracking the visitor's grid, and the
distinction has to be stated rather than implied.

| Model | Method | Applies the visitor grid | Responds to green hosting |
| --- | --- | --- | --- |
| SWD v4 | energy | yes | yes |
| 1byte | energy | no, fixed 519 and 475 gCO2e/kWh | yes |
| EcoIndex | score-derived | no | no |

1byte is in the band and does not use the measured grid intensity: its published
constants are a US data centre mix and a 2018 global network average, and the
reference implementation applies them unconditionally. That is carried in the
model's own assumptions and rendered wherever its output appears. It is a caveat
on one edge of the band, not a reason to draw it somewhere else, because it is
still grams computed from energy.

The practical consequence on a French service is worth naming: only one model in
the band knows the grid is French, so on a low-carbon grid the band is wide and
its upper edge is a model using a global average. That width is the honest
answer, and it is the reason a report states the grid it assumed on its face.

Each model's declared method and sensitivity are held to its actual behaviour by
tests: a model that claims to respond to grid intensity, and does not, fails.
This section's rule was written on the assumption that both energy models
tracked the grid, and that test is what corrected it.

### 10.2 Comparing one service with another

Two comparisons appear in the product, and they are not the same kind of claim.

**Against a published distribution.** A measured value is placed in the quantile
tables EcoIndex publishes for DOM nodes, requests and page weight. The table is
someone else's, it is public, and the source and its version travel with the
number. This is what the free scan's seventh finding does (section 1.2).

**Against the corpus.** The public index and the fleet view rank services
against each other. Every position on those surfaces is computed from the
services actually measured, and the size of that set is stated wherever a
position is:

1. **The corpus is what was measured.** The index states the number of services
   it holds. It does not state a number of services someone intends to measure.
2. **A rank is on a measured quantity**, transferred page weight, not on an
   estimate. Adjacent services' gCO2e bands overlap, so ordering by them would
   assert a precision the bands themselves deny.
3. **A position is stated as a position**, "6th of 12", never as a percentile.
   A percentile over twelve services is a rank wearing a statistic's clothes.
4. **Every row in a comparison is measured identically**: one page per service,
   one cache pass, one throttle profile, the same run count. A shared axis
   across rows measured differently is invariant 3 with the fingerprint dropped
   out of the argument.
5. **Hosting is per service.** Green hosting credit is applied only where the
   Green Web Foundation check was made, and the date is carried. An unchecked
   host receives no credit, and the surface says how many were unchecked.
6. **A trend is two measurements against the scenario's own floor**, classified
   by the same function as every other delta. Where no floor is established
   there is no trend, and the cell says so.

### 10.3 Contractual engagements

An engagement is a measured figure, a threshold someone signed, and the margin
between them. Only two of those are authored: the wording it carries into the
annexe, and the threshold.

1. **Margin has one definition.** `(threshold - measured) / threshold`. The
   denominator is the signed threshold, never the measured value. Over the
   measured value the same pair reads 11.3% where this reads 10.1%, which is how
   two surfaces came to print different headroom for one contract.
2. **An engagement nobody signed has no contractual state.** It is shown as the
   proposal it is, it still says plainly whether it is met today, and no surface
   reports it as held or not held. Reporting a breach of an obligation the
   contract does not contain is worse for the supplier than reporting nothing.
3. **A gauge and the figure beside it are one computation.**
4. **An estimate carries its band and its reference model** here as everywhere
   else, including in a commitments table where the column is narrow.
5. **A trend is drawn only from history the scenario kept**, classified by
   `classifyDelta` against that scenario's floor. No history, no line, and the
   cell says so.
6. **No figure after a remediation is stated.** A report may say what is planned
   and when; what the measurement will be afterwards is the next measurement's
   answer, not this one's.

## 11. Reproducibility

The exit test for this methodology is verdict stability, not numeric equality.
Identical numbers from a real browser are impossible; identical verdicts are the
thing a contract depends on.

An unchanged service measured repeatedly must produce, every time:

- the same delta classifications,
- the same confidence grades,
- the same budget pass or fail.

This is tested against a fixture site on every merge, and the test is slow on
purpose. If it becomes flaky, the fix is to find the source of non-determinism.
It is never to loosen the assertion.

## 12. Open decisions

Every item here is a decision rather than a consequence, and none of them are
settled. This section must be empty before version 1.0 is in force. Seventeen
open.

1. **Noise floor scaling factor**, currently 1.2. It sets how large a change has
   to be before the product will call it one. Too low produces false regressions
   and destroys trust in the check; too high hides real ones.
2. **Minimum history for a floor**, currently 20 aggregations. This is how long
   a new customer waits before budgets can fail.
3. **Throttle profile parameters**, the whole table in section 4. Only the
   `mobile-4g` line has any external basis. Once in force, changing a number
   here invalidates every historical comparison.
4. **Confidence thresholds**, currently 5% and 15% relative MAD.
5. **Default run count**, currently 5, and the floor of 3.
6. **`dom_node_count` reads at network idle**, not at load.
7. **Transferred bytes counts response headers** alongside the encoded body.
8. **Opaque and unparsable origins count as first party.** The alternative is a
   separate "unattributed" bucket.
9. **The default grid intensity** used when no visitor geography exists.
10. **The default reference model**, currently SWD v4, and whether a customer may
    change it, and whether that change is written to the ledger.
11. **Raw capture retention**, which must be at least the life of any contract
    that references it.
12. **Whether a floor has an absolute minimum per metric.** It does not today.
    The floor is derived from measured dispersion, so a metric that barely
    varies gets a floor near zero, and then any jitter clears it and is reported
    as a change. `js_execution_ms` on a light page is the likely case. A minimum
    per metric would fix it and would also be a number chosen by hand, which is
    what section 7 exists to avoid. The behaviour is pinned by a
    characterisation test in `measure-core` so that a decision here is a
    deliberate one.
13. **Publication language.** This document is maintained in English in the
    repository. The version published at `balise.fr/methodologie`, which is what
    a public buyer reads, must be French.
14. **Whether coverage is captured on a measured run.** V8's precise coverage
    instruments execution, so it moves `js_execution_ms`; the size of that
    movement has not been measured. The runner therefore leaves coverage off by
    default and records `coverageEnabled` in the environment fingerprint, which
    means a run with it and a run without it are never compared (invariant 3).
    The decision is whether to turn it on for every run and accept an
    instrumented script-execution figure, leave it off and lose the resource
    inventory's coverage column, or take it on a separate pass that is not the
    measured one. Measuring the overhead on the fixture site comes first.
15. **The finding thresholds.** A finding is raised as a caution at 40% of a
    type's covered decoded bytes unexecuted, 20% of the page in third parties,
    50% in images, 10% in fonts, 15% in one response, or the 50th percentile of
    EcoIndex's published distribution; each rises to a breach at 60%, 35%, 65%,
    20%, 25% and the 75th percentile respectively. Nothing is raised below 50 KB. These
    decide what a public surface calls a problem on a service whose owner never
    asked to be measured, which makes them a methodology decision rather than an
    engineering one. They are held in one place, `PROVISIONAL_FINDING_THRESHOLDS`
    in `measure-core`, and a caller may supply its own.
16. **What a comparison surface is allowed to compare.** Section 10.2 sets the
    rules; two of the numbers in them are ours. A declaration is treated as
    expired past 365 days, which is the referential's annual republication rule
    and not a choice, but the 270 days at which it is flagged as due is a choice.
    And a rank is taken on transferred page weight, which is one metric standing
    in for a page's cost. Ordering on the reference model's estimate, on the
    EcoIndex score, or on nothing at all are the alternatives, and each says
    something different about what an index is for.
17. **The contractual thresholds themselves**, and the wording each engagement
    carries into the annexe. Section 10.3 makes the arithmetic one computation;
    the numbers it computes over are signed by a supplier. One of them is
    flagged in the code: "Poids médian des 10 pages principales" binds the
    service median over fourteen scenarios, so the wording says ten and the
    basis is fourteen. Changing the wording of a commitment a buyer reads is a
    decision for the maintainer, so the mismatch is carried and flagged rather
    than quietly corrected.
