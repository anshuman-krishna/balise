import type { Unit } from './metrics.js';

/**
 * display formatting, applied at the edge only. stored values stay raw
 * (invariant 6). this lives beside `Unit` rather than in a surface, because a
 * measurement has to read the same on the screen, in the check comment and in
 * a document. two implementations of "842 KB" is how they start to disagree.
 *
 * screen register: period decimals, narrow no-break space thousands. the
 * document register (french comma decimals) arrives with the document pipeline.
 */

export const NARROW_NBSP = ' ';

export function formatInt(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP);
  return sign + grouped;
}

export function formatNumber(value: number, decimals: number): string {
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart = '0', fracPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP);
  const sign = value < 0 ? '-' : '';
  return fracPart !== undefined ? `${sign}${grouped}.${fracPart}` : `${sign}${grouped}`;
}

export function formatSigned(value: number, decimals = 0): string {
  const body = formatNumber(Math.abs(value), decimals);
  return value >= 0 ? `+${body}` : `-${body}`;
}

/**
 * below ten kilobytes a whole-kilobyte figure throws away most of what was
 * measured: a 7 380 byte noise floor and a 7 490 byte one both read "7 KB",
 * and the same number then disagrees with itself between a chart that keeps a
 * decimal and a document that does not. so one decimal under 10 KB, whole
 * kilobytes above it, which leaves at least two significant figures anywhere
 * the unit is kilobytes.
 */
const KB_DECIMAL_BELOW = 10_000;

function kilobytes(value: number): string {
  return Math.abs(value) < KB_DECIMAL_BELOW
    ? formatNumber(value / 1_000, 1)
    : formatInt(value / 1_000);
}

/**
 * a measured value with its unit. bytes are stored in bytes and shown in
 * kilobytes past a thousand, because a page weight in bytes is unreadable and
 * a delta of 840 bytes is not. the unit is always written out: a bare number
 * is not a measurement.
 */
export function formatMeasured(value: number, unit: Unit): string {
  switch (unit) {
    case 'bytes':
      return Math.abs(value) < 1_000 ? `${formatInt(value)} B` : `${kilobytes(value)} KB`;
    case 'pct':
      return `${formatNumber(value, 1)} %`;
    case 'ms':
      return `${formatInt(value)} ms`;
    default:
      return formatInt(value);
  }
}

/** the same, signed, for a delta. a percentage delta is in points. */
export function formatMeasuredSigned(value: number, unit: Unit): string {
  switch (unit) {
    case 'bytes':
      return Math.abs(value) < 1_000
        ? `${formatSigned(value)} B`
        : `${formatSigned(value / 1_000, Math.abs(value) < KB_DECIMAL_BELOW ? 1 : 0)} KB`;
    case 'pct':
      return `${formatSigned(value, 1)} pt`;
    case 'ms':
      return `${formatSigned(value)} ms`;
    default:
      return formatSigned(value);
  }
}
