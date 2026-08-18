// base64 vlq, as used by the source map v3 mappings field. written here rather
// than taken from a dependency: this package explains someone else's build to
// an auditor, and forty lines of decoder is a smaller thing to defend than a
// transitive tree.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const VALUES = new Int16Array(128).fill(-1);
for (let index = 0; index < ALPHABET.length; index += 1) {
  VALUES[ALPHABET.charCodeAt(index)] = index;
}

const CONTINUATION = 0b100000;
const MASK = 0b011111;
const SHIFT = 5;

// the largest magnitude a well-formed field can carry. anything past it is a
// malformed segment, not a very large column.
const MAX_MAGNITUDE = 2 ** 31;

/**
 * decode one comma-free segment into its fields. returns null on anything
 * malformed: an unknown character, a continuation bit with nothing after it,
 * or a field too large to be a position.
 */
export function decodeVlqSegment(segment: string): number[] | null {
  const fields: number[] = [];
  let accumulator = 0;
  let shift = 0;
  let open = false;

  for (let index = 0; index < segment.length; index += 1) {
    const code = segment.charCodeAt(index);
    const digit = code < 128 ? VALUES[code]! : -1;
    if (digit < 0) return null;

    accumulator += (digit & MASK) * 2 ** shift;
    if (accumulator > MAX_MAGNITUDE * 2) return null;

    if ((digit & CONTINUATION) === 0) {
      const negative = accumulator % 2 === 1;
      const magnitude = (accumulator - (negative ? 1 : 0)) / 2;
      if (magnitude > MAX_MAGNITUDE) return null;
      fields.push(negative ? -magnitude : magnitude);
      accumulator = 0;
      shift = 0;
      open = false;
    } else {
      shift += SHIFT;
      open = true;
    }
  }

  // a trailing continuation bit means the segment was cut short.
  if (open) return null;
  return fields;
}

/** one entry of the mappings field, already made absolute. */
export interface MappingSegment {
  generatedColumn: number;
  /** absent for a one-field segment: generated code with no known origin. */
  source?: {
    index: number;
    line: number;
    column: number;
    nameIndex?: number;
  };
}

/** segments per generated line, in the order the line lists them. */
export type DecodedMappings = MappingSegment[][];

/**
 * decode a whole mappings field. returns null rather than a partial result:
 * a mappings string we cannot read completely is reported as unreadable, and
 * the bytes it would have explained stay unexplained.
 */
export function decodeMappings(mappings: string): DecodedMappings | null {
  const lines: DecodedMappings = [];
  let sourceIndex = 0;
  let sourceLine = 0;
  let sourceColumn = 0;
  let nameIndex = 0;

  for (const rawLine of mappings.split(';')) {
    const segments: MappingSegment[] = [];
    let generatedColumn = 0;

    if (rawLine.length > 0) {
      for (const rawSegment of rawLine.split(',')) {
        const fields = decodeVlqSegment(rawSegment);
        if (fields === null) return null;
        if (fields.length !== 1 && fields.length !== 4 && fields.length !== 5) return null;

        generatedColumn += fields[0]!;
        if (generatedColumn < 0) return null;

        if (fields.length === 1) {
          segments.push({ generatedColumn });
          continue;
        }

        sourceIndex += fields[1]!;
        sourceLine += fields[2]!;
        sourceColumn += fields[3]!;
        if (sourceIndex < 0 || sourceLine < 0 || sourceColumn < 0) return null;

        const source: NonNullable<MappingSegment['source']> = {
          index: sourceIndex,
          line: sourceLine,
          column: sourceColumn,
        };

        if (fields.length === 5) {
          nameIndex += fields[4]!;
          if (nameIndex < 0) return null;
          source.nameIndex = nameIndex;
        }

        segments.push({ generatedColumn, source });
      }
    }

    lines.push(segments);
  }

  return lines;
}
