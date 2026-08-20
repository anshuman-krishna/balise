import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MetricTile } from './MetricTile';

// invariant 1 is a rendering rule, so it is tested by rendering. a tile is the
// densest surface in the product and the easiest place to lose a model version
// to a more urgent-looking line.
const BAND = {
  scaleMin: 0,
  scaleMax: 1,
  median: 0.5,
  bandLow: 0.4,
  bandHigh: 0.6,
  referenceModel: { id: 'swd', version: '0.1.0' },
  confidence: 'high' as const,
  unitLabel: 'gCO2e',
};

function render(stateMessage?: { text: string; tone: 'breach' | 'caution' }) {
  return renderToStaticMarkup(
    <MetricTile
      label="CARBON / VISIT"
      valueText="0.076"
      unitText="gCO2e"
      confidence="high"
      confidenceLabel="HIGH"
      band={BAND}
      provenance="swd@0.1.0 · reference · band = 2 models · grid 56 gCO2e/kWh (FR)"
      {...(stateMessage === undefined ? {} : { stateMessage })}
    />,
  );
}

describe('a metric tile', () => {
  it('names the model and version under the figure', () => {
    expect(render()).toContain('swd@0.1.0');
  });

  it('keeps naming them when a state message is also shown', () => {
    const html = render({ text: 'ecoindex E · 29/100', tone: 'caution' });
    expect(html).toContain('ecoindex E · 29/100');
    // the alert is additional, never a replacement for the provenance line.
    expect(html).toContain('swd@0.1.0');
  });

  it('draws the band rather than describing it', () => {
    expect(render()).toContain('<svg');
  });
});
