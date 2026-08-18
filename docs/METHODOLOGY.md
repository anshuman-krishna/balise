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
| **Low** | Fingerprints differed between runs, or fewer than 3 runs, or MAD above 15% of the median |
| **Medium** | MAD at or below 15% of the median |
| **High** | At least 5 runs and MAD at or below 5% of the median |

A median of zero with any dispersion is unstable by definition and grades low; a
median of zero with no dispersion is perfectly stable.

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
settled. This section must be empty before version 1.0 is in force.

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
