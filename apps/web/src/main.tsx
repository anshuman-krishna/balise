import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/public-sans';
import '@fontsource-variable/martian-mono';
import './styles/app.css';

import { locale } from './i18n';
import { AppShell } from './layout/AppShell';
import { Dashboard } from './screens/Dashboard';
import { RunDetail } from './screens/RunDetail';
import { Comparison } from './screens/Comparison';
import { Budgets } from './screens/Budgets';
import { Criteria } from './screens/Criteria';
import { Declaration } from './screens/Declaration';
import { Tender } from './screens/Tender';
import { Contract } from './screens/Contract';
import { Fleet } from './screens/Fleet';
import { DocDeclaration } from './screens/DocDeclaration';
import { DocAnnexe } from './screens/DocAnnexe';
import { DocRapport } from './screens/DocRapport';
import { PrCheck } from './screens/PrCheck';
import { FreeScan } from './screens/FreeScan';
import { Observatory } from './screens/Observatory';
import { LedgerVerification } from './screens/LedgerVerification';

const root = document.getElementById('root');
if (!root) {
  throw new Error('root element missing');
}

// index.html carries a static lang for the first paint; this is the source of
// truth, so flipping the app locale cannot leave the document declaring the
// wrong one. french content marks itself, per register, in AppShell.
document.documentElement.lang = locale;

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
        <Route
          path="/runs"
          element={
            <AppShell>
              <RunDetail />
            </AppShell>
          }
        />
        <Route
          path="/comparison"
          element={
            <AppShell>
              <Comparison />
            </AppShell>
          }
        />
        <Route
          path="/budgets"
          element={
            <AppShell>
              <Budgets />
            </AppShell>
          }
        />
        <Route
          path="/criteria"
          element={
            <AppShell>
              <Criteria />
            </AppShell>
          }
        />
        <Route
          path="/declaration"
          element={
            <AppShell>
              <Declaration />
            </AppShell>
          }
        />
        <Route
          path="/tender"
          element={
            <AppShell>
              <Tender />
            </AppShell>
          }
        />
        <Route
          path="/contract"
          element={
            <AppShell>
              <Contract />
            </AppShell>
          }
        />
        <Route
          path="/fleet"
          element={
            <AppShell>
              <Fleet />
            </AppShell>
          }
        />
        <Route
          path="/pr-check"
          element={
            <AppShell>
              <PrCheck />
            </AppShell>
          }
        />
        <Route
          path="/documents/declaration"
          element={
            <AppShell showAppBar={false} register="document">
              <DocDeclaration />
            </AppShell>
          }
        />
        <Route
          path="/documents/annexe"
          element={
            <AppShell showAppBar={false} register="document">
              <DocAnnexe />
            </AppShell>
          }
        />
        <Route
          path="/documents/rapport"
          element={
            <AppShell showAppBar={false} register="document">
              <DocRapport />
            </AppShell>
          }
        />
        <Route
          path="/public/scan"
          element={
            <AppShell showAppBar={false} register="public">
              <FreeScan />
            </AppShell>
          }
        />
        <Route
          path="/public/observatory"
          element={
            <AppShell showAppBar={false} register="public">
              <Observatory />
            </AppShell>
          }
        />
        <Route
          path="/public/ledger"
          element={
            <AppShell showAppBar={false} register="public">
              <LedgerVerification />
            </AppShell>
          }
        />
        {/* the verification permalink printed on every document. it must
            resolve with no session, so it carries no navigation and no app bar.
            it still needs a main landmark and a content language, which is what
            the bare shell gives it. */}
        <Route
          path="/v/:hash"
          element={
            <AppShell showNav={false} showAppBar={false} register="public">
              <LedgerVerification />
            </AppShell>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
