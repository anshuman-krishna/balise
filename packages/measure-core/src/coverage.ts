/**
 * code coverage reduced to bytes. pure, like everything else here.
 *
 * two things this is careful about, because both are easy to get quietly
 * wrong and neither is visible once the number reaches a screen:
 *
 * 1. v8 reports nested ranges, and the innermost one containing a character
 *    is the one that decides. an executed function carrying an unexecuted
 *    branch reports the outer range with a count and the inner range with
 *    zero, so summing the ranges with a count credits the branch as executed.
 * 2. coverage offsets are positions in the source text, not bytes. a bundle
 *    with any accented text has more bytes than characters, so the unused
 *    share is measured over the text the offsets actually cut rather than
 *    scaled from a character count.
 *
 * everything here can answer "could not determine". a coverage report that
 * does not describe the source it came with returns null, and the resource is
 * recorded as having no coverage rather than an estimated one.
 */

/** a half-open span of the source text, in characters. */
export interface SourceRange {
  start: number;
  /** exclusive. */
  end: number;
}

/** one entry of v8's precise coverage, as the devtools protocol reports it. */
export interface CoverageFunction {
  ranges: ReadonlyArray<{ startOffset: number; endOffset: number; count: number }>;
}

const encoder = new TextEncoder();

function byteLength(text: string): number {
  return encoder.encode(text).length;
}

/**
 * the ranges v8 says ran, with nesting resolved: a character is executed when
 * the innermost range holding it has a non-zero count. returns null if the
 * report is not a nesting of ranges, which is the only shape this can be read
 * from.
 */
export function executedRanges(functions: readonly CoverageFunction[]): SourceRange[] | null {
  const all = functions.flatMap((entry) => entry.ranges);
  for (const range of all) {
    if (
      !Number.isFinite(range.startOffset) ||
      !Number.isFinite(range.endOffset) ||
      range.startOffset < 0 ||
      range.endOffset < range.startOffset
    ) {
      return null;
    }
  }

  // outermost first at a shared start, so a parent is always pushed before
  // its children.
  const sorted = [...all].sort((a, b) =>
    a.startOffset === b.startOffset ? b.endOffset - a.endOffset : a.startOffset - b.startOffset,
  );

  const executed: SourceRange[] = [];
  const stack: Array<{ end: number; count: number }> = [];
  let cursor = 0;

  const emit = (start: number, end: number, count: number) => {
    if (end <= start || count === 0) return;
    const last = executed[executed.length - 1];
    if (last !== undefined && last.end === start) {
      last.end = end;
      return;
    }
    executed.push({ start, end });
  };

  for (const range of sorted) {
    while (stack.length > 0 && stack[stack.length - 1]!.end <= range.startOffset) {
      const top = stack.pop()!;
      emit(cursor, top.end, top.count);
      cursor = Math.max(cursor, top.end);
    }
    const enclosing = stack[stack.length - 1];
    if (enclosing !== undefined) {
      if (range.endOffset > enclosing.end) {
        // a range crossing its parent's end is not a nesting, and reading it
        // either way would be a guess.
        return null;
      }
      emit(cursor, range.startOffset, enclosing.count);
    }
    cursor = Math.max(cursor, range.startOffset);
    stack.push({ end: range.endOffset, count: range.count });
  }

  while (stack.length > 0) {
    const top = stack.pop()!;
    emit(cursor, top.end, top.count);
    cursor = Math.max(cursor, top.end);
  }

  return executed;
}

/**
 * decoded bytes of `source` outside `executed`. null when a range falls
 * outside the source, which means the report and the text are not the same
 * file and no honest number can come out of the pair.
 */
export function unusedBytes(source: string, executed: readonly SourceRange[]): number | null {
  let used = 0;
  let previousEnd = 0;
  for (const range of [...executed].sort((a, b) => a.start - b.start)) {
    if (range.start < previousEnd || range.end > source.length || range.end < range.start) {
      return null;
    }
    used += byteLength(source.slice(range.start, range.end));
    previousEnd = range.end;
  }
  return byteLength(source) - used;
}

/** the same, from v8's own report. null wherever either half cannot be read. */
export function unusedBytesFromCoverage(
  source: string,
  functions: readonly CoverageFunction[],
): number | null {
  const executed = executedRanges(functions);
  return executed === null ? null : unusedBytes(source, executed);
}
