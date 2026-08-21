import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { nextTabIndex, tabId, tabPanelId } from './tab-pattern.js';

export interface TabDefinition<K extends string = string> {
  key: K;
  label: string;
}

export interface TabsProps<K extends string = string> {
  /**
   * names the set for a screen reader. a tablist takes no name from the tabs
   * inside it, so without this it is announced as "tab list" and nothing else.
   */
  label: string;
  /** prefixes the generated ids, so two sets on one page stay distinct. */
  name: string;
  tabs: readonly TabDefinition<K>[];
  selected: K;
  onSelect: (key: K) => void;
  /** `tabs` is the underlined row, `segmented` the boxed control. */
  variant?: 'tabs' | 'segmented';
  style?: CSSProperties;
}

/**
 * the tab pattern as the roles promise it: one stop in the page tab order,
 * arrow keys within the set, and each tab naming the panel it opens.
 *
 * selection follows focus, which the pattern allows where switching panels
 * costs nothing.
 *
 * only the selected tab names its panel. panels here are rendered when they
 * open rather than all at once and hidden, so an `aria-controls` on a closed
 * tab would point at an id that is not on the page: a promise of somewhere to
 * go, made to the one reader who cannot check.
 */
export function Tabs<K extends string = string>({
  label,
  name,
  tabs,
  selected,
  onSelect,
  variant = 'tabs',
  style,
}: TabsProps<K>) {
  const buttons = useRef(new Map<K, HTMLButtonElement | null>());

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex((tab) => tab.key === selected);
    const next = nextTabIndex(event.key, current, tabs.length);
    if (next === null) return;
    event.preventDefault();
    const target = tabs[next]!;
    onSelect(target.key);
    buttons.current.get(target.key)?.focus();
  }

  return (
    <div
      className={variant}
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      {...(style === undefined ? {} : { style })}
    >
      {tabs.map((tab) => {
        const active = tab.key === selected;
        return (
          <button
            key={tab.key}
            ref={(node) => {
              buttons.current.set(tab.key, node);
            }}
            id={tabId(name, tab.key)}
            type="button"
            role="tab"
            aria-selected={active}
            {...(active ? { 'aria-controls': tabPanelId(name, tab.key) } : {})}
            tabIndex={active ? 0 : -1}
            className={variant === 'tabs' ? (active ? 'tab active' : 'tab') : active ? 'active' : undefined}
            onClick={() => onSelect(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
