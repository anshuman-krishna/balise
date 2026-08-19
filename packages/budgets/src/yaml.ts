/**
 * a reader for the documented subset of yaml that balise.yml uses.
 *
 * it exists so that this package has no parser dependency, and so that the
 * failure mode is a refusal rather than a misreading. anything outside the
 * subset is reported by name with its line number: anchors, aliases, tags,
 * block scalars, merge keys, multiple documents and tab indentation are all
 * refused rather than half-understood. a config file that decides whether a
 * build fails is not a place for a parser to guess.
 *
 * the subset is: comments, `key: value` mappings nested by indentation,
 * sequences of scalars or mappings, single-line flow mappings and flow
 * sequences, and scalars that are plain, single quoted or double quoted.
 */

export type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

export interface YamlIssue {
  line: number;
  path: string;
  message: string;
}

export type YamlResult =
  | { status: 'ok'; value: YamlValue; lines: ReadonlyMap<string, number> }
  | { status: 'invalid'; issues: YamlIssue[] };

class YamlRefusal extends Error {
  readonly line: number;
  readonly path: string;

  // fields are assigned rather than declared as parameter properties: node
  // strips types without transforming, and this file is read that way.
  constructor(line: number, path: string, message: string) {
    super(message);
    this.line = line;
    this.path = path;
  }
}

interface PhysicalLine {
  indent: number;
  text: string;
  line: number;
}

const KEY_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;

/** removes a trailing comment, leaving anything inside quotes alone. */
function stripComment(raw: string): string {
  let quote: '"' | "'" | null = null;
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index]!;
    if (quote !== null) {
      if (char === '\\' && quote === '"') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    // a hash opens a comment only at the start of the line or after a space,
    // so a url fragment or a css colour inside a value survives.
    if (char === '#' && (index === 0 || raw[index - 1] === ' ' || raw[index - 1] === '\t')) {
      return raw.slice(0, index);
    }
  }
  return raw;
}

function scan(source: string): PhysicalLine[] {
  const out: PhysicalLine[] = [];
  const lines = source.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const number = index + 1;
    const raw = lines[index]!.replace(/\r$/, '');
    const leading = raw.length - raw.trimStart().length;
    if (raw.slice(0, leading).includes('\t')) {
      throw new YamlRefusal(number, '', 'tabs are not accepted as indentation, use spaces');
    }

    const text = stripComment(raw).trimEnd();
    const content = text.trim();
    if (content.length === 0) continue;
    if (content === '---' || content === '...') {
      throw new YamlRefusal(number, '', 'a file with several documents is not accepted');
    }
    out.push({ indent: leading, text: content, line: number });
  }

  return out;
}

/** the position of the colon that separates a key from its value, or -1. */
function keyColon(text: string): number {
  let quote: '"' | "'" | null = null;
  let depth = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quote !== null) {
      if (char === '\\' && quote === '"') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') depth -= 1;
    else if (char === ':' && depth === 0 && (index === text.length - 1 || text[index + 1] === ' ')) {
      return index;
    }
  }
  return -1;
}

