import { collapse, parseMarkup, TEXT, walk, type MarkupNode } from './markup';

/**
 * a keyboard and naming audit of rendered markup.
 *
 * the operating manual asks that every interactive element be keyboard
 * reachable with a visible focus ring, on a product whose second rule pack is
 * the accessibility referential. the ring is a token; reachability is a
 * property of the markup, so it is checked here rather than remembered.
 *
 * every rule below is one an assistive technology acts on. nothing here is a
 * style preference.
 */

export type A11yRule =
  | 'positive-tabindex'
  | 'unnamed-control'
  | 'anchor-without-href'
  | 'duplicate-id'
  | 'focusable-inside-aria-hidden'
  | 'nested-interactive'
  | 'tablist-unnamed'
  | 'tab-without-panel'
  | 'tab-selection'
  | 'tab-roving-tabindex'
  | 'panel-unlabelled';

export interface A11yFinding {
  rule: A11yRule;
  /** enough of the element to find it in the source. */
  element: string;
  detail: string;
}

const NATIVELY_FOCUSABLE = new Set(['button', 'select', 'textarea', 'summary']);

function attr(node: MarkupNode, name: string): string | undefined {
  return node.attrs[name];
}

export function isFocusable(node: MarkupNode): boolean {
  if (attr(node, 'disabled') !== undefined) return false;
  const tabindex = attr(node, 'tabindex');
  if (tabindex !== undefined) return Number(tabindex) >= 0;
  if (NATIVELY_FOCUSABLE.has(node.tag)) return true;
  if (node.tag === 'a') return attr(node, 'href') !== undefined;
  if (node.tag === 'input') return attr(node, 'type') !== 'hidden';
  return false;
}

/** an element an assistive technology reports as a control. */
function isInteractive(node: MarkupNode): boolean {
  const role = attr(node, 'role');
  if (role !== undefined) {
    return ['button', 'link', 'tab', 'checkbox', 'radio', 'menuitem', 'switch'].includes(role);
  }
  return node.tag === 'button' || node.tag === 'select' || node.tag === 'textarea'
    || (node.tag === 'a' && attr(node, 'href') !== undefined)
    || (node.tag === 'input' && attr(node, 'type') !== 'hidden');
}

/** the text a screen reader would read, ignoring anything hidden from it. */
function visibleText(node: MarkupNode): string {
  if (attr(node, 'aria-hidden') === 'true') return '';
  if (node.tag === TEXT) return node.text;
  return node.children.map(visibleText).join(' ');
}

export function accessibleName(node: MarkupNode, byId: ReadonlyMap<string, MarkupNode>): string {
  const label = attr(node, 'aria-label');
  if (label !== undefined && collapse(label) !== '') return collapse(label);

  const labelledBy = attr(node, 'aria-labelledby');
  if (labelledBy !== undefined) {
    const named = labelledBy
      .split(/\s+/)
      .map((id) => byId.get(id))
      .filter((target): target is MarkupNode => target !== undefined)
      .map((target) => collapse(visibleText(target)))
      .join(' ');
    if (collapse(named) !== '') return collapse(named);
  }

  if (node.tag === 'input' || node.tag === 'select' || node.tag === 'textarea') {
    const id = attr(node, 'id');
    if (id !== undefined) {
      for (const [, candidate] of byId) {
        if (candidate.tag === 'label' && attr(candidate, 'for') === id) {
          return collapse(visibleText(candidate));
        }
      }
    }
  }

  const text = collapse(visibleText(node));
  if (text !== '') return text;

  const title = attr(node, 'title');
  // a placeholder is deliberately not accepted: it disappears on the first
  // keystroke, so a field named only by one is a field with no name.
  return title === undefined ? '' : collapse(title);
}

function describe(node: MarkupNode): string {
  const id = attr(node, 'id');
  const role = attr(node, 'role');
  const className = attr(node, 'class');
  const parts = [node.tag];
  if (role !== undefined) parts.push(`role=${role}`);
  if (id !== undefined) parts.push(`#${id}`);
  if (className !== undefined) parts.push(`.${className.split(/\s+/).join('.')}`);
  return parts.join(' ');
}

