import type {
  BundleAttribution,
  BundleCoverage,
  ChangeStatus,
  ModuleChange,
  ModuleDiff,
  PackageChange,
} from '@balise/schemas';

const SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/]*)(\/.*)?$/;

/** resolve . and .. lexically. a leading .. that cannot be resolved is kept. */
function normaliseSegments(path: string): string {
  const absolute = path.startsWith('/');
  const out: string[] = [];
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..' && out.length > 0 && out[out.length - 1] !== '..') {
      out.pop();
      continue;
    }
    out.push(segment);
  }
  return (absolute ? '/' : '') + out.join('/');
}

/**
 * the package a module belongs to, read off the node_modules layout rather
 * than guessed from the name. the last node_modules segment wins, so a nested
 * or pnpm-store path resolves to the package actually being bundled.
 */
export function packageNameOf(path: string): string | null {
  const segments = path.split('/');
  const marker = segments.lastIndexOf('node_modules');
  if (marker < 0) return null;

  const first = segments[marker + 1];
  if (first === undefined || first === '') return null;
  if (first.startsWith('@')) {
    const second = segments[marker + 2];
    return second === undefined || second === '' ? null : `${first}/${second}`;
  }
  return first;
}

export interface NormalisedSource {
  path: string;
  packageName: string | null;
}

/**
 * turn what a source map says into a stable module identity. bundler schemes
 * (webpack://, webpack-internal:///) are removed and relative segments are
 * resolved, so the same module keeps one identity across builds. the original
 * string is kept by the caller, so the transform is auditable and nothing here
 * is inferred from the file name.
 */
export function normaliseSourcePath(raw: string): NormalisedSource {
  let path = raw;
  const scheme = SCHEME.exec(raw);
  if (scheme !== null) {
    const tail = scheme[3] ?? '/';
    // a file: url is a real absolute path and keeps its root. a bundler scheme
    // is a namespace, not a filesystem, so its leading slash is dropped.
    path = scheme[1] === 'file' ? tail : tail.replace(/^\/+/, '');
  }
  const normalised = normaliseSegments(path);
  return { path: normalised, packageName: packageNameOf(normalised) };
}

export function changeStatus(before: number, after: number): ChangeStatus {
  if (before === 0 && after > 0) return 'added';
  if (after === 0 && before > 0) return 'removed';
  if (after > before) return 'grown';
  if (after < before) return 'shrunk';
  return 'unchanged';
}

interface SideTotals {
  bytesByPath: Map<string, number>;
  packageByPath: Map<string, string | null>;
  coverage: BundleCoverage;
}

function foldSide(bundles: readonly BundleAttribution[]): SideTotals {
  const bytesByPath = new Map<string, number>();
  const packageByPath = new Map<string, string | null>();
  const unavailable: { url: string; reason: BundleCoverage['unavailable'][number]['reason'] }[] = [];
  let resolvedBundles = 0;
  let attributedBytes = 0;
  let unattributedBytes = 0;

  for (const bundle of bundles) {
    if (bundle.status === 'unavailable') {
      unavailable.push({ url: bundle.url, reason: bundle.reason });
      continue;
    }
    resolvedBundles += 1;
    unattributedBytes += bundle.unattributedBytes;
    for (const source of bundle.sources) {
      bytesByPath.set(source.path, (bytesByPath.get(source.path) ?? 0) + source.bytes);
      packageByPath.set(source.path, source.packageName);
      attributedBytes += source.bytes;
    }
  }

  return {
    bytesByPath,
    packageByPath,
    coverage: { resolvedBundles, attributedBytes, unattributedBytes, unavailable },
  };
}

function byImpact<T extends { delta: number }>(key: (row: T) => string) {
  return (a: T, b: T): number => {
    const magnitude = Math.abs(b.delta) - Math.abs(a.delta);
    return magnitude !== 0 ? magnitude : key(a).localeCompare(key(b));
  };
}

/**
 * diff two runs at module level rather than at file level. bundle file names
 * carry a content hash, so they rotate on every build and pairing them would
 * mean matching on a name pattern. module identity comes from the source map
 * and survives the rotation, so the comparison is exact.
 */
export function diffModules(
  before: readonly BundleAttribution[],
  after: readonly BundleAttribution[],
): ModuleDiff {
  const left = foldSide(before);
  const right = foldSide(after);
  const complete = left.coverage.unavailable.length === 0 && right.coverage.unavailable.length === 0;

  const paths = new Set<string>([...left.bytesByPath.keys(), ...right.bytesByPath.keys()]);
  const modules: ModuleChange[] = [];
  for (const path of paths) {
    const beforeBytes = left.bytesByPath.get(path) ?? 0;
    const afterBytes = right.bytesByPath.get(path) ?? 0;
    modules.push({
      path,
      packageName: right.packageByPath.get(path) ?? left.packageByPath.get(path) ?? null,
      beforeBytes,
      afterBytes,
      delta: afterBytes - beforeBytes,
      status: changeStatus(beforeBytes, afterBytes),
    });
  }
  modules.sort(byImpact<ModuleChange>((row) => row.path));

  const packages = new Map<string, { before: number; after: number; moduleCount: number }>();
  for (const module of modules) {
    if (module.packageName === null) continue;
    const entry = packages.get(module.packageName) ?? { before: 0, after: 0, moduleCount: 0 };
    entry.before += module.beforeBytes;
    entry.after += module.afterBytes;
    entry.moduleCount += 1;
    packages.set(module.packageName, entry);
  }

  const packageChanges: PackageChange[] = [...packages.entries()]
    .map(([packageName, entry]) => ({
      packageName,
      beforeBytes: entry.before,
      afterBytes: entry.after,
      delta: entry.after - entry.before,
      status: changeStatus(entry.before, entry.after),
      moduleCount: entry.moduleCount,
    }))
    .sort(byImpact<PackageChange>((row) => row.packageName));

  return {
    // a side we could not read completely is not comparable to one we could:
    // every module in the unreadable bundle would read as removed. the diff is
    // withheld and the coverage says which bundle stopped it.
    modules: complete ? modules : [],
    packages: complete ? packageChanges : [],
    unattributed: {
      before: left.coverage.unattributedBytes,
      after: right.coverage.unattributedBytes,
      delta: right.coverage.unattributedBytes - left.coverage.unattributedBytes,
    },
    before: left.coverage,
    after: right.coverage,
    complete,
  };
}
