import { describe, expect, it } from 'vitest';
import { auditMarkup, type A11yRule } from './a11y';

// the page-level rules want a page, so every fragment below is audited inside
// one that already has a title.
function rules(html: string): A11yRule[] {
  return outline(`<h1>Titre</h1>${html}`);
}

function outline(html: string): A11yRule[] {
  return auditMarkup(html).map((finding) => finding.rule);
}

// the audit is only worth its green: every rule is shown catching something
// before it is trusted to catch nothing.
describe('the keyboard audit', () => {
  it('passes markup that is already right', () => {
    expect(rules('<button type="button">Publier</button>')).toEqual([]);
  });

  it('catches a control with nothing to announce', () => {
    expect(rules('<button type="button"></button>')).toContain('unnamed-control');
    expect(rules('<button type="button"><span aria-hidden="true">×</span></button>')).toContain(
      'unnamed-control',
    );
  });

  it('accepts a name from a label, an aria-label, or the text itself', () => {
    expect(rules('<label for="d">Domaine</label><input id="d">')).toEqual([]);
    expect(rules('<button type="button" aria-label="Fermer">×</button>')).toEqual([]);
    expect(rules('<span id="n">Fermer</span><button type="button" aria-labelledby="n"></button>')).toEqual([]);
  });

  // a placeholder disappears on the first keystroke, so a field named only by
  // one is a field with no name.
  it('does not accept a placeholder as a name', () => {
    expect(rules('<input placeholder="domaine.fr">')).toContain('unnamed-control');
  });

  it('catches a tab order rewritten by hand', () => {
    expect(rules('<button type="button" tabindex="3">Publier</button>')).toContain('positive-tabindex');
    expect(rules('<button type="button" tabindex="-1">Publier</button>')).toEqual([]);
  });

  it('catches an anchor that is not focusable', () => {
    expect(rules('<a>Méthodologie</a>')).toContain('anchor-without-href');
  });

  it('catches an element the keyboard reaches and the screen reader cannot see', () => {
    expect(rules('<div aria-hidden="true"><button type="button">Publier</button></div>')).toContain(
      'focusable-inside-aria-hidden',
    );
  });

  it('catches a control inside a control', () => {
    expect(rules('<button type="button">Publier <a href="#x">détail</a></button>')).toContain(
      'nested-interactive',
    );
  });

  it('catches an id used twice, which makes every reference to it ambiguous', () => {
    expect(rules('<div id="main"></div><div id="main"></div>')).toContain('duplicate-id');
  });
});

describe('the heading outline', () => {
  it('passes an outline that descends one level at a time', () => {
    expect(outline('<h1>Déclaration</h1><h2>Critères non conformes</h2><h2>Hébergement</h2>')).toEqual([]);
  });

  // a document that opens at h2 has no title in the outline. the three
  // artifacts this product exists to produce did exactly that.
  it('catches a page that opens below the first level', () => {
    expect(outline('<h2>Déclaration</h2><h3>Critères</h3>')).toContain('no-h1');
  });

  it('catches a page with no heading at all', () => {
    expect(outline('<div>Empreinte vérifiée</div>')).toContain('no-h1');
  });

  it('catches an outline with more than one document in it', () => {
    expect(outline('<h1>Une</h1><h1>Deux</h1>')).toContain('multiple-h1');
  });

  it('catches a level skipped, which nests a section under a heading that is not there', () => {
    expect(outline('<h1>Une</h1><h3>Trois</h3>')).toContain('heading-level-skipped');
  });

  it('allows climbing back up any number of levels', () => {
    expect(outline('<h1>Une</h1><h2>Deux</h2><h3>Trois</h3><h2>Deux</h2>')).toEqual([]);
  });
});

describe('the tab pattern', () => {
  const TABS = `
    <div role="tablist" aria-label="Détail du run">
      <button type="button" role="tab" id="t-a" aria-selected="true" aria-controls="p-a" tabindex="0">A</button>
      <button type="button" role="tab" id="t-b" aria-selected="false" tabindex="-1">B</button>
    </div>
    <div role="tabpanel" id="p-a" aria-labelledby="t-a" tabindex="0">contenu</div>`;

  it('passes a set that keeps every promise the roles make', () => {
    expect(rules(TABS)).toEqual([]);
  });

  it('catches a set with no name, since a tablist takes none from its tabs', () => {
    expect(rules(TABS.replace(' aria-label="Détail du run"', ''))).toContain('tablist-unnamed');
  });

  // the roles tell a screen reader to use the arrows. without a roving
  // tabindex the browser also puts every tab in the page tab order, so the
  // announcement and the behaviour disagree.
  it('catches every tab sitting in the page tab order', () => {
    expect(rules(TABS.replace('tabindex="-1"', 'tabindex="0"'))).toContain('tab-roving-tabindex');
  });

  it('catches an open tab that names no panel', () => {
    expect(rules(TABS.replace(' aria-controls="p-a"', ''))).toContain('tab-without-panel');
  });

  it('catches a tab naming a panel that is not on the page', () => {
    expect(rules(TABS.replace('aria-controls="p-a"', 'aria-controls="p-z"'))).toContain(
      'tab-without-panel',
    );
  });

  it('catches a set with no selection, or with two', () => {
    expect(rules(TABS.replace('aria-selected="true"', 'aria-selected="false"'))).toContain('tab-selection');
    expect(rules(TABS.replace('aria-selected="false"', 'aria-selected="true"'))).toContain('tab-selection');
  });

  it('catches a panel with no name and a panel the keyboard cannot enter', () => {
    expect(rules(TABS.replace(' aria-labelledby="t-a"', ''))).toContain('panel-unlabelled');
    expect(rules(TABS.replace('id="p-a" aria-labelledby="t-a" tabindex="0"', 'id="p-a" aria-labelledby="t-a"'))).toContain(
      'panel-unlabelled',
    );
  });
});

