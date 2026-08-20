import { describe, expect, it } from 'vitest';
import { stopCoverage, type CoveragePage } from '../src/coverage.js';

type JsEntry = { url: string; source?: string; functions: Array<{ ranges: Array<{ startOffset: number; endOffset: number; count: number }> }> };
type CssEntry = { url: string; text?: string; ranges: Array<{ start: number; end: number }> };

function page(js: JsEntry[], css: CssEntry[] = []): CoveragePage {
  return {
    coverage: {
      startJSCoverage: async () => undefined,
      startCSSCoverage: async () => undefined,
      stopJSCoverage: async () => js,
      stopCSSCoverage: async () => css,
    },
  };
}

const ran = (start: number, end: number, count: number) => ({
  ranges: [{ startOffset: start, endOffset: end, count }],
});

describe('stopCoverage', () => {
  it('credits unused decoded bytes to the url they belong to', async () => {
    const unused = await stopCoverage(
      page([{ url: 'https://sevre-et-loire.fr/app.js', source: 'a'.repeat(100), functions: [ran(0, 40, 1)] }]),
    );
    expect(unused.get('https://sevre-et-loire.fr/app.js')).toBe(60);
  });

  it('reads a stylesheet from the ranges that were used', async () => {
    const unused = await stopCoverage(
      page([], [{ url: 'https://sevre-et-loire.fr/a.css', text: 'a'.repeat(50), ranges: [{ start: 0, end: 20 }] }]),
    );
    expect(unused.get('https://sevre-et-loire.fr/a.css')).toBe(30);
  });

  it('records a report with no source as unavailable, never as fully used', async () => {
    const unused = await stopCoverage(page([{ url: 'https://sevre-et-loire.fr/app.js', functions: [ran(0, 40, 1)] }]));
    expect(unused.get('https://sevre-et-loire.fr/app.js')).toBeNull();
  });

  it('keeps a url unavailable once any of its reports could not be read', async () => {
    const unused = await stopCoverage(
      page([
        { url: 'https://sevre-et-loire.fr/app.js', source: 'a'.repeat(100), functions: [ran(0, 40, 1)] },
        { url: 'https://sevre-et-loire.fr/app.js', functions: [ran(0, 10, 1)] },
      ]),
    );
    expect(unused.get('https://sevre-et-loire.fr/app.js')).toBeNull();
  });

  it('sums two readable reports for one url', async () => {
    const unused = await stopCoverage(
      page([
        { url: 'https://sevre-et-loire.fr/app.js', source: 'a'.repeat(100), functions: [ran(0, 40, 1)] },
        { url: 'https://sevre-et-loire.fr/app.js', source: 'a'.repeat(10), functions: [ran(0, 4, 1)] },
      ]),
    );
    expect(unused.get('https://sevre-et-loire.fr/app.js')).toBe(66);
  });

  it('drops an anonymous script rather than crediting it to the page', async () => {
    const unused = await stopCoverage(page([{ url: '', source: 'a'.repeat(100), functions: [ran(0, 40, 1)] }]));
    expect(unused.size).toBe(0);
  });
});
