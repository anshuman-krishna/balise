/**
 * colours balise.yml for the file view. purely presentational: it never parses
 * and never decides anything, so a line it does not understand renders as plain
 * text rather than wrongly. the reader in @balise/budgets is what actually
 * reads the file.
 */

export interface YamlSegment {
  text: string;
  /** c for a comment, v for a value. anything else is plain. */
  k?: 'c' | 'v';
}

/** a colon that ends a key: followed by a space or by the end of the line. */
const KEY_COLON = /:(?=\s|$)/;
const FLOW_SPLIT = /([{}[\],]|:(?=\s|$)|\s+)/;

function push(out: YamlSegment[], text: string, kind?: 'c' | 'v'): void {
  if (text.length === 0) return;
  out.push(kind === undefined ? { text } : { text, k: kind });
}

/**
 * inside a value, a token followed by a key colon is a key and everything else
 * is a value. that one rule covers plain scalars, flow mappings and flow
 * sequences without a parser.
 */
function valueSegments(text: string): YamlSegment[] {
  const parts = text.split(FLOW_SPLIT).filter((part) => part !== undefined && part !== '');
  const out: YamlSegment[] = [];

  parts.forEach((part, index) => {
    if (/^[{}[\],:]$/.test(part) || part.trim().length === 0) {
      push(out, part);
      return;
    }
    const next = parts.slice(index + 1).find((candidate) => candidate.trim().length > 0);
    push(out, part, next === ':' ? undefined : 'v');
  });

  return out;
}

function stripComment(line: string): { code: string; comment: string } {
  const at = line.search(/(^|\s)#/);
  return at < 0 ? { code: line, comment: '' } : { code: line.slice(0, at), comment: line.slice(at) };
}

export function highlightYamlLine(line: string): YamlSegment[] {
  if (line.trim().length === 0) return [];
  if (line.trimStart().startsWith('#')) return [{ text: line, k: 'c' }];

  const { code, comment } = stripComment(line);
  const out: YamlSegment[] = [];
  const colon = code.search(KEY_COLON);

  if (colon < 0) {
    out.push(...valueSegments(code));
  } else {
    push(out, code.slice(0, colon + 1));
    out.push(...valueSegments(code.slice(colon + 1)));
  }

  push(out, comment, 'c');
  return out;
}

export function highlightYaml(source: string): YamlSegment[][] {
  return source.replace(/\n$/, '').split('\n').map(highlightYamlLine);
}
