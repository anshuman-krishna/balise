import { describe, expect, it } from 'vitest';
import { renderBandSvg } from '../src/svg.js';
import { BAND_LAYOUTS, xPosition } from '../src/geometry.js';
import type { ToleranceBandProps } from '../src/ToleranceBand.js';

const PROPS: ToleranceBandProps = {
  size: 'canonical',
  scaleMin: 0,
  scaleMax: 4,
  median: 1.84,
  bandLow: 1.42,
  bandHigh: 2.31,
  noiseLow: 1.75,
  noiseHigh: 1.93,
  referenceModel: { id: 'swd', version: '4.0.2' },
  confidence: 'high',
  unitLabel: 'gCO₂e / visit',
};

describe('the band as a standalone document', () => {
  const svg = renderBandSvg(PROPS);

  it('declares its namespace, so a file viewer and github both render it', () => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" ')).toBe(true);
  });

  it('produces the same bytes for the same input', () => {
    // the document hash goes in the ledger. a rendering that differs between
    // two runs of the same inputs would make that hash meaningless.
    expect(renderBandSvg(PROPS)).toBe(svg);
  });

  it('places the median where the shared geometry puts it, not where a second renderer would', () => {
    const layout = BAND_LAYOUTS.canonical;
    const x = xPosition(
      { domainMin: 0, domainMax: 4, rangeMin: layout.plotLeft, rangeMax: layout.plotRight },
      1.84,
    );
    expect(svg).toContain(`x1="${x}"`);
  });

  it('carries the reference model and the confidence in its accessible label', () => {
    expect(svg).toContain('reference swd@4.0.2');
    expect(svg).toContain('confidence high');
  });

  it('reaches for nothing outside itself', () => {
    expect(svg).not.toContain('<script');
    // the only url in the document is its own namespace declaration
    expect(svg.replace('xmlns="http://www.w3.org/2000/svg"', '')).not.toMatch(/https?:\/\//);
  });

  it('labels an axis without floating point noise', () => {
    expect(svg).toContain('>2.4<');
    expect(svg).not.toContain('2.4000000000000004');
  });

  it('gives the print register a stable pattern id rather than a generated one', () => {
    const print = renderBandSvg({ ...PROPS, register: 'print' });
    expect(print).toContain('id="b0-hatch"');
    expect(print).toContain('url(#b0-hatch)');
    expect(print).toBe(renderBandSvg({ ...PROPS, register: 'print' }));
  });

  it('adds a title only when one is asked for', () => {
    expect(svg).not.toContain('<title>');
    expect(renderBandSvg(PROPS, { title: 'carbon per visit' })).toContain('<title>carbon per visit</title>');
  });
});
