/**
 * installs the packed tarballs into an empty directory and runs them there.
 *
 * inside the workspace every one of these packages resolves through a symlink
 * to a sibling's `src`, which is a resolution path no consumer will ever have.
 * this script is the only check that answers the question a consumer actually
 * asks: does `npm install @balise/measure-core` give you something that works.
 *
 * usage: node scripts/verify-standalone.mjs <directory of .tgz files>
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve(process.argv[2] ?? '.');
const tarballs = readdirSync(source)
  .filter((file) => file.endsWith('.tgz'))
  .map((file) => join(source, file));

if (tarballs.length === 0) {
  console.error(`no tarballs in ${source}`);
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), 'balise-standalone-'));
writeFileSync(
  join(dir, 'package.json'),
  `${JSON.stringify({ name: 'balise-standalone-check', private: true, type: 'module' }, null, 2)}\n`,
);

writeFileSync(
  join(dir, 'check.mjs'),
  `
import { classifyDelta, computeNoiseFloor, gradeConfidence, median } from '@balise/measure-core';
import { carbonModels, bandModels } from '@balise/carbon-models';
import { evaluate, completion } from '@balise/criteria-engine';
import { rgesn2024v2 } from '@balise/rule-packs';
import { METRIC_DIRECTION } from '@balise/schemas';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(median([1, 2, 3, 10]) === 2.5, 'median');
assert(carbonModels.length >= 3, 'carbon models registered');
assert(bandModels().every((model) => model.method === 'energy'), 'only energy models share a band');
assert(rgesn2024v2.criteria.length === 78, 'rgesn 2024 v2 carries 78 criteria');
assert(rgesn2024v2.tiersSignedOff === false, 'the pack still withholds its tiers');
assert(METRIC_DIRECTION.transferred_bytes === 'lower-is-better', 'metric direction');

// the refusals matter more than the answers: with no history there is no
// floor, so there is no verdict and no confidence in one.
const floor = computeNoiseFloor([], 'transferred_bytes');
assert(floor.status === 'insufficient-history', 'no history gives no floor');
assert(floor.value === undefined, 'an unestablished floor carries no value to read');

const aggregate = { metricId: 'transferred_bytes', unit: 'bytes', median: 1000, mad: 10, sampleCount: 5 };
assert(
  classifyDelta(aggregate, { ...aggregate, median: 1200 }, floor).classification === 'indeterminate',
  'no floor, no verdict',
);
assert(gradeConfidence(aggregate, { fingerprintStable: true, noiseFloor: floor }) === 'low', 'no floor, low confidence');

// an unsigned pack answers nothing automatically, whatever its tiers say.
const answered = completion(evaluate(rgesn2024v2, { metrics: {}, attestations: {} }));
assert(answered.byTier.every((tier) => tier.answered === 0), 'an unsigned pack answers nothing');

console.log('standalone check passed');
`,
);

console.log(`installing ${tarballs.length} tarballs into ${dir}`);
execFileSync('npm', ['install', '--no-audit', '--no-fund', '--silent', ...tarballs], {
  cwd: dir,
  stdio: 'inherit',
});
execFileSync('node', ['check.mjs'], { cwd: dir, stdio: 'inherit' });
