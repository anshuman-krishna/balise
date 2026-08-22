import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

export interface DisclosureProps {
  /** the trigger's own content: a chip, a value, a truncated url. */
  children: ReactNode;
  /** what the trigger does not have room to say. plain text, read aloud. */
  content: string;
  /** applied to the trigger, so a caller keeps its own chip styling. */
  className?: string;
  style?: CSSProperties;
  /**
   * applied to the wrapper, which is the element that sits in the caller's
   * flow. margins and flex placement belong here, not on the trigger.
   */
  wrapperStyle?: CSSProperties;
  /** where the panel opens relative to the trigger. */
  align?: 'start' | 'end';
}

// self-contained rather than a class from the app stylesheet: this component
// renders in the browser, in the headless screenshot the check comment uses,
// and in the typst pipeline, and only the tokens are shared across all three.
const HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const PANEL: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  zIndex: 30,
  width: 'max-content',
  maxWidth: 320,
  padding: '8px 10px',
  background: 'var(--surface)',
  border: '1px solid var(--border-strong)',
  boxShadow: '0 4px 14px rgba(21, 24, 27, .14)',
  color: 'var(--ink)',
  // the trigger may sit in a mono cell. an explanation is prose and reads as
  // prose wherever it opens.
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  lineHeight: 1.45,
  fontWeight: 400,
  letterSpacing: 0,
  textAlign: 'left',
  whiteSpace: 'normal',
  textTransform: 'none',
};

/**
 * an explanation the trigger has no room for.
 *
 * this replaces the `title` attribute, which is not reachable by keyboard, not
 * shown on touch, and not dismissible: three failures of WCAG 1.4.13 in one
 * attribute. the three places it mattered most in this app were all disclosing
 * a limit on comparability, which is the last thing to hide behind a hover.
 *
 * the panel is in the accessible tree whether it is open or not, referenced by
 * `aria-describedby`, so what a screen reader is told does not depend on a
 * pointer. opening it moves the same node into view rather than rendering a
 * second copy of the text.
 */
export function Disclosure({
  children,
  content,
  className,
  style,
  wrapperStyle,
  align = 'start',
}: DisclosureProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  // a pointer leaving the trigger for the panel passes over the wrapper, so
  // the panel stays reachable: WCAG 1.4.13's hoverable requirement.
  const wrapper = useRef<HTMLSpanElement | null>(null);

  function onKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key !== 'Escape' || !open) return;
    // dismissed without moving focus, which is the requirement. it reopens on
    // the next focus or hover.
    event.stopPropagation();
    setOpen(false);
  }

  return (
    <span
      ref={wrapper}
      style={{ position: 'relative', display: 'inline-flex', ...wrapperStyle }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className={className}
        aria-describedby={id}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
        style={{
          font: 'inherit',
          color: 'inherit',
          background: 'none',
          border: 'none',
          padding: 0,
          margin: 0,
          textAlign: 'inherit',
          cursor: 'help',
          ...style,
        }}
      >
        {children}
      </button>
      <span
        id={id}
        role="note"
        style={open ? { ...PANEL, [align === 'end' ? 'right' : 'left']: 0 } : HIDDEN}
      >
        {content}
      </span>
    </span>
  );
}
