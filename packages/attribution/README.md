# @balise/attribution

Explains what changed between two runs, and who introduced it. Or states that it
cannot, which is the part that matters.

Attribution output is advisory. It explains a budget breach; it never causes one.

## What it does

```
diffResources(before, after)   what the network saw: urls, origins, transferred bytes
attributeBundle(bundle)        decoded bytes of one bundle, credited to source files
diffModules(before, after)     which modules grew, shrank, appeared or went
blameModules(modules, range)   the commits that touched a first-party module
attribute(before, after)       all of the above, with a reconciliation
```

Everything is pure except `git-cli`, the one place that shells out. Nothing in
this package fetches a source map, reads a page, or writes anything anywhere.

## Why the diff is at module level

Bundle file names carry a content hash, so they rotate on every build:
`app.a3f2.js` becomes `app.b81c.js` and pairing the two would mean matching on a
name pattern. Module identity comes from the source map and survives the
rotation, so the module comparison is exact where a file comparison would be a
guess.

The resource diff therefore reports the rename as one removal and one addition,
which is what actually happened on the wire. The module diff explains it.

## What it refuses to do

- **No fallback attribution.** A bundle with no source map, an unreadable map, an
  index map, a map that does not describe the file it was given: each is reported
  as itself, by name, per bundle. There is no heuristic path.
- **No partial module diff.** If any bundle on either side could not be read, the
  module changes are withheld entirely. Emitting them would report every module
  of the unreadable bundle as removed, which is a finding we would be inventing.
  `complete: false` and the coverage says which bundle stopped it.
- **No spreading the remainder.** Bytes no mapping covers (bundler prelude,
  runtime, banners) are counted as unattributed and reported. They are never
  distributed across the sources to make the columns add up.
- **No blaming a person for a dependency.** Bytes belonging to a package come
  back as `third-party-module`. Whoever last touched the lockfile is not the
  author of those bytes.
- **No naming a vendor we are not sure of.** Third-party origins are matched
  against a maintained list, exactly or on a dot boundary. An unmatched origin is
  reported by its hostname with its measured cost.

## Decoded bytes, not transferred bytes

A source map explains the file as written, not the file as compressed. So
`reconcile` compares the module deltas against the **decoded** size of the
submitted bundles, and the report carries the transferred and decoded quantities
separately. They are never substituted for one another, in either direction.

The reconciliation states three numbers: what was measured, what the modules
explain, and what is left over. The remainder is reported, not absorbed.

## Blame is a range, not a last-touch

`blameModules` asks for the commits touching a file between the baseline run's
commit and the candidate run's commit. Those commits are the ones responsible for
the change being explained. "Who last edited this file" is a different question
and would often name the wrong person.

The git port is read-only, takes its arguments as an array rather than through a
shell, and refuses a path that leaves the repository before git ever sees it.

## Source maps

Parsed here, with a base64 vlq decoder written in the package. A mapping segment
owns the generated text from its own column to the start of the next segment, and
the last segment on a line owns the line ending, so every byte of the file is
either credited to a source or counted as unattributed.

Source maps are used and discarded. This package stores nothing and logs nothing.
