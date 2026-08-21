/**
 * a small reader for the html react produces on the server, written so that an
 * accessibility audit can be a test rather than a memory of having once looked.
 *
 * it is not a general html parser and does not try to be: it reads
 * well-formed, entity-escaped output from `renderToStaticMarkup`, where every
 * non-void element is closed and no attribute is unquoted. anything else
 * throws rather than guessing, because a parser that recovers silently would
 * let a screen drop out of the audit without saying so.
 */

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** text nodes are kept as children so that reading order survives. */
export const TEXT = '#text';

export interface MarkupNode {
  /** a lowercased tag name, or `#text` for a run of text. */
  tag: string;
  attrs: Readonly<Record<string, string>>;
  children: MarkupNode[];
  /** every descendant text node, in order. */
  text: string;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  '#x27': "'",
  nbsp: ' ',
};

function decode(raw: string): string {
  return raw.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, name: string) => {
    const known = ENTITIES[name.toLowerCase()];
    if (known !== undefined) return known;
    if (name.startsWith('#x')) return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
    if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
    return match;
  });
}

function readAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:="([^"]*)")?/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    if (match[0] === '') {
      pattern.lastIndex += 1;
      continue;
    }
    attrs[match[1]!.toLowerCase()] = match[2] === undefined ? '' : decode(match[2]);
  }
  return attrs;
}

/** parses a fragment into its root nodes. */
export function parseMarkup(html: string): MarkupNode[] {
  const roots: MarkupNode[] = [];
  const stack: MarkupNode[] = [];
  const pattern = /<!--[\s\S]*?-->|<\/([a-zA-Z][-a-zA-Z0-9]*)\s*>|<([a-zA-Z][-a-zA-Z0-9]*)((?:[^>"]|"[^"]*")*?)(\/?)>/g;
  let cursor = 0;

  const addText = (raw: string) => {
    if (raw === '') return;
    const text = decode(raw);
    for (const node of stack) node.text += text;
    const parent = stack.at(-1);
    const node: MarkupNode = { tag: TEXT, attrs: {}, children: [], text };
    if (parent === undefined) roots.push(node);
    else parent.children.push(node);
  };

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    addText(html.slice(cursor, match.index));
    cursor = match.index + match[0].length;
    if (match[0].startsWith('<!--')) continue;

    const closing = match[1];
    if (closing !== undefined) {
      const open = stack.pop();
      if (open === undefined || open.tag !== closing.toLowerCase()) {
        throw new Error(`unbalanced markup: </${closing}> closes <${open?.tag ?? 'nothing'}>`);
      }
      continue;
    }

    const tag = match[2]!.toLowerCase();
    const node: MarkupNode = { tag, attrs: readAttrs(match[3] ?? ''), children: [], text: '' };
    const parent = stack.at(-1);
    if (parent === undefined) roots.push(node);
    else parent.children.push(node);
    if (!VOID_TAGS.has(tag) && match[4] !== '/') stack.push(node);
  }
  addText(html.slice(cursor));

  if (stack.length > 0) {
    throw new Error(`unbalanced markup: <${stack.at(-1)!.tag}> never closed`);
  }
  return roots;
}

/** every node in document order, roots included. */
export function* walk(nodes: readonly MarkupNode[]): Generator<MarkupNode> {
  for (const node of nodes) {
    yield node;
    yield* walk(node.children);
  }
}

export function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
