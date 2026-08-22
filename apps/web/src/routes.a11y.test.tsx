import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppShell } from './layout/AppShell';
import { ROUTES } from './routes';
import { auditMarkup, type A11yFinding } from './lib/a11y';

// the audit runs over every route in the table, so a screen cannot be added
// without being checked. the shell is included because the navigation, the
// skip link and the app bar are on the keyboard path to everything.
function render(route: (typeof ROUTES)[number], path: string): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <AppShell {...route.shell}>{route.screen}</AppShell>
    </MemoryRouter>,
  );
}

/** every state a route renders: its own, plus one per tab it holds. */
function paths(route: (typeof ROUTES)[number]): readonly string[] {
  return [route.sample ?? route.path, ...(route.variants ?? [])];
}

function report(findings: readonly A11yFinding[]): string {
  return findings.map((finding) => `  ${finding.rule}: ${finding.element}\n    ${finding.detail}`).join('\n');
}

describe.each(ROUTES.map((route) => [route.path, route] as const))('%s', (_path, route) => {
  it.each(paths(route))('%s leaves nothing unreachable, unnamed or out of order', (path) => {
    expect(report(auditMarkup(render(route, path)))).toBe('');
  });
});
