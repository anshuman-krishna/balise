import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Tabs } from '../src/Tabs.js';
import { nextTabIndex, tabId, tabPanelAttributes, tabPanelId } from '../src/tab-pattern.js';

const TABS = [
  { key: 'waterfall', label: 'Cascade' },
  { key: 'models', label: 'Modèles' },
  { key: 'resources', label: 'Ressources' },
] as const;

describe('moving within a set of tabs', () => {
  it('wraps forward past the last', () => {
    expect(nextTabIndex('ArrowRight', 2, 3)).toBe(0);
  });

  it('wraps backward past the first', () => {
    expect(nextTabIndex('ArrowLeft', 0, 3)).toBe(2);
  });

  it('takes the vertical arrows as well, so an orientation change is not a rewrite', () => {
    expect(nextTabIndex('ArrowDown', 0, 3)).toBe(1);
    expect(nextTabIndex('ArrowUp', 1, 3)).toBe(0);
  });

  it('jumps to the ends', () => {
    expect(nextTabIndex('Home', 2, 3)).toBe(0);
    expect(nextTabIndex('End', 0, 3)).toBe(2);
  });

  // the tab key belongs to the page, not to the set. swallowing it would trap
  // the keyboard inside the control.
  it('leaves every other key to the page', () => {
    for (const key of ['Tab', 'Enter', ' ', 'a', 'Escape', 'PageDown']) {
      expect(nextTabIndex(key, 0, 3)).toBeNull();
    }
  });

  it('has nowhere to go in an empty set', () => {
    expect(nextTabIndex('ArrowRight', 0, 0)).toBeNull();
  });
});

describe('a tablist', () => {
  const html = renderToStaticMarkup(
    <Tabs
      label="Détail du run"
      name="run"
      tabs={TABS}
      selected="models"
      onSelect={() => {}}
    />,
  );

  it('carries a name, because a tablist takes none from its tabs', () => {
    expect(html).toContain('aria-label="Détail du run"');
  });

  it('puts exactly one tab in the page tab order', () => {
    expect([...html.matchAll(/tabindex="0"/g)]).toHaveLength(1);
    expect([...html.matchAll(/tabindex="-1"/g)]).toHaveLength(2);
  });

  it('gives the reachable stop to the selected tab', () => {
    expect(html).toMatch(/id="run-tab-models"[^>]*tabindex="0"/);
  });

  it('names the open panel', () => {
    expect(html).toContain(`aria-controls="${tabPanelId('run', 'models')}"`);
  });

  // the closed panels are not rendered, so naming them would point a screen
  // reader at an id that is not on the page.
  it('names no panel it cannot see', () => {
    expect([...html.matchAll(/aria-controls=/g)]).toHaveLength(1);
  });

  it('keeps two sets on one page apart', () => {
    expect(tabId('run', 'models')).not.toBe(tabId('check', 'models'));
  });
});

describe('a panel', () => {
  it('is named by the tab that opens it and is itself focusable', () => {
    expect(tabPanelAttributes('run', 'models')).toEqual({
      id: 'run-panel-models',
      role: 'tabpanel',
      'aria-labelledby': 'run-tab-models',
      tabIndex: 0,
    });
  });
});
