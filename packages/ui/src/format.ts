// Display formatting, applied at the edge only. Stored values stay raw
// (invariant 6). Screen register: period decimals, narrow no-break space
// thousands. The document register (French comma decimals) arrives with the
// document pipeline.

export const NARROW_NBSP = ' ';

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
