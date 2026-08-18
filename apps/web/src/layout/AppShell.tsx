import type { ReactNode } from 'react';
import { NavRail } from './NavRail';
import { AppBar } from './AppBar';

// the public surfaces bring their own header and their own padding, so the
// shell gives them a bare main element.
const MAIN_CLASS = {
  instrument: 'screen',
  document: 'screen-document',
  public: undefined,
} as const;

export function AppShell({
  children,
  showAppBar = true,
  register = 'instrument',
}: {
  children: ReactNode;
  showAppBar?: boolean;
  register?: 'instrument' | 'document' | 'public';
}) {
  return (
    <div className="app">
      <NavRail />
      <div>
        {showAppBar ? <AppBar /> : null}
        <main className={MAIN_CLASS[register]}>{children}</main>
      </div>
    </div>
  );
}
