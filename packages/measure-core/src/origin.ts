/**
 * first party or third. one implementation, because the third-party metric and
 * the resource inventory that explains it must not disagree about which
 * resources they are counting.
 */

export function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * unparsable urls and opaque origins (data:, about:, blob:) have no network
 * host of their own; they count as first party rather than being guessed at.
 * an opaque origin serializes to the string "null".
 */
export function isThirdParty(url: string, serviceOrigin: string): boolean {
  const origin = originOf(url);
  return origin !== null && origin !== 'null' && origin !== serviceOrigin;
}

export function requireOrigin(url: string): string {
  const origin = originOf(url);
  if (origin === null) {
    throw new Error(`serviceOrigin is not a valid URL: ${url}`);
  }
  return origin;
}
