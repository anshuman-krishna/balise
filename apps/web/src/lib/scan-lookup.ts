export type ScanLookup = { status: 'measured' } | { status: 'no-record'; domain: string };

/** strips what a person types around a domain: scheme, www, path, case. */
export function normaliseDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '');
}

/**
 * the free scan shows a measurement only where one was taken. a domain we
 * hold no capture for gets the no-record state, never an estimate inferred
 * from the name.
 */
export function lookupScan(input: string, measuredDomain: string): ScanLookup {
  const domain = normaliseDomain(input);
  return domain === normaliseDomain(measuredDomain)
    ? { status: 'measured' }
    : { status: 'no-record', domain };
}
