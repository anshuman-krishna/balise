/**
 * canonical json. the same facts must always produce the same bytes, or the
 * same entry hashes differently depending on how it happened to be built and
 * the chain becomes unverifiable.
 *
 * the rules, all of which matter:
 * - object keys are sorted by code unit, at every depth
 * - arrays keep their order, because order is data
 * - undefined is not representable and is dropped from objects, but inside an
 *   array it would shift every later element, so it is refused there
 * - numbers must be finite: NaN and Infinity have no json form
 * - -0 serialises as 0, so it cannot hash differently from 0
 */
export function canonicalise(value: unknown): string {
  return write(value, []);
}

function write(value: unknown, path: readonly string[]): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`cannot canonicalise a non-finite number at ${describe(path)}`);
    }
    return JSON.stringify(value === 0 ? 0 : value);
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((item, index) => {
      if (item === undefined) {
        throw new Error(`cannot canonicalise undefined inside an array at ${describe([...path, String(index)])}`);
      }
      return write(item, [...path, String(index)]);
    });
    return `[${items.join(',')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, item]) => `${JSON.stringify(key)}:${write(item, [...path, key])}`);
    return `{${entries.join(',')}}`;
  }
  throw new Error(`cannot canonicalise a ${typeof value} at ${describe(path)}`);
}

function describe(path: readonly string[]): string {
  return path.length === 0 ? '(root)' : path.join('.');
}
