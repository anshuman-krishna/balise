import type { AttributionUnavailableReason } from '@balise/schemas';
import { decodeMappings, type DecodedMappings } from './vlq.js';

// some servers prefix a source map with an xssi guard. it is part of the
// convention, so it is stripped rather than treated as a parse failure.
const XSSI_PREFIX = ")]}'";

export interface ParsedSourceMap {
  sources: readonly (string | null)[];
  sourceRoot: string | null;
  mappings: DecodedMappings;
}

export type SourceMapResult =
  | { readonly status: 'parsed'; readonly map: ParsedSourceMap }
  | { readonly status: 'unavailable'; readonly reason: AttributionUnavailableReason; readonly detail?: string };

function unavailable(reason: AttributionUnavailableReason, detail?: string): SourceMapResult {
  return detail === undefined ? { status: 'unavailable', reason } : { status: 'unavailable', reason, detail };
}

function toObject(input: unknown): Record<string, unknown> | null {
  if (typeof input === 'string') {
    const text = input.startsWith(XSSI_PREFIX) ? input.slice(input.indexOf('\n') + 1) : input;
    try {
      // json from the customer's build output. the shape is checked below.
      const parsed: unknown = JSON.parse(text);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return null;
}

/**
 * read a source map far enough to attribute bytes with it. anything we cannot
 * read completely comes back as a reason, never as a partial map: a half-read
 * map would attribute half the bytes and look like a finding.
 */
export function parseSourceMap(input: unknown): SourceMapResult {
  if (input === undefined || input === null || input === '') return unavailable('no-source-map');

  const raw = toObject(input);
  if (raw === null) return unavailable('source-map-unreadable');

  // an index map lists sections, each with its own map. supporting it means
  // offsetting every section's mappings, which is not written yet, so it is
  // named rather than silently half-handled.
  if (Array.isArray(raw['sections'])) return unavailable('source-map-index-map');

  if (raw['version'] !== 3) {
    return unavailable('source-map-unsupported-version', String(raw['version']));
  }

  const sources = raw['sources'];
  if (!Array.isArray(sources) || sources.some((entry) => typeof entry !== 'string' && entry !== null)) {
    return unavailable('source-map-unreadable', 'sources');
  }

  const mappings = raw['mappings'];
  if (typeof mappings !== 'string') return unavailable('source-map-unreadable', 'mappings');
  if (mappings.length === 0) return unavailable('source-map-mappings-empty');

  const decoded = decodeMappings(mappings);
  if (decoded === null) return unavailable('source-map-mappings-malformed');

  const sourceRoot = typeof raw['sourceRoot'] === 'string' && raw['sourceRoot'].length > 0 ? raw['sourceRoot'] : null;

  return {
    status: 'parsed',
    map: { sources: sources as readonly (string | null)[], sourceRoot, mappings: decoded },
  };
}

/** join a source map's sourceRoot to one of its sources, per the v3 spec. */
export function applySourceRoot(sourceRoot: string | null, source: string): string {
  if (sourceRoot === null) return source;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(source) || source.startsWith('/')) return source;
  return sourceRoot.endsWith('/') ? `${sourceRoot}${source}` : `${sourceRoot}/${source}`;
}
