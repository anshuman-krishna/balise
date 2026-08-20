import { describe, expect, it } from 'vitest';
import { catalogs } from '@balise/i18n';
import { findingsCanon } from '../fixtures/findings-canon';
import { findingsView } from './findings-view';

const fr = catalogs.fr;
const en = catalogs.en;

describe('the findings a screen renders', () => {
  it('reads the engine output and adds nothing to it', () => {
    const view = findingsView('scan', fr);
    expect(view.rows.map((row) => row.id)).toEqual(
      findingsCanon.pages.scan!.result.findings.map((finding) => finding.id),
    );
  });

  it('puts a measured quantity with its unit in the mono column', () => {
    const view = findingsView('scan', fr);
    const byId = new Map(view.rows.map((row) => [row.id, row]));
    expect(byId.get('image-weight')!.amount).toBe('650 KB');
    // a count is a count: no unit is invented for it.
    expect(byId.get('reference-dom-node-count')!.amount).toBe('1 830');
  });

  it('never writes a signed number, because a finding is not a delta', () => {
    for (const pageId of Object.keys(findingsCanon.pages)) {
      for (const row of findingsView(pageId, fr).rows) {
        expect(row.amount.startsWith('+')).toBe(false);
        expect(row.amount.startsWith('-')).toBe(false);
        expect(row.amount.startsWith('−')).toBe(false);
      }
    }
  });

  it('states what each share is a share of', () => {
    const view = findingsView('scan', fr);
    const images = view.rows.find((row) => row.id === 'image-weight')!;
    expect(images.sentence).toContain('66.3 %');
    expect(images.sentence).toContain('du poids de la page');
  });

  it('names the published distribution in the sentence that uses it', () => {
    const view = findingsView('scan', fr);
    const dom = view.rows.find((row) => row.id === 'reference-dom-node-count')!;
    expect(dom.sentence).toContain('EcoIndex');
    expect(dom.sentence).toContain('90.2 %');
  });

  it('counts the findings in the title rather than saying three', () => {
    expect(findingsView('scan', fr).title).toBe("4 points d'attention");
    expect(findingsView('candidate', en).title).toBe('6 findings');
  });

  it('carries the withheld findings with the reason and the count', () => {
    const view = findingsView('scan', fr);
    expect(view.withheld).toHaveLength(2);
    expect(view.withheld[0]!.text).toContain('5 fichiers');
    expect(view.withheld[0]!.text).toContain('couverture');
  });

  it('reports coverage evidence in unexecuted bytes, not transferred bytes', () => {
    // the finding is about decoded bytes that never ran. printing the
    // transferred size beside it would pair a sentence about one quantity with
    // a number from another.
    const view = findingsView('candidate', en);
    const unused = view.rows.find((row) => row.id === 'unused-script-bytes')!;
    expect(unused.evidence[0]!.name).toBe('vendor-dates.c40e.js');
    expect(unused.evidence[0]!.amount).toBe('442 KB');
  });

  it('renders the public surface in french whatever the interface locale is', () => {
    const scan = findingsView('scan', fr);
    expect(scan.note).toBe(fr.findings.note);
    expect(scan.note).not.toBe(en.findings.note);
  });

  it('refuses a page the canon does not hold', () => {
    expect(() => findingsView('service', fr)).toThrow(/holds no page/);
  });
});
