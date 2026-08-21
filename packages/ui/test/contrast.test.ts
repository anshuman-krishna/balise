import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CONTRAST_AA, contrastRatio, parseColor, parseTokens, type Rgba } from '../src/contrast.js';

const css = readFileSync(fileURLToPath(new URL('../src/tokens.css', import.meta.url)), 'utf8');
const tokens = parseTokens(css);

function color(name: string): Rgba {
  const raw = tokens[name];
  if (raw === undefined) {
    throw new Error(`no token --${name}`);
  }
  const parsed = parseColor(raw);
  if (parsed === null) {
    throw new Error(`token --${name} is "${raw}", which is not a colour this check can read`);
  }
  return parsed;
}

function ratio(foreground: string, background: string): number {
  return contrastRatio(color(foreground), color(background));
}

/**
 * the three backgrounds text sits on. `paper` is the darker of the two light
 * ones, so a foreground that clears paper clears surface too, and both are
 * checked rather than assumed.
 */
const LIGHT_BACKGROUNDS = ['paper', 'surface'] as const;

/**
 * every token used as a text colour on a light background. this list is the
 * policy: adding a colour to the palette and using it for text means adding it
 * here, and if it does not reach 4.5 it does not ship as text.
 *
 * there is no large-text exemption in this product. the instrument register
 * runs from 7.5 px to about 15 px and nothing in it reaches the 24 px the
 * exemption starts at.
 */
const TEXT_ON_LIGHT = [
  'ink',
  'text-secondary',
  'text-tertiary',
  'measured',
  'conforme',
  'caution',
  'breach',
] as const;

/** the same, for the nav rail and any panel on `ink`. */
const TEXT_ON_INK = [
  'paper',
  'on-dark-text',
  'on-dark-muted',
  'measured-on-dark',
  'measured-band-on-dark',
  'breach-on-dark',
  'caution-on-dark',
] as const;

describe('the palette carries its own contrast', () => {
  for (const background of LIGHT_BACKGROUNDS) {
    for (const foreground of TEXT_ON_LIGHT) {
      it(`--${foreground} on --${background} reaches AA for body text`, () => {
        expect(ratio(foreground, background)).toBeGreaterThanOrEqual(CONTRAST_AA.text);
      });
    }
  }

  for (const foreground of TEXT_ON_INK) {
    it(`--${foreground} on --ink reaches AA for body text`, () => {
      expect(ratio(foreground, 'ink')).toBeGreaterThanOrEqual(CONTRAST_AA.text);
    });
  }

  it('the focus ring is visible on both registers', () => {
    // the outline colour on light surfaces and its counterpart on ink. a focus
    // ring is a ui component boundary, so 3.0 is the bar rather than 4.5.
    expect(ratio('measured', 'paper')).toBeGreaterThanOrEqual(CONTRAST_AA.nonText);
    expect(ratio('measured-on-dark', 'ink')).toBeGreaterThanOrEqual(CONTRAST_AA.nonText);
  });

  it('the three status colours are distinguishable from body text, not only from the background', () => {
    // a reader who cannot separate hues still has to be able to tell a breach
    // cell from an ordinary one. this is weaker than a colour-blind-safe claim
    // and it is what the palette actually guarantees: each status differs from
    // ink in luminance as well as in hue.
    for (const status of ['conforme', 'caution', 'breach'] as const) {
      expect(ratio(status, 'ink')).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('contrast maths', () => {
  it('is symmetric', () => {
    expect(ratio('ink', 'paper')).toBeCloseTo(ratio('paper', 'ink'), 10);
  });

  it('gives 21 for black on white and 1 for a colour on itself', () => {
    const black = parseColor('#000000')!;
    const white = parseColor('#ffffff')!;
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 10);
  });

  it('flattens a translucent foreground onto its background', () => {
    // a divider at 7% alpha is nearly the background it sits on, and reporting
    // it as if it were opaque ink would be a ratio nobody sees.
    const divider = color('divider-row');
    const paper = color('paper');
    expect(divider.a).toBeLessThan(1);
    expect(contrastRatio(divider, paper)).toBeLessThan(1.5);
  });

  it('reads every colour token in the file', () => {
    const unreadable = Object.entries(tokens)
      .filter(([, value]) => value.startsWith('#') || value.startsWith('rgb'))
      .filter(([, value]) => parseColor(value) === null)
      .map(([name]) => name);
    expect(unreadable).toEqual([]);
  });
});
