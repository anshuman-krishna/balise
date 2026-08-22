import type { ReactElement } from 'react';

import type { AppShellProps } from './layout/AppShell';
import { ledgerCanon } from './fixtures/ledger-canon';
import { RUN_TABS } from './screens/RunDetail';
import { BUDGET_VIEWS } from './screens/Budgets';
import { CHECK_VIEWS } from './screens/PrCheck';
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

export interface AppRoute {
  path: string;
  /** the screen, unwrapped. the shell is applied by whoever mounts it. */
  screen: ReactElement;
  /** how the shell dresses it: navigation, app bar, content language. */
  shell: Omit<AppShellProps, 'children'>;
  /** a concrete path for a parameterised route, so an audit can visit it. */
  sample?: string;
  /**
   * the other states this route renders, as paths. a tabbed screen shows one
   * panel at a time, so without these an audit covers the first and none of
   * the rest.
   */
  variants?: readonly string[];
}

const APP: Omit<AppShellProps, 'children'> = {};
const DOCUMENT: Omit<AppShellProps, 'children'> = { showAppBar: false, register: 'document' };
const PUBLIC: Omit<AppShellProps, 'children'> = { showAppBar: false, register: 'public' };

// one table, so that adding a screen adds it to the navigation audit as well
// as to the router. a screen reachable from the rail and absent here would be
// a screen nothing checks.
export const ROUTES: readonly AppRoute[] = [
  { path: '/', screen: <Dashboard />, shell: APP },
  { path: '/runs', screen: <RunDetail />, shell: APP, variants: RUN_TABS.map((tab) => `/runs?tab=${tab}`) },
  { path: '/comparison', screen: <Comparison />, shell: APP },
  {
    path: '/budgets',
    screen: <Budgets />,
    shell: APP,
    variants: BUDGET_VIEWS.map((view) => `/budgets?view=${view}`),
  },
  { path: '/criteria', screen: <Criteria />, shell: APP },
  { path: '/declaration', screen: <Declaration />, shell: APP },
  { path: '/tender', screen: <Tender />, shell: APP },
  { path: '/contract', screen: <Contract />, shell: APP },
  { path: '/fleet', screen: <Fleet />, shell: APP },
  {
    path: '/pr-check',
    screen: <PrCheck />,
    shell: APP,
    variants: CHECK_VIEWS.map((view) => `/pr-check?view=${view}`),
  },
  { path: '/documents/declaration', screen: <DocDeclaration />, shell: DOCUMENT },
  { path: '/documents/annexe', screen: <DocAnnexe />, shell: DOCUMENT },
  { path: '/documents/rapport', screen: <DocRapport />, shell: DOCUMENT },
  { path: '/public/scan', screen: <FreeScan />, shell: PUBLIC },
  { path: '/public/observatory', screen: <Observatory />, shell: PUBLIC },
  { path: '/public/ledger', screen: <LedgerVerification />, shell: PUBLIC },
  // the verification permalink printed on every document. it must resolve with
  // no session, so it carries no navigation and no app bar. it still needs a
  // main landmark and a content language, which is what the bare shell gives it.
  {
    path: '/v/:hash',
    screen: <LedgerVerification />,
    shell: { showNav: false, showAppBar: false, register: 'public' },
    // a real empreinte from the register, so the audited path is the one a
    // document footer prints rather than a string that resolves to nothing.
    sample: `/v/${ledgerCanon.entries[0]!.entryHash.slice(0, 12)}`,
  },
];
