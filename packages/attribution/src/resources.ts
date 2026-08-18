import type {
  AttributedResource,
  ByteTotals,
  OriginChange,
  OriginDiff,
  ResourceChange,
  ResourceDiff,
  ResourceParty,
} from '@balise/schemas';
import { changeStatus } from './modules.js';
import { identifyVendor } from './vendors.js';

export interface ResourceSideInput {
  /** origin of the audited service. everything else is third party. */
  serviceOrigin: string;
  resources: readonly AttributedResource[];
}

function safeUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function serviceOriginOf(value: string): string | null {
  const direct = safeUrl(value);
  if (direct !== null) return direct.origin;
  const prefixed = safeUrl(`https://${value}`);
  return prefixed === null ? null : prefixed.origin;
}

export interface UrlOrigin {
  /** grouping key for the origin diff. */
  key: string;
  hostname: string | null;
  party: ResourceParty;
}

/**
 * which origin a resource came from, and whether it is the service's own.
 * a url we cannot parse is reported as unknown rather than counted as first
 * party, which would quietly shrink the third-party total.
 */
export function classifyUrl(url: string, serviceOrigin: string | null): UrlOrigin {
  const parsed = safeUrl(url);
  if (parsed === null) return { key: url, hostname: null, party: 'unknown' };
  // inline data has no origin of its own; it was served with the document.
  if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
    return { key: parsed.protocol, hostname: null, party: 'first' };
  }
  const party: ResourceParty =
    serviceOrigin === null ? 'unknown' : parsed.origin === serviceOrigin ? 'first' : 'third';
  return { key: parsed.origin, hostname: parsed.hostname, party };
}

interface Bucket {
  transferred: number;
  /** null when at least one entry did not carry a decoded size. */
  decoded: number | null;
  requests: number;
  party: ResourceParty;
  hostname: string | null;
}

function emptyBucket(party: ResourceParty, hostname: string | null): Bucket {
  return { transferred: 0, decoded: 0, requests: 0, party, hostname };
}

function add(bucket: Bucket, resource: AttributedResource): void {
  bucket.transferred += resource.transferredBytes;
  bucket.decoded =
    bucket.decoded === null || resource.decodedBytes === undefined
      ? null
      : bucket.decoded + resource.decodedBytes;
  bucket.requests += 1;
}

// the fragment never reaches the server, so two urls differing only by it are
// the same request.
function requestKey(url: string): string {
  const hash = url.indexOf('#');
  return hash < 0 ? url : url.slice(0, hash);
}

function foldByUrl(side: ResourceSideInput): Map<string, Bucket> {
  const origin = serviceOriginOf(side.serviceOrigin);
  const buckets = new Map<string, Bucket>();
  for (const resource of side.resources) {
    const key = requestKey(resource.url);
    const classified = classifyUrl(resource.url, origin);
    const bucket = buckets.get(key) ?? emptyBucket(classified.party, classified.hostname);
    add(bucket, resource);
    buckets.set(key, bucket);
  }
  return buckets;
}

function foldByOrigin(side: ResourceSideInput): Map<string, Bucket> {
  const origin = serviceOriginOf(side.serviceOrigin);
  const buckets = new Map<string, Bucket>();
  for (const resource of side.resources) {
    const classified = classifyUrl(resource.url, origin);
    const bucket = buckets.get(classified.key) ?? emptyBucket(classified.party, classified.hostname);
    add(bucket, resource);
    buckets.set(classified.key, bucket);
  }
  return buckets;
}

function totals(
  before: Iterable<Bucket>,
  after: Iterable<Bucket>,
  pick: (bucket: Bucket) => number | null,
): ByteTotals {
  let beforeSum = 0;
  let afterSum = 0;
  let complete = true;
  for (const bucket of before) {
    const value = pick(bucket);
    if (value === null) complete = false;
    else beforeSum += value;
  }
  for (const bucket of after) {
    const value = pick(bucket);
    if (value === null) complete = false;
    else afterSum += value;
  }
  return { before: beforeSum, after: afterSum, delta: afterSum - beforeSum, complete };
}

