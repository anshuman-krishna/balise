import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppShell } from './layout/AppShell';
import { ROUTES } from './routes';
import { auditMarkup, type A11yFinding } from './lib/a11y';

// the audit runs over every route in the table, so a screen cannot be added
// without being checked. the shell is included because the navigation, the
// skip link and the app bar are on the keyboard path to everything.
function render(route: (typeof ROUTES)[number]): string {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[route.sample ?? route.path]}>
      <AppShell {...route.shell}>{route.screen}</AppShell>
    </MemoryRouter>,
  );
}

function report(findings: readonly A11yFinding[]): string {
  return findings.map((finding) => `  ${finding.rule}: ${finding.element}\n    ${finding.detail}`).join('\n');
}

describe.each(ROUTES.map((route) => [route.path, route] as const))('%s', (_path, route) => {
  const findings = auditMarkup(render(route));

  it('leaves nothing on the keyboard path unreachable or unnamed', () => {
    expect(report(findings)).toBe('');
  });
});
