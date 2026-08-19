import type { AttributionUnavailableReason, BundleAttribution, SourceBytes } from '@balise/schemas';
import { applySourceRoot, parseSourceMap } from './source-map.js';
import { normaliseSourcePath } from './modules.js';

export interface BundleInput {
  url: string;
  /** the decoded text exactly as served. absent when we did not keep it. */
  content?: string | null;
  /** the source map, as json text or already parsed. absent when there is none. */
  sourceMap?: unknown;
}

/**
 * utf-8 byte length of a slice, without allocating the slice. source map
 * columns are utf-16 code units, so the range is taken in code units and the
 * byte cost is counted from it.
 */
export function utf8LengthRange(text: string, start: number, end: number): number {
  let bytes = 0;
  for (let index = start; index < end; index += 1) {
    const code = text.charCodeAt(index);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < end) {
      const low = text.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

export function utf8Length(text: string): number {
  return utf8LengthRange(text, 0, text.length);
}

function unavailable(url: string, reason: AttributionUnavailableReason, detail?: string): BundleAttribution {
  return detail === undefined ? { status: 'unavailable', url, reason } : { status: 'unavailable', url, reason, detail };
}

interface Accumulated {
  bytes: number;
  rawPath: string;
  /** 1-based, and null until a segment attributes a byte to this source. */
  firstLine: number | null;
  lastLine: number | null;
}

/**
 * attribute a bundle's decoded bytes to the source files its map names.
 *
 * a mapping segment owns the generated text from its own column to the start
 * of the next segment, and the last segment on a line owns the line ending.
 * bytes no segment covers (bundler prelude, runtime, banners) are counted as
 * unattributed and reported as such: they are never spread across the sources
 * to make the columns add up.
 */
export function attributeBundle(input: BundleInput): BundleAttribution {
  const parsed = parseSourceMap(input.sourceMap);
  if (parsed.status === 'unavailable') return unavailable(input.url, parsed.reason, parsed.detail);

  if (input.content === undefined || input.content === null) {
    return unavailable(input.url, 'bundle-content-unavailable');
  }

  const { sources, sourceRoot, mappings } = parsed.map;
  const lines = input.content.split('\n');

  const lastMapped = mappings.reduce((last, segments, index) => (segments.length > 0 ? index : last), -1);
  if (lastMapped >= lines.length) return unavailable(input.url, 'source-map-content-mismatch', 'line');

  const accumulated = new Map<string, Accumulated>();
  let attributedBytes = 0;
  let unattributedBytes = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]!;
    // the newline we split on is a byte of the file and belongs to the last
    // segment of the line it ends.
    const terminator = lineIndex < lines.length - 1 ? 1 : 0;
    const segments = mappings[lineIndex] ?? [];

    if (segments.length === 0) {
      unattributedBytes += utf8LengthRange(line, 0, line.length) + terminator;
      continue;
    }

    for (let index = 1; index < segments.length; index += 1) {
      if (segments[index]!.generatedColumn < segments[index - 1]!.generatedColumn) {
        return unavailable(input.url, 'source-map-mappings-malformed', 'unsorted');
      }
    }
    if (segments[segments.length - 1]!.generatedColumn > line.length) {
      return unavailable(input.url, 'source-map-content-mismatch', 'column');
    }

    unattributedBytes += utf8LengthRange(line, 0, segments[0]!.generatedColumn);

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]!;
      const next = segments[index + 1];
      const end = next === undefined ? line.length : next.generatedColumn;
      const bytes =
        utf8LengthRange(line, segment.generatedColumn, end) + (next === undefined ? terminator : 0);

      if (segment.source === undefined) {
        unattributedBytes += bytes;
        continue;
      }
      if (segment.source.index >= sources.length) {
        return unavailable(input.url, 'source-map-source-out-of-range', String(segment.source.index));
      }
      const named = sources[segment.source.index];
      if (named === null || named === undefined) {
        // the map admits it does not know where this came from.
        unattributedBytes += bytes;
        continue;
      }

      const rawPath = applySourceRoot(sourceRoot, named);
      const { path } = normaliseSourcePath(rawPath);
      // source maps count original lines from zero; an editor counts from one.
      // a segment that carries no byte is a position the bundle took nothing
      // from, so it does not widen the span.
      const originalLine = bytes > 0 ? segment.source.line + 1 : null;
      const entry = accumulated.get(path);
      if (entry === undefined) {
        accumulated.set(path, { bytes, rawPath, firstLine: originalLine, lastLine: originalLine });
      } else {
        entry.bytes += bytes;
        // two raw spellings can normalise to one module. the smallest is kept
        // so the reported raw path does not depend on walk order.
        if (rawPath < entry.rawPath) entry.rawPath = rawPath;
        if (originalLine !== null) {
          entry.firstLine = entry.firstLine === null ? originalLine : Math.min(entry.firstLine, originalLine);
          entry.lastLine = entry.lastLine === null ? originalLine : Math.max(entry.lastLine, originalLine);
        }
      }
      attributedBytes += bytes;
    }
  }

  const sourceBytes: SourceBytes[] = [...accumulated.entries()]
    .map(([path, entry]) => ({
      path,
      rawPath: entry.rawPath,
      packageName: normaliseSourcePath(path).packageName,
      bytes: entry.bytes,
      span:
        entry.firstLine === null || entry.lastLine === null
          ? null
          : { firstLine: entry.firstLine, lastLine: entry.lastLine },
    }))
    .sort((a, b) => (b.bytes !== a.bytes ? b.bytes - a.bytes : a.path.localeCompare(b.path)));

  return {
    status: 'resolved',
    url: input.url,
    totalBytes: attributedBytes + unattributedBytes,
    sources: sourceBytes,
    unattributedBytes,
  };
}
