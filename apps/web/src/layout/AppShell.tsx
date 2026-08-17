import type { ReactNode } from 'react';
import { NavRail } from './NavRail';
import { AppBar } from './AppBar';

export function AppShell({
  children,
  showAppBar = true,
  register = 'instrument',
}: {
  children: ReactNode;
  showAppBar?: boolean;
  register?: 'instrument' | 'document';
}) {
  return (
    <div className="app">
      <NavRail />
      <div>
        {showAppBar ? <AppBar /> : null}
        <main className={register === 'document' ? 'screen-document' : 'screen'}>{children}</main>
      </div>
    </div>
  );
}
