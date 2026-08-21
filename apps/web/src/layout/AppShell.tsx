import type { ReactNode } from 'react';
import { NavRail } from './NavRail';
import { AppBar } from './AppBar';
import { CONTENT_LOCALE, t } from '../i18n';

// the public surfaces bring their own header and their own padding, so the
// shell gives them a bare main element.
const MAIN_CLASS = {
  instrument: 'screen',
  document: 'screen-document',
  public: undefined,
} as const;

type Register = keyof typeof MAIN_CLASS;

export function AppShell({
  children,
  showAppBar = true,
  showNav = true,
  register = 'instrument',
}: {
  children: ReactNode;
  showAppBar?: boolean;
  showNav?: boolean;
  register?: Register;
}) {
  return (
    <div className={showNav ? 'app' : 'app app-bare'}>
      {showNav ? (
        <>
          <a className="skip-link" href="#main">
            {t.a11y.skipToContent}
          </a>
          <NavRail />
        </>
      ) : null}
      <div>
        {showAppBar ? <AppBar /> : null}
        {/* documents and public surfaces are french whatever the app chrome is,
            so the content language is declared on the element that carries it
            rather than assumed from the page. */}
        <main id="main" lang={CONTENT_LOCALE[register]} className={MAIN_CLASS[register]}>
          {children}
        </main>
      </div>
    </div>
  );
}
