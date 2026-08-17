import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/public-sans';
import '@fontsource-variable/martian-mono';
import './styles/app.css';

import { AppShell } from './layout/AppShell';
import { Dashboard } from './screens/Dashboard';
import { Placeholder } from './screens/Placeholder';
import { t } from './i18n';

interface PlannedScreen {
  path: string;
  title: string;
  version: string;
  appBar: boolean;
}

const planned: PlannedScreen[] = [
  { path: '/runs', title: t.nav.items.runDetail, version: 'V0.1', appBar: true },
  { path: '/comparison', title: t.nav.items.comparison, version: 'V0.1', appBar: true },
  { path: '/budgets', title: t.nav.items.budgets, version: 'V0.2', appBar: true },
  { path: '/criteria', title: t.nav.items.criteria, version: 'V0.3', appBar: true },
  { path: '/declaration', title: t.nav.items.declarationEditor, version: 'V0.3', appBar: true },
  { path: '/tender', title: t.nav.items.tenderWorkspace, version: 'V0.4', appBar: true },
  { path: '/contract', title: t.nav.items.contractTracker, version: 'V0.4', appBar: true },
  { path: '/fleet', title: t.nav.items.fleet, version: 'V0.4', appBar: true },
  { path: '/pr-check', title: t.nav.items.prCheck, version: 'V0.2', appBar: true },
  { path: '/documents/declaration', title: t.nav.items.docDeclaration, version: 'V0.5', appBar: false },
  { path: '/documents/annexe', title: t.nav.items.docAnnexe, version: 'V0.5', appBar: false },
  { path: '/documents/rapport', title: t.nav.items.docRapport, version: 'V0.5', appBar: false },
  { path: '/public/scan', title: t.nav.items.freeScan, version: 'V0.6', appBar: false },
  { path: '/public/observatory', title: t.nav.items.observatory, version: 'V0.6', appBar: false },
  { path: '/public/ledger', title: t.nav.items.ledgerVerification, version: 'V0.6', appBar: false },
];

const root = document.getElementById('root');
if (!root) {
  throw new Error('root element missing');
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />
        {planned.map((screen) => (
          <Route
            key={screen.path}
            path={screen.path}
            element={
              <AppShell showAppBar={screen.appBar}>
                <Placeholder title={screen.title} version={screen.version} />
              </AppShell>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