// the product's content is columns of measured numbers. a table drawn as a
// grid of div and span reads as a flat run of them, so the roles that carry
// the columns are checked the same way: every rule shown catching something.
describe('the table audit', () => {
  const TABLE = `
    <div role="table" aria-label="État mesuré">
      <div role="row">
        <span role="columnheader">Métrique</span>
        <span role="columnheader">Valeur</span>
      </div>
      <div role="row">
        <span role="cell">Poids transféré</span>
        <span role="cell">842 Ko</span>
      </div>
    </div>`;

  it('passes a table that carries its columns', () => {
    expect(rules(TABLE)).toEqual([]);
  });

  it('catches a table with nothing to announce it by', () => {
    expect(rules(TABLE.replace(' aria-label="État mesuré"', ''))).toContain('table-unnamed');
  });

  it('catches a row that disagrees with the header row', () => {
    expect(rules(TABLE.replace('<span role="cell">842 Ko</span>', '<span role="cell">842 Ko</span><span role="cell">±7 Ko</span>'))).toContain(
      'row-cell-count',
    );
  });

  // a note under a row spans the table rather than adding a column to it, so
  // the span is what counts.
  it('counts a spanning cell as the columns it covers', () => {
    expect(
      rules(
        TABLE.replace(
          '<span role="cell">Poids transféré</span>\n        <span role="cell">842 Ko</span>',
          '<span role="cell" aria-colspan="2">seuil hérité du service</span>',
        ),
      ),
    ).toEqual([]);
  });

  it('accepts a rowgroup between the table and its rows', () => {
    expect(rules(TABLE.replace('<div role="row">', '<div role="rowgroup"><div role="row">').replace(/<\/div>\s*<\/div>$/, '</div></div></div>'))).toEqual([]);
  });

  it('catches an element between the table and its rows', () => {
    expect(rules(TABLE.replace('<div role="row">', '<div class="body"><div role="row">').replace(/<\/div>\s*<\/div>$/, '</div></div></div>'))).toContain(
      'table-structure',
    );
  });

  it('catches an element inside a row that carries no column', () => {
    expect(rules(TABLE.replace('<span role="cell">842 Ko</span>', '<span>842 Ko</span>'))).toContain(
      'table-structure',
    );
  });

  it('catches a cell whose parent is not a row', () => {
    expect(rules('<span role="cell">842 Ko</span>')).toContain('table-structure');
  });

  it('catches a table with no rows at all', () => {
    expect(rules('<div role="table" aria-label="État mesuré"></div>')).toContain('table-structure');
  });

  // a bar drawn beside a printed figure repeats it. it is hidden, so it is
  // not a cell and does not shift the columns.
  it('does not count a decorative element as a cell', () => {
    expect(
      rules(TABLE.replace('<span role="cell">842 Ko</span>', '<span role="cell">842 Ko</span><span aria-hidden="true">▁▃▅</span>')),
    ).toEqual([]);
  });
});

// a name is read aloud. the app types its eyebrows in capitals rather than
// transforming them in css, so reusing one as a name is a live risk here.
describe('the name audit', () => {
  it('catches a display string reused as a name', () => {
    expect(
      rules('<div role="table" aria-label="RELEVÉS · 84 SUR 84 REQUÊTES"><div role="row"><span role="cell">a</span></div></div>'),
    ).toContain('shouty-name');
  });

  it('leaves an acronym alone', () => {
    expect(rules('<button type="button" aria-label="RGESN">i</button>')).toEqual([]);
  });

  it('leaves a sentence-case name alone', () => {
    expect(
      rules('<div role="table" aria-label="Relevés, 84 requêtes sur 84"><div role="row"><span role="cell">a</span></div></div>'),
    ).toEqual([]);
  });
});

// `title` is not reachable by keyboard, not shown on touch, and not
// dismissible. three of the five it carried in this app disclosed a limit on
// comparability, which is the last thing to put behind a hover.
describe('the title audit', () => {
  it('catches an explanation the keyboard cannot reach', () => {
    expect(rules('<span title="deux profils, donc pas comparable">coverage varies</span>')).toContain(
      'title-not-reachable',
    );
  });

  it('leaves a title on something focusable alone', () => {
    expect(rules('<button type="button" title="le seuil vient du service">900 KB</button>')).toEqual([]);
  });

  it('leaves an iframe title alone', () => {
    expect(rules('<iframe title="Aperçu de la déclaration"></iframe>')).toEqual([]);
  });
});
