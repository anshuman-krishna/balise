/**
 * holds the published packages to the promises their licence implies.
 *
 * the argument for open sourcing the measurement kernel is that an auditor can
 * read every line that produced a number. that argument dies quietly the day
 * one of these packages grows a dependency nobody looked at, reaches the
 * network, or reads an environment variable. this script is the mechanical
 * version of the promise, and it runs in ci.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/**
 * the packages that go to npm. `schemas` is here because the other four depend
 * on it, and a dependency an auditor cannot read defeats the purpose of the
 * four.
 */
const PUBLISHED = ['schemas', 'measure-core', 'carbon-models', 'criteria-engine', 'rule-packs'];

/** every runtime dependency any published package may carry, and why. */
const ALLOWED_RUNTIME_DEPENDENCIES = {
  '@balise/schemas': 'published alongside, same licence',
  zod: 'the validation library the contracts are written in',
};

/**
 * apis that would make a package reach outside its inputs. a model that can
 * fetch is a model whose output is not reproducible, and a package that can
 * read process.env is a package whose behaviour depends on where it ran.
 */
const FORBIDDEN_IN_SOURCE = [
  { pattern: /\bfetch\s*\(/, reason: 'network access' },
  { pattern: /\bXMLHttpRequest\b/, reason: 'network access' },
  { pattern: /\bnavigator\.sendBeacon\b/, reason: 'telemetry' },
  { pattern: /\bprocess\.env\b/, reason: 'environment-dependent behaviour' },
  { pattern: /\bDate\.now\s*\(/, reason: 'a clock makes output irreproducible' },
  { pattern: /\bnew Date\s*\(\s*\)/, reason: 'a clock makes output irreproducible' },
  { pattern: /\bMath\.random\s*\(/, reason: 'randomness makes output irreproducible' },
];

const failures = [];

function fail(pkg, message) {
  failures.push(`${pkg}: ${message}`);
}

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path));
    } else if (entry.endsWith('.ts')) {
      out.push(path);
    }
  }
  return out;
}

for (const dir of PUBLISHED) {
  const base = join(ROOT, 'packages', dir);
  const pkg = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
  const name = pkg.name;

  if (pkg.private === true) {
    fail(name, 'marked private but listed as published');
  }
  if (pkg.license !== 'Apache-2.0') {
    fail(name, `license is "${pkg.license}", expected Apache-2.0`);
  }
  for (const file of ['LICENSE', 'README.md', 'CHANGELOG.md']) {
    try {
      if (readFileSync(join(base, file), 'utf8').trim().length === 0) {
        fail(name, `${file} is empty`);
      }
    } catch {
      fail(name, `${file} is missing`);
    }
  }
  for (const field of ['repository', 'homepage', 'bugs', 'files', 'publishConfig', 'description']) {
    if (pkg[field] === undefined) {
      fail(name, `package.json has no ${field}`);
    }
  }
  if (pkg.publishConfig?.exports?.['.']?.types === undefined) {
    fail(name, 'publishConfig does not point the published exports at built types');
  }
  if (pkg.scripts?.build === undefined) {
    fail(name, 'no build script, so nothing produces the files it promises to publish');
  }

  for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
    if (!(pkg.files ?? []).includes(file)) {
      fail(name, `${file} exists but is not in "files", so it would not be published`);
    }
  }

  for (const dep of Object.keys(pkg.dependencies ?? {})) {
    if (!(dep in ALLOWED_RUNTIME_DEPENDENCIES)) {
      fail(name, `runtime dependency "${dep}" is not on the allowlist in this script`);
    }
  }

  const files = sourceFiles(join(base, 'src'));
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const relative = file.slice(ROOT.length);

    for (const specifier of text.matchAll(/from\s+'([^']+)'/g)) {
      const target = specifier[1];
      if (target.startsWith('.') || target.startsWith('node:')) {
        continue;
      }
      const root = target.startsWith('@') ? target.split('/').slice(0, 2).join('/') : target.split('/')[0];
      if (!(root in (pkg.dependencies ?? {}))) {
        fail(name, `${relative} imports "${target}", which is not a declared dependency`);
      }
    }

    // these four run in a browser as well as in node, so a builtin is a bug
    // rather than a preference.
    for (const builtin of text.matchAll(/from\s+'(node:[^']+)'/g)) {
      fail(name, `${relative} imports ${builtin[1]}; published packages stay runtime-agnostic`);
    }

    for (const { pattern, reason } of FORBIDDEN_IN_SOURCE) {
      if (pattern.test(text)) {
        fail(name, `${relative} uses ${pattern.source} (${reason})`);
      }
    }
  }
}

// everything else in packages/ must say so, so that adding a package does not
// silently add it to npm.
for (const dir of readdirSync(join(ROOT, 'packages'))) {
  if (PUBLISHED.includes(dir)) {
    continue;
  }
  const pkg = JSON.parse(readFileSync(join(ROOT, 'packages', dir, 'package.json'), 'utf8'));
  if (pkg.private !== true) {
    fail(pkg.name, 'is not private and is not on the published list; one of the two is wrong');
  }
}

if (failures.length > 0) {
  console.error(`package surface check failed, ${failures.length} problem(s):\n`);
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(`package surface check passed: ${PUBLISHED.length} published packages, ${Object.keys(ALLOWED_RUNTIME_DEPENDENCIES).length} allowed runtime dependencies.`);
