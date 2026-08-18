// builds a bundle and a real source map v3 for it. the vlq encoder here is
// written independently of the decoder under test, and the expected byte counts
// are computed with TextEncoder rather than with the package's own counter, so
// a test failure means the package is wrong and not that both sides agree.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeVlq(value: number): string {
  let remaining = value < 0 ? (-value << 1) + 1 : value << 1;
  let out = '';
  do {
    let digit = remaining & 0b11111;
    remaining >>>= 5;
    if (remaining > 0) digit |= 0b100000;
    out += ALPHABET[digit];
  } while (remaining > 0);
  return out;
}

const encoder = new TextEncoder();

export function byteLength(text: string): number {
  return encoder.encode(text).length;
}

export interface FixtureModule {
  source: string;
  code: string;
}

export interface FixtureBundle {
  url: string;
  content: string;
  sourceMap: string;
  /** utf-8 bytes each source should be credited with, newline included. */
  expectedBytes: Record<string, number>;
  expectedUnattributed: number;
}

export interface BuildOptions {
  prelude?: string;
  epilogue?: string;
  sourceRoot?: string;
}

/**
 * one unmapped prelude line, one line holding every module end to end, one
 * unmapped epilogue line. the middle line is the case that matters: the
 * modules are separated by column arithmetic only, which is what a minified
 * bundle looks like.
 */
export function buildBundle(
  url: string,
  modules: readonly FixtureModule[],
  options: BuildOptions = {},
): FixtureBundle {
  const prelude = options.prelude ?? '(function(){';
  const epilogue = options.epilogue ?? '})();';

  let code = '';
  const columns: number[] = [];
  for (const module of modules) {
    columns.push(code.length);
    code += module.code;
  }
  const content = `${prelude}\n${code}\n${epilogue}`;

  let previousColumn = 0;
  let previousSource = 0;
  const segments = modules.map((_, index) => {
    const column = columns[index]!;
    const fields = [
      encodeVlq(column - previousColumn),
      encodeVlq(index - previousSource),
      encodeVlq(0),
      encodeVlq(0),
    ].join('');
    previousColumn = column;
    previousSource = index;
    return fields;
  });

  const sourceMap = JSON.stringify({
    version: 3,
    file: url.split('/').pop(),
    ...(options.sourceRoot === undefined ? {} : { sourceRoot: options.sourceRoot }),
    sources: modules.map((module) => module.source),
    names: [],
    // line 0 is the prelude, line 2 the epilogue: both unmapped.
    mappings: `;${segments.join(',')};`,
  });

  const expectedBytes: Record<string, number> = {};
  modules.forEach((module, index) => {
    // the newline that ends the module line belongs to the last segment on it.
    const terminator = index === modules.length - 1 ? 1 : 0;
    expectedBytes[module.source] = (expectedBytes[module.source] ?? 0) + byteLength(module.code) + terminator;
  });

  return {
    url,
    content,
    sourceMap,
    expectedBytes,
    expectedUnattributed: byteLength(prelude) + 1 + byteLength(epilogue),
  };
}
