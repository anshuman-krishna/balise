import type { TextPart } from '@balise/i18n';
import type {
  BundleAttribution,
  ModuleBlame,
  ModuleChange,
  OriginChange,
  PackageChange,
  Reconciliation,
  ResourceChange,
} from '@balise/schemas';
import { formatInt, formatSigned } from '@balise/ui';
import { fill, fillParts, t } from '../i18n';
import { attributionCanon } from '../fixtures/attribution-canon';

// the generated canon is frozen data, so the view types are the schema shapes
// with their arrays read-only all the way down.
type Immutable<T> = T extends (infer U)[]
  ? readonly Immutable<U>[]
  : T extends object
    ? { readonly [K in keyof T]: Immutable<T[K]> }
    : T;

/**
 * what these helpers need from an attribution run. typed against the schemas
 * rather than against the generated fixture, so the same functions render a
 * real report the day one arrives from the api.
 */
export interface AttributionView {
  bundle: { before: string; after: string; rows: readonly Immutable<ResourceChange>[] };
  modules: readonly Immutable<ModuleChange>[];
  packages: readonly Immutable<PackageChange>[];
  unattributed: { before: number; after: number; delta: number };
  reconciliation: Immutable<Reconciliation>;
  blame: readonly Immutable<ModuleBlame>[];
  origins: readonly Immutable<OriginChange>[];
  thirdPartyBundle: Immutable<BundleAttribution>;
}

type Canon = AttributionView;

/**
 * a byte delta, in the unit that does not lie about its precision. below a
 * kilobyte the figure is shown in bytes rather than rounded to 0 KB, because a
 * rounded-away change is still a change.
 */
export function formatByteDelta(bytes: number): string {
  return Math.abs(bytes) < 1_000 ? `${formatSigned(bytes)} B` : `${formatSigned(Math.round(bytes / 1_000))} KB`;
}

export function formatBytes(bytes: number): string {
  return Math.abs(bytes) < 1_000 ? `${formatInt(bytes)} B` : `${formatInt(Math.round(bytes / 1_000))} KB`;
}

/** the served file name, which is what a developer recognises. */
export function bundleName(url: string): string {
  return url.split('/').pop() ?? url;
}

export function shortDate(iso: string): string {
  const at = new Date(iso);
  return `${at.getUTCDate()} ${t.months[at.getUTCMonth()] ?? ''}`;
}

function leadingPackage(canon: Canon) {
  return canon.packages.find((row) => row.delta > 0) ?? null;
}

function attributedCommit(canon: Canon) {
  for (const entry of canon.blame) {
    if (entry.status === 'attributed') return { path: entry.path, commit: entry.commits[0]! };
  }
  return null;
}

/**
 * the sentence the card opens with. every value in it is measured: the bundle
 * that grew, by how much, the package responsible, and the commit that touched
 * the first-party file. the template is one translatable string, so the clause
 * order is the translator's to choose.
 */
export function attributionLead(canon: Canon = attributionCanon): TextPart[] {
  const leading = leadingPackage(canon);
  const blamed = attributedCommit(canon);
  const measured = canon.reconciliation.measuredDelta ?? 0;
  const changedModules = leading === null
    ? 0
    : canon.modules.filter((row) => row.packageName === leading.packageName && row.delta > 0).length;

  const values = {
    bundle: { text: bundleName(canon.bundle.after), token: true },
    amount: { text: formatByteDelta(measured), measure: true },
    share: { text: formatByteDelta(leading?.delta ?? 0), measure: true },
    package: { text: leading?.packageName ?? '', token: true },
    count: changedModules,
    commit: { text: blamed === null ? '' : `${blamed.commit.shortSha} · ${blamed.commit.author}`, token: true },
  };

  return fillParts(blamed === null ? t.comparison.attributionLeadNoCommit : t.comparison.attributionLead, values);
}

export interface AttributionRow {
  key: keyof typeof t.comparison.attributionKeys;
  value: string;
  note: string;
  tone: 'breach' | 'muted';
}

/** the chain the card walks down: bundle, dependency, module, file, commit. */
export function attributionRows(canon: Canon = attributionCanon): AttributionRow[] {
  const rows: AttributionRow[] = [
    {
      key: 'bundle',
      value: bundleName(canon.bundle.after),
      note: formatByteDelta(canon.reconciliation.measuredDelta ?? 0),
      tone: 'breach',
    },
  ];

  const leading = leadingPackage(canon);
  if (leading !== null) {
    rows.push({ key: 'dependency', value: leading.packageName, note: formatByteDelta(leading.delta), tone: 'breach' });
    const largest = canon.modules.find((row) => row.packageName === leading.packageName);
    if (largest !== undefined) {
      rows.push({ key: 'module', value: largest.path, note: formatByteDelta(largest.delta), tone: 'breach' });
    }
  }

  const firstParty = canon.modules.find((row) => row.packageName === null && row.delta !== 0);
  if (firstParty !== undefined) {
    rows.push({ key: 'file', value: firstParty.path, note: formatByteDelta(firstParty.delta), tone: 'muted' });
  }

  const blamed = attributedCommit(canon);
  if (blamed !== null) {
    rows.push({
      key: 'commit',
      value: `${blamed.commit.shortSha} · ${blamed.commit.author}`,
      note: shortDate(blamed.commit.authoredAt),
      tone: 'muted',
    });
  }

  rows.push({
    key: 'remainder',
    value: t.comparison.attributionKeys.remainder,
    note: formatByteDelta(canon.unattributed.delta),
    tone: 'muted',
  });

  return rows;
}

/**
 * what the modules account for, and what they do not. the leftover is stated
 * rather than folded into the largest module, which is the whole point of
 * reporting a reconciliation at all.
 */
export function attributionCoverage(canon: Canon = attributionCanon): string {
  return fill(t.comparison.attributionCoverage, {
    explained: formatBytes(canon.reconciliation.explainedDelta),
    measured: formatBytes(canon.reconciliation.measuredDelta ?? 0),
    remainder: formatBytes(canon.reconciliation.unexplainedDelta ?? 0),
  });
}

export interface OriginRow {
  origin: string;
  isNew: boolean;
  transferred: string;
}

export function originRows(canon: Canon = attributionCanon): OriginRow[] {
  return canon.origins
    .map((row) => ({
      origin: row.origin.replace(/^https?:\/\//, ''),
      isNew: row.status === 'added',
      transferred: formatBytes(row.afterTransferredBytes),
    }))
    .sort((a, b) => a.origin.localeCompare(b.origin));
}

/** the origin we tried to explain and could not, with the reason it gave. */
export function unexplainedOrigin(canon: Canon = attributionCanon): string | null {
  if (canon.thirdPartyBundle.status !== 'unavailable') return null;
  try {
    return new URL(canon.thirdPartyBundle.url).hostname;
  } catch {
    return canon.thirdPartyBundle.url;
  }
}