function coerceScalar(raw: string, line: number, path: string): YamlValue {
  if (raw.length === 0) return null;

  const first = raw[0]!;
  if (first === '&' || first === '*') {
    throw new YamlRefusal(line, path, 'anchors and aliases are not accepted');
  }
  if (first === '!') {
    throw new YamlRefusal(line, path, 'tags are not accepted');
  }
  if (raw === '|' || raw === '>' || /^[|>][+-]?\d*$/.test(raw)) {
    throw new YamlRefusal(line, path, 'block scalars are not accepted, quote the value instead');
  }

  if ((first === '"' || first === "'") && raw.length > 1 && raw.endsWith(first)) {
    return unquote(raw, line, path);
  }
  if (raw === 'null' || raw === '~') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function unquote(raw: string, line: number, path: string): string {
  const quote = raw[0]!;
  const body = raw.slice(1, -1);
  if (quote === "'") {
    if (body.includes("'") && !body.includes("''")) {
      throw new YamlRefusal(line, path, 'unterminated single quoted string');
    }
    return body.replace(/''/g, "'");
  }
  let out = '';
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index]!;
    if (char !== '\\') {
      out += char;
      continue;
    }
    const next = body[index + 1];
    if (next === '"' || next === '\\') {
      out += next;
      index += 1;
      continue;
    }
    if (next === 'n') {
      out += '\n';
      index += 1;
      continue;
    }
    throw new YamlRefusal(line, path, `unsupported escape \\${next ?? ''} in a double quoted string`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// flow collections, which must begin and end on the same line
// ---------------------------------------------------------------------------

interface FlowCursor {
  text: string;
  index: number;
  line: number;
  path: string;
  /** every key gets its line recorded, flow or block, so a refusal can point at it. */
  lines: Map<string, number>;
}

function skipSpaces(cursor: FlowCursor): void {
  while (cursor.index < cursor.text.length && cursor.text[cursor.index] === ' ') cursor.index += 1;
}

function readQuoted(cursor: FlowCursor): string {
  const quote = cursor.text[cursor.index]!;
  const start = cursor.index;
  cursor.index += 1;
  while (cursor.index < cursor.text.length) {
    const char = cursor.text[cursor.index]!;
    if (char === '\\' && quote === '"') cursor.index += 2;
    else if (char === quote) {
      cursor.index += 1;
      return unquote(cursor.text.slice(start, cursor.index), cursor.line, cursor.path);
    } else cursor.index += 1;
  }
  throw new YamlRefusal(cursor.line, cursor.path, 'unterminated quoted string');
}

function readPlain(cursor: FlowCursor): string {
  const start = cursor.index;
  while (cursor.index < cursor.text.length) {
    const char = cursor.text[cursor.index]!;
    if (char === ',' || char === '}' || char === ']') break;
    cursor.index += 1;
  }
  return cursor.text.slice(start, cursor.index).trim();
}

function readFlowValue(cursor: FlowCursor): YamlValue {
  skipSpaces(cursor);
  const char = cursor.text[cursor.index];
  if (char === undefined) {
    throw new YamlRefusal(cursor.line, cursor.path, 'a value is missing');
  }
  if (char === '{') return readFlowMap(cursor);
  if (char === '[') return readFlowSequence(cursor);
  if (char === '"' || char === "'") return readQuoted(cursor);
  return coerceScalar(readPlain(cursor), cursor.line, cursor.path);
}

function readFlowMap(cursor: FlowCursor): YamlValue {
  cursor.index += 1;
  const out: Record<string, YamlValue> = {};
  skipSpaces(cursor);
  if (cursor.text[cursor.index] === '}') {
    cursor.index += 1;
    return out;
  }

  const parentPath = cursor.path;
  for (;;) {
    skipSpaces(cursor);
    const keyStart = cursor.index;
    while (cursor.index < cursor.text.length && cursor.text[cursor.index] !== ':') cursor.index += 1;
    const key = cursor.text.slice(keyStart, cursor.index).trim();
    if (cursor.text[cursor.index] !== ':') {
      throw new YamlRefusal(cursor.line, parentPath, `expected \`:\` after \`${key}\``);
    }
    if (!KEY_PATTERN.test(key)) {
      throw new YamlRefusal(cursor.line, parentPath, `\`${key}\` is not accepted as a key`);
    }
    if (key in out) {
      throw new YamlRefusal(cursor.line, parentPath, `\`${key}\` is set twice`);
    }
    cursor.index += 1;

    cursor.path = `${parentPath}.${key}`;
    cursor.lines.set(cursor.path, cursor.line);
    out[key] = readFlowValue(cursor);
    cursor.path = parentPath;

    skipSpaces(cursor);
    const char = cursor.text[cursor.index];
    if (char === '}') {
      cursor.index += 1;
      return out;
    }
    if (char !== ',') {
      throw new YamlRefusal(cursor.line, parentPath, 'expected `,` or `}`');
    }
    cursor.index += 1;
  }
}

function readFlowSequence(cursor: FlowCursor): YamlValue {
  cursor.index += 1;
  const out: YamlValue[] = [];
  skipSpaces(cursor);
  if (cursor.text[cursor.index] === ']') {
    cursor.index += 1;
    return out;
  }

  for (;;) {
    out.push(readFlowValue(cursor));
    skipSpaces(cursor);
    const char = cursor.text[cursor.index];
    if (char === ']') {
      cursor.index += 1;
      return out;
    }
    if (char !== ',') {
      throw new YamlRefusal(cursor.line, cursor.path, 'expected `,` or `]`');
    }
    cursor.index += 1;
  }
}

// ---------------------------------------------------------------------------
// block structure
// ---------------------------------------------------------------------------

class BlockReader {
  private index = 0;
  readonly lines = new Map<string, number>();
  private readonly source: PhysicalLine[];

  constructor(source: PhysicalLine[]) {
    this.source = source;
  }

  read(): YamlValue {
    if (this.source.length === 0) return null;
    const value = this.node(this.source[0]!.indent, '');
    if (this.index < this.source.length) {
      const line = this.source[this.index]!;
      throw new YamlRefusal(line.line, '', 'unexpected indentation');
    }
    return value;
  }

  private node(indent: number, path: string): YamlValue {
    const line = this.source[this.index]!;
    return line.text.startsWith('-') && (line.text.length === 1 || line.text[1] === ' ')
      ? this.sequence(indent, path)
      : this.mapping(indent, path);
  }

  private mapping(indent: number, path: string): YamlValue {
    const out: Record<string, YamlValue> = {};

    while (this.index < this.source.length) {
      const line = this.source[this.index]!;
      if (line.indent < indent) break;
      if (line.indent > indent) {
        throw new YamlRefusal(line.line, path, 'unexpected indentation');
      }
      if (line.text.startsWith('- ')) {
        throw new YamlRefusal(line.line, path, 'expected a key, found a sequence item');
      }

      const colon = keyColon(line.text);
      if (colon < 0) {
        throw new YamlRefusal(line.line, path, 'expected `key: value`');
      }
      const key = line.text.slice(0, colon).trim();
      if (key === '<<') {
        throw new YamlRefusal(line.line, path, 'merge keys are not accepted');
      }
      if (!KEY_PATTERN.test(key)) {
        throw new YamlRefusal(line.line, path, `\`${key}\` is not accepted as a key`);
      }
      if (key in out) {
        throw new YamlRefusal(line.line, path, `\`${key}\` is set twice`);
      }

      const keyPath = path.length === 0 ? key : `${path}.${key}`;
      this.lines.set(keyPath, line.line);
      const rest = line.text.slice(colon + 1).trim();
      this.index += 1;

      if (rest.length > 0) {
        out[key] = this.inline(rest, line.line, keyPath);
        const next = this.source[this.index];
        if (next !== undefined && next.indent > indent) {
          throw new YamlRefusal(next.line, keyPath, 'unexpected indentation after a value');
        }
        continue;
      }

      const next = this.source[this.index];
      out[key] = next !== undefined && next.indent > indent ? this.node(next.indent, keyPath) : null;
    }

    return out;
  }

  private sequence(indent: number, path: string): YamlValue {
    const out: YamlValue[] = [];

    while (this.index < this.source.length) {
      const line = this.source[this.index]!;
      if (line.indent < indent) break;
      if (line.indent > indent) {
        throw new YamlRefusal(line.line, path, 'unexpected indentation');
      }
      if (!line.text.startsWith('-') || (line.text.length > 1 && line.text[1] !== ' ')) break;

      const itemPath = `${path}.${out.length}`;
      this.lines.set(itemPath, line.line);
      const body = line.text.slice(1);
      const content = body.trimStart();
      const contentIndent = line.indent + (line.text.length - content.length);

      if (content.length === 0) {
        this.index += 1;
        const next = this.source[this.index];
        if (next === undefined || next.indent <= indent) {
          throw new YamlRefusal(line.line, itemPath, 'a sequence item has no value');
        }
        out.push(this.node(next.indent, itemPath));
        continue;
      }

      if (keyColon(content) >= 0) {
        // the item is a mapping whose first key sits on the dash line. rewrite
        // that line at the column the key actually starts in, and read on.
        this.source[this.index] = { indent: contentIndent, text: content, line: line.line };
        out.push(this.mapping(contentIndent, itemPath));
        continue;
      }

      out.push(this.inline(content, line.line, itemPath));
      this.index += 1;
    }

    return out;
  }

  private inline(text: string, line: number, path: string): YamlValue {
    if (text.startsWith('{') || text.startsWith('[')) {
      const cursor: FlowCursor = { text, index: 0, line, path, lines: this.lines };
      const value = readFlowValue(cursor);
      skipSpaces(cursor);
      if (cursor.index < text.length) {
        throw new YamlRefusal(line, path, 'unexpected text after the closing bracket');
      }
      return value;
    }
    return coerceScalar(text, line, path);
  }
}

export function parseYaml(source: string): YamlResult {
  try {
    const reader = new BlockReader(scan(source));
    const value = reader.read();
    return { status: 'ok', value, lines: reader.lines };
  } catch (error) {
    if (error instanceof YamlRefusal) {
      return { status: 'invalid', issues: [{ line: error.line, path: error.path, message: error.message }] };
    }
    throw error;
  }
}
