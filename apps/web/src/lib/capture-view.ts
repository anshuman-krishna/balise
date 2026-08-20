import type { CapturedResource, RawCapture, ResourceType } from '@balise/schemas';
import { isThirdParty, summariseResources, type ResourceSummary } from '@balise/measure-core';
import { measurementCanon } from '../fixtures/measurement-canon';
import { attributionCanon } from '../fixtures/attribution-canon';

/**
 * the run's own capture, read for the screens. this selects and formats; it
 * computes no metric. the totals on the inventory come from the kernel's
 * `summariseResources`, and the figures above it from `extractMetrics` through
 * the measurement canon, which is why the two cannot disagree.
 */

export type ResourceKind = 'first-party' | 'third-party' | 'regression';

export interface ResourceRow {
  url: string;
  /** what to print: the path a browser fetched, not the whole url. */
  name: string;
  resourceType: ResourceType;
  kind: ResourceKind;
  transferredBytes: number;
  decodedBytes: number | null;
  unusedDecodedBytes: number | null;
  /** the host, where the resource came from somewhere other than the service. */
  origin: string | null;
  /** position and length in the load, as fractions of it. null with no timing. */
  startFraction: number | null;
  durationFraction: number | null;
}

export function capture(aggregationId: string): RawCapture {
  const aggregation = measurementCanon.aggregations.find((entry) => entry.id === aggregationId);
  if (aggregation?.capture === undefined) {
    throw new Error(`the measurement canon publishes no capture for "${aggregationId}"`);
  }
  return aggregation.capture;
}

/** last path segment, or the path itself for the document the run navigated to. */
function displayName(url: string, resourceType: ResourceType): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (resourceType === 'document') return parsed.pathname;
  const segment = parsed.pathname.split('/').filter(Boolean).pop();
  return segment === undefined ? parsed.host : `${segment}${parsed.search}`;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function kindOf(resource: CapturedResource, serviceOrigin: string): ResourceKind {
  // the bundle the attribution engine named, rather than a flag set by hand on
  // a fixture row.
  if (resource.url === attributionCanon.bundle.after) return 'regression';
  return isThirdParty(resource.url, serviceOrigin) ? 'third-party' : 'first-party';
}

/**
 * the window the load occupied, from the first request to the last byte. null
 * when no resource carries a timing, in which case no bar is drawn rather than
 * every bar being drawn at zero.
 */
function windowMs(capture: RawCapture): number | null {
  const ends = capture.resources
    .filter((resource) => resource.startMs !== null && resource.durationMs !== null)
    .map((resource) => resource.startMs! + resource.durationMs!);
  return ends.length === 0 ? null : Math.max(...ends);
}

export function resourceRows(from: RawCapture): ResourceRow[] {
  const serviceOrigin = new URL(from.serviceOrigin).origin;
  const window = windowMs(from);

  return from.resources.map((resource) => ({
    url: resource.url,
    name: displayName(resource.url, resource.resourceType),
    resourceType: resource.resourceType,
    kind: kindOf(resource, serviceOrigin),
    transferredBytes: resource.transferredBytes,
    decodedBytes: resource.decodedBytes,
    unusedDecodedBytes: resource.unusedDecodedBytes,
    origin: isThirdParty(resource.url, serviceOrigin) ? hostOf(resource.url) : null,
    startFraction: window === null || resource.startMs === null ? null : resource.startMs / window,
    durationFraction:
      window === null || resource.durationMs === null ? null : resource.durationMs / window,
  }));
}

export interface Waterfall {
  rows: readonly ResourceRow[];
  /** everything the waterfall has no room for, counted rather than dropped. */
  remainder: { count: number; transferredBytes: number };
}

/**
 * the heaviest `count` resources, drawn in the order they were requested. a
 * waterfall ordered by weight is a bar chart; one showing only the first few
 * requests hides every third party, which arrives late by construction. so the
 * selection is by bytes and the drawing is by time.
 */
export function waterfall(rows: readonly ResourceRow[], count: number): Waterfall {
  const heaviest = [...rows].sort((a, b) => b.transferredBytes - a.transferredBytes).slice(0, count);
  const shown = new Set(heaviest.map((row) => row.url));
  const rest = rows.filter((row) => !shown.has(row.url));

  return {
    rows: heaviest.sort((a, b) => (a.startFraction ?? 0) - (b.startFraction ?? 0)),
    remainder: {
      count: rest.length,
      transferredBytes: rest.reduce((sum, row) => sum + row.transferredBytes, 0),
    },
  };
}

export function inventory(from: RawCapture): ResourceSummary {
  return summariseResources(from);
}
