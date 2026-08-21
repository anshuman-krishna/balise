/**
 * the keyboard half of the tab pattern, kept pure so it can be tested without
 * a browser.
 *
 * a set of tabs is one stop in the page's tab order, not one stop per tab: the
 * arrow keys move within the set. that is the contract `role="tab"` announces,
 * so a tablist that does not implement it tells an assistive technology to
 * press keys that do nothing.
 */

/** the tab a key press moves to, or null if the key belongs to the page. */
export function nextTabIndex(key: string, current: number, count: number): number | null {
  if (count === 0) return null;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

export function tabId(name: string, key: string): string {
  return `${name}-tab-${key}`;
}

export function tabPanelId(name: string, key: string): string {
  return `${name}-panel-${key}`;
}

export interface TabPanelAttributes {
  id: string;
  role: 'tabpanel';
  'aria-labelledby': string;
  tabIndex: 0;
}

/**
 * the attributes a panel must carry, spread onto whatever element already
 * holds the content. the panel is focusable because arrowing to a tab must
 * leave the keyboard somewhere to go next.
 */
export function tabPanelAttributes(name: string, key: string): TabPanelAttributes {
  return {
    id: tabPanelId(name, key),
    role: 'tabpanel',
    'aria-labelledby': tabId(name, key),
    tabIndex: 0,
  };
}
