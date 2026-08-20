import { describe, expect, it } from 'vitest';
import {
  executedRanges,
  unusedBytes,
  unusedBytesFromCoverage,
  type CoverageFunction,
} from '../src/coverage.js';

const fn = (...ranges: Array<[number, number, number]>): CoverageFunction => ({
  ranges: ranges.map(([startOffset, endOffset, count]) => ({ startOffset, endOffset, count })),
});

describe('executedRanges', () => {
  it('reports a function that ran as executed end to end', () => {
    expect(executedRanges([fn([0, 100, 1])])).toEqual([{ start: 0, end: 100 }]);
  });

  it('reports a function that never ran as nothing', () => {
    expect(executedRanges([fn([0, 100, 0])])).toEqual([]);
  });

  it('subtracts an unexecuted branch from the function that contains it', () => {
    // v8 reports the outer range with a count and the inner branch with zero.
    // summing the ranges that carry a count would credit the branch as run.
    expect(executedRanges([fn([0, 100, 3], [40, 60, 0])])).toEqual([
      { start: 0, end: 40 },
      { start: 60, end: 100 },
    ]);
  });

  it('re-executes after a nested block that did run', () => {
    expect(executedRanges([fn([0, 100, 1], [40, 60, 2])])).toEqual([{ start: 0, end: 100 }]);
  });

  it('keeps two functions apart', () => {
    expect(executedRanges([fn([0, 50, 1]), fn([50, 100, 0])])).toEqual([{ start: 0, end: 50 }]);
  });

  it('handles three levels of nesting', () => {
    expect(executedRanges([fn([0, 100, 1], [20, 80, 0], [40, 60, 5])])).toEqual([
      { start: 0, end: 20 },
      { start: 40, end: 60 },
      { start: 80, end: 100 },
    ]);
  });

  it('returns null on a range that crosses out of its parent', () => {
    expect(executedRanges([fn([0, 50, 1], [40, 90, 1])])).toBeNull();
  });

  it('returns null on a negative or inverted range', () => {
    expect(executedRanges([fn([-1, 50, 1])])).toBeNull();
    expect(executedRanges([fn([50, 10, 1])])).toBeNull();
  });

  it('reports an empty report as nothing executed rather than as unreadable', () => {
    expect(executedRanges([])).toEqual([]);
  });
});

describe('unusedBytes', () => {
  it('counts the text outside the executed ranges', () => {
    const source = 'a'.repeat(100);
    expect(unusedBytes(source, [{ start: 0, end: 40 }])).toBe(60);
  });

  it('counts bytes, not characters', () => {
    // "é" is one character and two bytes. a coverage offset is a position in
    // the text, so scaling a character count would under-report every bundle
    // carrying accented strings.
    const source = 'é'.repeat(10);
    expect(source.length).toBe(10);
    expect(unusedBytes(source, [])).toBe(20);
    expect(unusedBytes(source, [{ start: 0, end: 5 }])).toBe(10);
  });

  it('returns null when a range runs past the end of the source', () => {
    expect(unusedBytes('short', [{ start: 0, end: 500 }])).toBeNull();
  });

  it('returns null on overlapping ranges rather than double-counting them', () => {
    expect(
      unusedBytes('a'.repeat(100), [
        { start: 0, end: 60 },
        { start: 40, end: 100 },
      ]),
    ).toBeNull();
  });

  it('reports the whole source as unused when nothing ran', () => {
    expect(unusedBytes('a'.repeat(100), [])).toBe(100);
  });
});

describe('unusedBytesFromCoverage', () => {
  it('reads a v8 report end to end', () => {
    expect(unusedBytesFromCoverage('a'.repeat(100), [fn([0, 100, 1], [40, 60, 0])])).toBe(20);
  });

  it('degrades to null rather than to a plausible number', () => {
    expect(unusedBytesFromCoverage('a'.repeat(100), [fn([0, 50, 1], [40, 90, 1])])).toBeNull();
    expect(unusedBytesFromCoverage('short', [fn([0, 100, 1])])).toBeNull();
  });
});
