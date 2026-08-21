import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/public-sans';
import '@fontsource-variable/martian-mono';
import './styles/app.css';

import { locale } from './i18n';
import { AppShell } from './layout/AppShell';
import { ROUTES } from './routes';

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
        {ROUTES.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<AppShell {...route.shell}>{route.screen}</AppShell>}
          />
        ))}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
