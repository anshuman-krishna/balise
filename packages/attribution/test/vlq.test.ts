import { describe, expect, it } from 'vitest';
import { decodeMappings, decodeVlqSegment } from '../src/vlq.js';

describe('decodeVlqSegment', () => {
  // hand-computed against the base64 alphabet, not against our own encoder.
  it('decodes single fields', () => {
    expect(decodeVlqSegment('A')).toEqual([0]);
    expect(decodeVlqSegment('C')).toEqual([1]);
    expect(decodeVlqSegment('D')).toEqual([-1]);
    expect(decodeVlqSegment('E')).toEqual([2]);
    // e is 30: the largest digit that does not set the continuation bit.
    expect(decodeVlqSegment('e')).toEqual([15]);
  });

  it('decodes a continued field', () => {
    // g carries the continuation bit with no value bits; B adds 1 at shift 5.
    expect(decodeVlqSegment('gB')).toEqual([16]);
    expect(decodeVlqSegment('hB')).toEqual([-16]);
  });

  it('decodes the four fields of an ordinary segment', () => {
    expect(decodeVlqSegment('AAAA')).toEqual([0, 0, 0, 0]);
    expect(decodeVlqSegment('AACA')).toEqual([0, 0, 1, 0]);
    expect(decodeVlqSegment('CAAC')).toEqual([1, 0, 0, 1]);
  });

  it('refuses an unknown character', () => {
    expect(decodeVlqSegment('A$')).toBeNull();
    expect(decodeVlqSegment(' ')).toBeNull();
  });

  it('refuses a segment cut short after a continuation bit', () => {
    expect(decodeVlqSegment('g')).toBeNull();
    // + is 62, which carries the continuation bit and needs a digit after it.
    expect(decodeVlqSegment('+')).toBeNull();
    expect(decodeVlqSegment('+B')).toEqual([31]);
    expect(decodeVlqSegment('AAg')).toBeNull();
  });
});

describe('decodeMappings', () => {
  it('makes generated columns absolute per line and sources absolute across lines', () => {
    const decoded = decodeMappings('AAAA,CAAC;AACA');
    expect(decoded).not.toBeNull();
    expect(decoded![0]).toEqual([
      { generatedColumn: 0, source: { index: 0, line: 0, column: 0 } },
      { generatedColumn: 1, source: { index: 0, line: 0, column: 1 } },
    ]);
    // the generated column resets on a new line; the source position does not.
    expect(decoded![1]).toEqual([{ generatedColumn: 0, source: { index: 0, line: 1, column: 1 } }]);
  });

  it('keeps empty generated lines', () => {
    expect(decodeMappings(';;')).toEqual([[], [], []]);
  });

  it('reads a one-field segment as generated code with no known origin', () => {
    const decoded = decodeMappings('A');
    expect(decoded![0]).toEqual([{ generatedColumn: 0 }]);
  });

  it('carries the name index only when the segment has five fields', () => {
    const decoded = decodeMappings('AAAAA');
    expect(decoded![0]![0]!.source).toEqual({ index: 0, line: 0, column: 0, nameIndex: 0 });
  });

  it('refuses a segment with two or three fields', () => {
    expect(decodeMappings('AA')).toBeNull();
    expect(decodeMappings('AAA')).toBeNull();
  });

  it('refuses a negative absolute position', () => {
    expect(decodeMappings('D')).toBeNull();
    expect(decodeMappings('AAAA,ADAA')).toBeNull();
  });

  it('returns null rather than a partial decode', () => {
    // the first line is well formed; the second is not. nothing comes back.
    expect(decodeMappings('AAAA;AA$A')).toBeNull();
  });
});
