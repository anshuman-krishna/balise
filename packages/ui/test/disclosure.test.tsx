import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Disclosure } from '../src/Disclosure.js';

const NOTE = 'deux profils sur ce service, donc les runs ne sont pas comparables';

function render() {
  return renderToStaticMarkup(
    <Disclosure content={NOTE} className="mono">
      coverage varies
    </Disclosure>,
  );
}

describe('an explanation the trigger has no room for', () => {
  // the whole reason this exists: `title` reaches neither.
  it('puts the trigger in the tab order', () => {
    expect(render()).toContain('<button type="button"');
  });

  it('describes the trigger whether the panel is open or not', () => {
    const html = render();
    const id = /aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(id).toBeDefined();
    expect(html).toContain(`id="${id}"`);
  });

  // closed means out of view, never out of the accessible tree: what a screen
  // reader is told must not depend on a pointer.
  it('keeps the text in the markup while closed', () => {
    expect(render()).toContain(NOTE);
    expect(render()).toContain('aria-expanded="false"');
  });

  it('keeps the caller\'s own styling on the trigger', () => {
    expect(render()).toContain('class="mono"');
  });
});
