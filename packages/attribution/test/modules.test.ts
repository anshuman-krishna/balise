import { describe, expect, it } from 'vitest';
import type { BundleAttribution } from '@balise/schemas';
import { diffModules, normaliseSourcePath, packageNameOf } from '../src/modules.js';

function resolved(url: string, sources: [string, number][], unattributed = 0): BundleAttribution {
  return {
    status: 'resolved',
    url,
    totalBytes: sources.reduce((total, [, bytes]) => total + bytes, unattributed),
    sources: sources.map(([path, bytes]) => ({
      path,
      rawPath: path,
      packageName: packageNameOf(path),
      bytes,
    })),
    unattributedBytes: unattributed,
  };
}

describe('normaliseSourcePath', () => {
  it('removes a bundler scheme and resolves relative segments', () => {
    expect(normaliseSourcePath('webpack://selo/./src/lib/dates.ts').path).toBe('src/lib/dates.ts');
    expect(normaliseSourcePath('webpack-internal:///./src/main.ts').path).toBe('src/main.ts');
    expect(normaliseSourcePath('../../src/a.ts').path).toBe('../../src/a.ts');
    expect(normaliseSourcePath('src/lib/../main.ts').path).toBe('src/main.ts');
  });

  it('keeps a file url absolute, because it is a real path', () => {
    expect(normaliseSourcePath('file:///Users/x/app/src/a.ts').path).toBe('/Users/x/app/src/a.ts');
  });

  it('gives two spellings of one module the same identity', () => {
    expect(normaliseSourcePath('webpack://selo/./src/a.ts').path).toBe(normaliseSourcePath('src/a.ts').path);
  });
});

describe('packageNameOf', () => {
  it('reads the package off the node_modules layout', () => {
    expect(packageNameOf('node_modules/date-fns/locale/fr/index.js')).toBe('date-fns');
    expect(packageNameOf('src/main.ts')).toBeNull();
  });

  it('keeps a scope with its package', () => {
    expect(packageNameOf('node_modules/@tanstack/react-query/build/index.js')).toBe('@tanstack/react-query');
  });

  it('takes the innermost package when they nest', () => {
    expect(packageNameOf('node_modules/a/node_modules/b/index.js')).toBe('b');
    expect(packageNameOf('node_modules/.pnpm/date-fns@2.30.0/node_modules/date-fns/index.js')).toBe('date-fns');
  });
});

describe('diffModules', () => {
  const before = [resolved('https://selo.fr/app.a3f2.js', [['src/main.ts', 1000], ['node_modules/react/index.js', 5000]], 200)];
  const after = [
    resolved(
      // the file name rotates on every build. module identity does not.
      'https://selo.fr/app.b81c.js',
      [
        ['src/main.ts', 1200],
        ['node_modules/react/index.js', 5000],
        ['node_modules/date-fns/locale/fr.js', 4000],
      ],
      220,
    ),
  ];

  it('pairs modules across a bundle whose file name changed', () => {
    const diff = diffModules(before, after);
    const main = diff.modules.find((row) => row.path === 'src/main.ts');
    expect(main).toMatchObject({ beforeBytes: 1000, afterBytes: 1200, delta: 200, status: 'grown' });
  });

  it('classifies added, removed and unchanged modules', () => {
    const diff = diffModules(before, after);
    expect(diff.modules.find((row) => row.path.includes('date-fns'))).toMatchObject({
      status: 'added',
      beforeBytes: 0,
      afterBytes: 4000,
    });
    expect(diff.modules.find((row) => row.path.includes('react'))?.status).toBe('unchanged');

    const removed = diffModules(after, before);
    expect(removed.modules.find((row) => row.path.includes('date-fns'))?.status).toBe('removed');
  });

  it('orders by the size of the change, largest first', () => {
    const diff = diffModules(before, after);
    expect(diff.modules[0]!.path).toContain('date-fns');
  });

  it('aggregates modules into packages', () => {
    const diff = diffModules(before, after);
    expect(diff.packages[0]).toMatchObject({ packageName: 'date-fns', delta: 4000, moduleCount: 1 });
    // application code is not a package and is not invented into one.
    expect(diff.packages.some((row) => row.packageName === null)).toBe(false);
  });

  it('carries the unattributed bytes of each side rather than spreading them', () => {
    const diff = diffModules(before, after);
    expect(diff.unattributed).toEqual({ before: 200, after: 220, delta: 20 });
  });

  const unreadable = (url: string): BundleAttribution => ({
    status: 'unavailable',
    url,
    reason: 'no-source-map',
  });

  it('withholds the module diff when a bundle is readable on one side only', () => {
    const diff = diffModules(before, [...after, unreadable('https://selo.fr/vendor.b81c.js')]);

    // the honest outcome: no module changes at all. reporting them would say
    // the modules of the unreadable bundle had been removed.
    expect(diff.comparable).toBe(false);
    expect(diff.complete).toBe(false);
    expect(diff.modules).toEqual([]);
    expect(diff.packages).toEqual([]);
    expect(diff.after.unavailable).toEqual([{ url: 'https://selo.fr/vendor.b81c.js', reason: 'no-source-map' }]);
    expect(diff.after.resolvedBundles).toBe(1);
  });

  it('still compares when the same bundle is unreadable on both sides', () => {
    // a third-party script that never ships a map contributes nothing to either
    // total, so nothing can look removed. its bytes surface in the
    // reconciliation instead.
    const tag = 'https://player.dailymotion.com/embed.js';
    const diff = diffModules([...before, unreadable(tag)], [...after, unreadable(tag)]);
    expect(diff.comparable).toBe(true);
    expect(diff.complete).toBe(false);
    expect(diff.modules.find((row) => row.path.includes('date-fns'))?.delta).toBe(4000);
  });

  it('refuses to compare when the unreadable bundle was renamed', () => {
    const diff = diffModules(
      [...before, unreadable('https://cdn.example.fr/tag.a1.js')],
      [...after, unreadable('https://cdn.example.fr/tag.b2.js')],
    );
    expect(diff.comparable).toBe(false);
    expect(diff.modules).toEqual([]);
  });

  it('is complete and comparable when both sides resolved', () => {
    expect(diffModules(before, after)).toMatchObject({ complete: true, comparable: true });
  });

  it('sums a module split across several bundles', () => {
    const split = [
      resolved('https://selo.fr/a.js', [['src/shared.ts', 300]]),
      resolved('https://selo.fr/b.js', [['src/shared.ts', 400]]),
    ];
    const diff = diffModules([], split);
    expect(diff.modules.find((row) => row.path === 'src/shared.ts')?.afterBytes).toBe(700);
  });
});