export function auditMarkup(html: string): A11yFinding[] {
  const roots = parseMarkup(html);
  const nodes = [...walk(roots)];
  const findings: A11yFinding[] = [];
  const byId = new Map<string, MarkupNode>();
  const seenIds = new Set<string>();

  for (const node of nodes) {
    const id = attr(node, 'id');
    if (id === undefined) continue;
    if (seenIds.has(id)) {
      findings.push({
        rule: 'duplicate-id',
        element: describe(node),
        detail: `the id "${id}" is used more than once, so every reference to it is ambiguous`,
      });
    }
    seenIds.add(id);
    if (!byId.has(id)) byId.set(id, node);
  }
  // a label is found by its `for`, which needs no id of its own.
  for (const node of nodes) {
    if (node.tag === 'label' && attr(node, 'id') === undefined) {
      byId.set(`label:${attr(node, 'for') ?? ''}:${byId.size}`, node);
    }
  }

  const hiddenSubtrees = new Set<MarkupNode>();
  const markHidden = (node: MarkupNode) => {
    hiddenSubtrees.add(node);
    node.children.forEach(markHidden);
  };
  for (const node of nodes) {
    if (attr(node, 'aria-hidden') === 'true') node.children.forEach(markHidden);
  }

  const interactiveAncestors = new Map<MarkupNode, MarkupNode>();
  const markInteractive = (node: MarkupNode, ancestor: MarkupNode | undefined) => {
    if (ancestor !== undefined) interactiveAncestors.set(node, ancestor);
    const next = isInteractive(node) ? node : ancestor;
    for (const child of node.children) markInteractive(child, next);
  };
  roots.forEach((root) => markInteractive(root, undefined));

  for (const node of nodes) {
    const tabindex = attr(node, 'tabindex');
    if (tabindex !== undefined && Number(tabindex) > 0) {
      findings.push({
        rule: 'positive-tabindex',
        element: describe(node),
        detail: `tabindex="${tabindex}" moves this element out of document order, which reorders the whole page for a keyboard`,
      });
    }

    if (node.tag === 'a' && attr(node, 'href') === undefined) {
      findings.push({
        rule: 'anchor-without-href',
        element: describe(node),
        detail: 'an anchor with no href is not focusable and is announced as text',
      });
    }

    if (isFocusable(node)) {
      if (hiddenSubtrees.has(node) || attr(node, 'aria-hidden') === 'true') {
        findings.push({
          rule: 'focusable-inside-aria-hidden',
          element: describe(node),
          detail: 'the keyboard can reach it and the screen reader cannot see it',
        });
      }
      if (accessibleName(node, byId) === '') {
        findings.push({
          rule: 'unnamed-control',
          element: describe(node),
          detail: 'focusable with nothing to announce: no text, no aria-label, no label',
        });
      }
    }

    if (isInteractive(node) && interactiveAncestors.has(node)) {
      findings.push({
        rule: 'nested-interactive',
        element: describe(node),
        detail: `inside ${describe(interactiveAncestors.get(node)!)}, which makes the pair unreachable in order`,
      });
    }
  }

  findings.push(...auditTabs(nodes, byId));
  return findings;
}

function auditTabs(nodes: readonly MarkupNode[], byId: ReadonlyMap<string, MarkupNode>): A11yFinding[] {
  const findings: A11yFinding[] = [];
  const tablists = nodes.filter((node) => attr(node, 'role') === 'tablist');

  for (const tablist of tablists) {
    // a tablist is not a role that takes its name from its content, so the
    // labels of the tabs inside it name nothing. it needs its own.
    const named =
      collapse(attr(tablist, 'aria-label') ?? '') !== '' || attr(tablist, 'aria-labelledby') !== undefined;
    if (!named) {
      findings.push({
        rule: 'tablist-unnamed',
        element: describe(tablist),
        detail: 'a set of tabs with no name is announced as "tab list" and nothing else',
      });
    }

    const tabs = [...walk(tablist.children)].filter((node) => attr(node, 'role') === 'tab');
    const selected = tabs.filter((tab) => attr(tab, 'aria-selected') === 'true');
    if (selected.length !== 1) {
      findings.push({
        rule: 'tab-selection',
        element: describe(tablist),
        detail: `${selected.length} of ${tabs.length} tabs are aria-selected; exactly one must be`,
      });
    }

    // the pattern is arrow keys within the set and one stop in the page's tab
    // order. without a roving tabindex the browser puts every tab in the tab
    // order while the role tells the screen reader to use the arrows.
    const reachable = tabs.filter((tab) => (attr(tab, 'tabindex') ?? '0') === '0');
    if (reachable.length !== 1) {
      findings.push({
        rule: 'tab-roving-tabindex',
        element: describe(tablist),
        detail: `${reachable.length} of ${tabs.length} tabs are in the page tab order; the pattern allows exactly one, the rest reached with the arrow keys`,
      });
    }

    for (const tab of tabs) {
      const controls = attr(tab, 'aria-controls');
      const open = attr(tab, 'aria-selected') === 'true';
      if (controls === undefined) {
        // a closed panel may legitimately not be rendered, so only the open
        // one is required to exist and be named.
        if (open) {
          findings.push({
            rule: 'tab-without-panel',
            element: describe(tab),
            detail: 'the open tab names no panel, so there is nothing to move to',
          });
        }
        continue;
      }
      const panel = byId.get(controls);
      if (panel === undefined || attr(panel, 'role') !== 'tabpanel') {
        findings.push({
          rule: 'tab-without-panel',
          element: describe(tab),
          detail: `names the panel "${controls}", which is not a tabpanel on this page`,
        });
      }
    }
  }

  for (const panel of nodes.filter((node) => attr(node, 'role') === 'tabpanel')) {
    const labelledBy = attr(panel, 'aria-labelledby');
    const tab = labelledBy === undefined ? undefined : byId.get(labelledBy);
    if (tab === undefined || attr(tab, 'role') !== 'tab') {
      findings.push({
        rule: 'panel-unlabelled',
        element: describe(panel),
        detail: 'a panel takes its name from the tab that opens it',
      });
    }
    if ((attr(panel, 'tabindex') ?? '') !== '0') {
      findings.push({
        rule: 'panel-unlabelled',
        element: describe(panel),
        detail: 'the panel itself must be focusable, or arrowing to a tab leaves the keyboard with nowhere to go next',
      });
    }
  }

  return findings;
}
