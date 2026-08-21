/**
 * wcag 2.1 contrast maths, over the design tokens.
 *
 * this exists because "the palette is accessible" is a claim, and a claim in a
 * product that sells accessibility declarations has to be checkable. the token
 * file is the input; test/contrast.test.ts is the policy.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** parses `#rrggbb`, `#rgb`, `rgb(...)` and `rgba(...)`. returns null otherwise. */
export function parseColor(value: string): Rgba | null {
  const input = value.trim();

  if (input.startsWith('#')) {
    const hex = input.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split('')
            .map((char) => char + char)
            .join('')
        : hex;
    if (expanded.length !== 6 || !/^[0-9a-f]{6}$/i.test(expanded)) {
      return null;
    }
    return {
      r: parseInt(expanded.slice(0, 2), 16),
      g: parseInt(expanded.slice(2, 4), 16),
      b: parseInt(expanded.slice(4, 6), 16),
      a: 1,
    };
  }

  const functional = input.match(/^rgba?\(([^)]+)\)$/);
  if (functional === null) {
    return null;
  }
  const parts = functional[1]!.split(',').map((part) => Number.parseFloat(part.trim()));
  if (parts.length < 3 || parts.slice(0, 3).some((part) => Number.isNaN(part))) {
    return null;
  }
  return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: parts[3] ?? 1 };
}

/** flattens a translucent colour onto an opaque one. */
export function compositeOver(foreground: Rgba, background: Rgba): Rgba {
  const a = foreground.a;
  return {
    r: foreground.r * a + background.r * (1 - a),
    g: foreground.g * a + background.g * (1 - a),
    b: foreground.b * a + background.b * (1 - a),
    a: 1,
  };
}

function channel(value: number): number {
  const normalised = value / 255;
  return normalised <= 0.03928 ? normalised / 12.92 : ((normalised + 0.055) / 1.055) ** 2.4;
}

/** wcag relative luminance. */
export function relativeLuminance(color: Rgba): number {
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

/**
 * wcag contrast ratio, 1 to 21. a translucent foreground is flattened onto the
 * background first, which is what a browser does and what a screenshot shows.
 */
export function contrastRatio(foreground: Rgba, background: Rgba): number {
  const front = foreground.a < 1 ? compositeOver(foreground, background) : foreground;
  const lighter = Math.max(relativeLuminance(front), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(front), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

/** wcag 2.1 aa thresholds. */
export const CONTRAST_AA = {
  /** body text below 18.66px bold or 24px regular */
  text: 4.5,
  /** text at or above 18.66px bold or 24px regular */
  largeText: 3,
  /** ui component boundaries and meaningful graphics */
  nonText: 3,
} as const;

/** reads `--name: value;` declarations out of a css file. */
export function parseTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens[match[1]!] = match[2]!.trim();
  }
  return tokens;
}
