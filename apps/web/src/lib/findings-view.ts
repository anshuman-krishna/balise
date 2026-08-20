import type { Finding, FindingId, WithheldFinding } from '@balise/measure-core';
import { formatMeasured } from '@balise/schemas';
import type { Catalog } from '@balise/i18n';
import { fill } from '../i18n';
import { findingsCanon } from '../fixtures/findings-canon';
import { displayName } from './capture-view';

/**
 * the engine's findings, read for a screen. this selects and formats; it
 * raises nothing and computes no quantity.
 *
 * the catalog is an argument rather than an import because the public scan is
 * french whatever the app locale is, and the run detail is not.
 */

export interface FindingEvidenceRow {
  url: string;
  name: string;
  amount: string;
}

export interface FindingRow {
  id: FindingId;
  severity: Finding['severity'];
  /** the measured quantity, for the mono column. never a delta, never a saving. */
  amount: string;
  sentence: string;
  evidence: readonly FindingEvidenceRow[];
  /** what the finding could not see, where anything was missing. */
  unavailable: string | null;
}

export interface WithheldRow {
  id: FindingId;
  text: string;
}

export interface FindingsView {
  title: string;
  rows: readonly FindingRow[];
  withheld: readonly WithheldRow[];
  note: string;
  /** shown in place of the rows when nothing cleared a threshold. */
  none: string | null;
}

function share(finding: Finding): string {
  return finding.share === null ? '' : formatMeasured(finding.share.value * 100, 'pct');
}

function percentile(finding: Finding): string {
  return finding.reference === null ? '' : formatMeasured(finding.reference.percentile, 'pct');
}

function row(finding: Finding, catalog: Catalog): FindingRow {
  const strings = catalog.findings;
  return {
    id: finding.id,
    severity: finding.severity,
    amount: formatMeasured(finding.value, finding.unit === 'bytes' ? 'bytes' : 'count'),
    sentence: fill(strings.sentences[finding.id], {
      count: finding.contributorCount,
      share: share(finding),
      percentile: percentile(finding),
    }),
    evidence: finding.evidence.map((entry) => ({
      url: entry.url,
      name: displayName(entry.url, entry.resourceType),
      amount: formatMeasured(
        finding.share?.basis === 'group-decoded-bytes'
          ? (entry.unusedDecodedBytes ?? entry.transferredBytes)
          : entry.transferredBytes,
        'bytes',
      ),
    })),
    unavailable:
      finding.unavailableCount === 0
        ? null
        : fill(strings.unavailable, { count: finding.unavailableCount }),
  };
}

function withheldRow(entry: WithheldFinding, catalog: Catalog): WithheldRow {
  return {
    id: entry.id,
    text: fill(catalog.findings.withheld[entry.id], { count: entry.contributorCount }),
  };
}

export function findingsPage(pageId: string): {
  findings: readonly Finding[];
  withheld: readonly WithheldFinding[];
} {
  const page = findingsCanon.pages[pageId];
  if (page === undefined) {
    throw new Error(`the findings canon holds no page "${pageId}"`);
  }
  return page.result;
}

export function findingsView(pageId: string, catalog: Catalog): FindingsView {
  const page = findingsPage(pageId);
  const strings = catalog.findings;
  const count = page.findings.length;

  return {
    title: count === 1 ? strings.titleOne : fill(strings.title, { count }),
    rows: page.findings.map((finding) => row(finding, catalog)),
    withheld: page.withheld.map((entry) => withheldRow(entry, catalog)),
    note: strings.note,
    none: count === 0 ? strings.none : null,
  };
}
