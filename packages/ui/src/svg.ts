import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ToleranceBand, type ToleranceBandProps } from './ToleranceBand.js';

/**
 * the band as a standalone svg document, for the surfaces that cannot run
 * react: the pull request comment, the embeddable badge, and the typst
 * document pipeline.
 *
 * it renders the component itself rather than redrawing it. the operating
 * manual asks for the same rendering in the browser, in the check comment and
 * in the pdf, and the only way to be sure of that is for all three to be the
 * same code. this is also why there is no headless browser here: a screenshot
 * would introduce a second renderer, a font race and a timestamped png, none
 * of which a document whose hash goes in the ledger can afford.
 */

const XMLNS = 'http://www.w3.org/2000/svg';

/**
 * react generates a fresh id per render for pattern references. the same
 * inputs have to produce the same bytes, so the generated prefix is replaced
 * by a fixed one.
 */
function stabiliseIds(markup: string): string {
  const found = new Set<string>();
  for (const match of markup.matchAll(/id="([^"]*?)-(?:hatch|dot)"/g)) {
    found.add(match[1]!);
  }
  let out = markup;
  let index = 0;
  for (const prefix of found) {
    out = out.split(prefix).join(`b${index}`);
    index += 1;
  }
  return out;
}

export interface BandSvgOptions {
  /** written into the document as its title, for assistive technology. */
  title?: string;
}

export function renderBandSvg(props: ToleranceBandProps, options: BandSvgOptions = {}): string {
  const markup = stabiliseIds(renderToStaticMarkup(createElement(ToleranceBand, props)));
  const titled =
    options.title === undefined
      ? markup
      : markup.replace(/^(<svg[^>]*>)/, `$1<title>${escapeText(options.title)}</title>`);
  return titled.replace(/^<svg /, `<svg xmlns="${XMLNS}" `);
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
