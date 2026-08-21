import { describe, expect, it } from 'vitest';
import { collapse, parseMarkup, TEXT, walk } from './markup';

describe('reading rendered markup', () => {
  it('nests elements and keeps their attributes', () => {
    const [root] = parseMarkup('<div class="card" data-x="1"><span>ok</span></div>');
    expect(root!.tag).toBe('div');
    expect(root!.attrs).toEqual({ class: 'card', 'data-x': '1' });
    expect(root!.children.filter((child) => child.tag !== TEXT)).toHaveLength(1);
  });

  it('keeps text where it was written, so reading order survives', () => {
    const [root] = parseMarkup('<p>avant <b>gras</b> après</p>');
    expect(root!.children.map((child) => child.text)).toEqual(['avant ', 'gras', ' après']);
  });

  it('closes void elements without being told', () => {
    const nodes = [...walk(parseMarkup('<div><img src="a.png"><input id="b"></div>'))];
    expect(nodes.filter((node) => node.tag === 'input')).toHaveLength(1);
  });

  it('handles the self-closing form react writes for svg', () => {
    const nodes = [...walk(parseMarkup('<svg><rect x="1"/><rect x="2"/></svg>'))];
    expect(nodes.filter((node) => node.tag === 'rect')).toHaveLength(2);
  });

  it('decodes the entities react escapes', () => {
    const [root] = parseMarkup('<p>3&nbsp;&lt;&nbsp;4 &amp; &quot;cinq&quot; &#39;six&#39;</p>');
    expect(collapse(root!.text)).toBe('3 < 4 & "cinq" \'six\'');
  });

  it('reads an attribute containing an angle bracket', () => {
    const [root] = parseMarkup('<div aria-label="a > b"><span>x</span></div>');
    expect(root!.attrs['aria-label']).toBe('a > b');
  });

  it('skips comments', () => {
    const nodes = [...walk(parseMarkup('<div><!-- <button> --><span>x</span></div>'))];
    expect(nodes.filter((node) => node.tag === 'button')).toHaveLength(0);
  });

  // a parser that recovered here would let a screen fall out of the audit
  // while the audit went on reporting nothing wrong.
  it('refuses markup it cannot read rather than guessing', () => {
    expect(() => parseMarkup('<div><span></div>')).toThrow(/unbalanced/);
    expect(() => parseMarkup('<div>')).toThrow(/never closed/);
  });
});
