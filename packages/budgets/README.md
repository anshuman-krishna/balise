# @balise/budgets

Reads `balise.yml`, decides what a measurement does to a pull request, and never
fails a build on noise.

```
readConfig(source)                  balise.yml, or every problem with it
evaluateBudgets(input)              one assessment per rule per scenario it names
summariseCheck(assessments, policy) what that does to the merge
```

Pure. No IO, no network, no clock: the instant an override is measured against is
an input.

## The rule that shapes everything else

A budget is checked only on a scenario whose noise floor is established. Until
there is enough history to know what a change looks like on that scenario, every
verdict is `non_evalue`, the check reports neutral, and no merge is blocked.

That is not caution for its own sake. A budget that fails on measurement noise
gets switched off within a week, and a check nobody trusts is worse than no check.

Growth limits go through `classifyDelta` before anything else. If the kernel does
not call the change a change, the limit cannot have been broken by it, whatever
the percentage says. There is one implementation of that decision and this
package calls it rather than repeating it.

## Statuses

| Status | Meaning |
| --- | --- |
| `conforme` | under every threshold that applies |
| `warn` | past `warn`, under `fail` |
| `breach` | past `fail` |
| `non_evalue` | not decided, with the reason: no floor, metric not measured, no baseline, no threshold |

Every assessment also carries `withinNoise`: true when the distance to the
deciding threshold is smaller than the noise floor. The verdict is unchanged, but
the value is sitting on the line and the screen says so rather than presenting the
crossing as a result.

## Overrides

An override lifts the merge block. It never lifts the breach: the breach is still
counted, still shown, and still goes to the execution report. Teams disable a
check that has no escape hatch, so there is one, it is recorded in the ledger, and
it expires.

## The config

`balise.yml` is read by a parser written here, over a documented subset of yaml.
Anything outside the subset is refused by name with its line number: anchors,
aliases, tags, block scalars, merge keys, several documents, tab indentation. A
file that decides whether a build fails is not a place for a parser to guess.

An unknown key is an error, not a shrug. A typo in a budget key would otherwise
switch a limit off in silence, which is the worst thing this package could do.

```yaml
version: 1
service: portail-metropolitain
runs: 5                              # never below 3, a median needs runs to sit on
profiles: [desktop-fibre, mobile-4g]
reference_model: swd@4.0
noise_floor: auto                    # the only accepted value

budgets:
  - scope: /accueil
    bytes: { warn: 860KB, fail: 900KB }
  - scope: /demarches/*
    requests: { fail: 90 }
  - scope: journey:demande-acte
    bytes: 1400KB                    # a bare value is the failing threshold
  - scope: service
    third_party_share: { fail: 30% }
    relative_to_baseline: { warn: +3% }

check:
  block_merge_on: fail               # fail | warn | never
  annotate_files: true
```

`noise_floor` accepts only `auto`. A written floor would be a hand-chosen number,
which is exactly what a derived floor exists to avoid.

Scopes are a route, a journey, or the whole service. In a route pattern `*` stays
inside one path segment and `**` crosses them, so a budget on `/demarches/*` does
not silently start covering everything deeper in the tree. A `service` scope is
checked on every scenario measured, because a service-wide limit tested against an
aggregate could hold while a single route breached it.

Byte units are decimal by default, since a kilobyte on the wire is a thousand
bytes. `KiB` and `MiB` are read as binary when they are asked for by name.