function byTransferredImpact<T extends { transferredDelta: number }>(key: (row: T) => string) {
  return (a: T, b: T): number => {
    const magnitude = Math.abs(b.transferredDelta) - Math.abs(a.transferredDelta);
    return magnitude !== 0 ? magnitude : key(a).localeCompare(key(b));
  };
}

/**
 * diff the resource graph between two runs.
 *
 * resources are paired on their exact url. a bundle whose file name carries a
 * content hash therefore reads as one removal and one addition, which is what
 * actually happened at the network level; explaining it is the module diff's
 * job, where identity survives the rename. nothing here pairs two files by
 * their names looking similar.
 */
export function diffResources(before: ResourceSideInput, after: ResourceSideInput): ResourceDiff {
  const left = foldByUrl(before);
  const right = foldByUrl(after);

  const changes: ResourceChange[] = [];
  for (const url of new Set([...left.keys(), ...right.keys()])) {
    const a = left.get(url);
    const b = right.get(url);
    const beforeTransferred = a?.transferred ?? 0;
    const afterTransferred = b?.transferred ?? 0;
    const beforeDecoded = a === undefined ? null : a.decoded;
    const afterDecoded = b === undefined ? null : b.decoded;
    changes.push({
      url,
      party: b?.party ?? a?.party ?? 'unknown',
      status: changeStatus(beforeTransferred, afterTransferred),
      beforeTransferredBytes: beforeTransferred,
      afterTransferredBytes: afterTransferred,
      transferredDelta: afterTransferred - beforeTransferred,
      beforeDecodedBytes: beforeDecoded,
      afterDecodedBytes: afterDecoded,
      // a decoded delta needs a decoded size on both sides. it is never
      // completed with the transferred one, which is a different quantity.
      decodedDelta:
        a === undefined || b === undefined || beforeDecoded === null || afterDecoded === null
          ? null
          : afterDecoded - beforeDecoded,
      beforeRequests: a?.requests ?? 0,
      afterRequests: b?.requests ?? 0,
    });
  }
  changes.sort(byTransferredImpact<ResourceChange>((row) => row.url));

  return {
    changes,
    transferred: totals(left.values(), right.values(), (bucket) => bucket.transferred),
    decoded: totals(left.values(), right.values(), (bucket) => bucket.decoded),
  };
}

/**
 * diff the origins a page talks to. a new third-party origin is the finding;
 * naming the vendor behind it is a lookup in a maintained list, and an origin
 * that matches nothing is still reported, by hostname and with its cost.
 */
export function diffOrigins(before: ResourceSideInput, after: ResourceSideInput): OriginDiff {
  const left = foldByOrigin(before);
  const right = foldByOrigin(after);

  const changes: OriginChange[] = [];
  for (const origin of new Set([...left.keys(), ...right.keys()])) {
    const a = left.get(origin);
    const b = right.get(origin);
    const hostname = b?.hostname ?? a?.hostname ?? null;
    const beforeTransferred = a?.transferred ?? 0;
    const afterTransferred = b?.transferred ?? 0;
    changes.push({
      origin,
      party: b?.party ?? a?.party ?? 'unknown',
      status: changeStatus(beforeTransferred, afterTransferred),
      vendor: hostname === null ? null : identifyVendor(hostname),
      beforeTransferredBytes: beforeTransferred,
      afterTransferredBytes: afterTransferred,
      transferredDelta: afterTransferred - beforeTransferred,
      beforeRequests: a?.requests ?? 0,
      afterRequests: b?.requests ?? 0,
    });
  }
  changes.sort(byTransferredImpact<OriginChange>((row) => row.origin));

  return {
    changes,
    newThirdPartyOrigins: changes.filter((row) => row.party === 'third' && row.status === 'added').length,
    unidentifiedThirdPartyOrigins: changes.filter(
      (row) => row.party === 'third' && row.vendor === null && row.afterTransferredBytes > 0,
    ).length,
  };
}
