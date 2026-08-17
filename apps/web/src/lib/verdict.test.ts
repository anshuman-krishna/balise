import { describe, expect, it } from 'vitest';
import { verdictKeyFor } from './verdict';

describe('verdictKeyFor', () => {
  it('marks a significant regression over a threshold as breach', () => {
    expect(verdictKeyFor('regression', true)).toBe('breach');
  });

  it('marks a significant regression under the threshold as real', () => {
    expect(verdictKeyFor('regression', false)).toBe('real');
  });

  it('marks a significant improvement as real, never as breach', () => {
    expect(verdictKeyFor('improvement', false)).toBe('real');
    expect(verdictKeyFor('improvement', true)).toBe('real');
  });

  it('never upgrades a sub-floor delta, even over a threshold', () => {
    expect(verdictKeyFor('no-significant-change', true)).toBe('noSig');
    expect(verdictKeyFor('no-significant-change', false)).toBe('noSig');
  });

  it('keeps indeterminate indeterminate', () => {
    expect(verdictKeyFor('indeterminate', true)).toBe('indeterminate');
  });
});
