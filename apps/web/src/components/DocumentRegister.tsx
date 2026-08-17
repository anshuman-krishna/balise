import type { ReactNode } from 'react';
import { t } from '../i18n';

// shared chrome for the print register: the dark surround, the register
// header with actions, and the column of white pages below it.
export function DocumentRegister({
  eyebrowSuffix,
  title,
  actions,
  maxWidth,
  children,
}: {
  eyebrowSuffix?: string;
  title: ReactNode;
  actions: ReactNode;
  maxWidth: number;
  children: ReactNode;
}) {
  return (
    <>
      <div className="doc-chrome" style={{ maxWidth }}>
        <div>
          <div className="doc-chrome-eyebrow">
            {t.docs.register}
            {eyebrowSuffix !== undefined ? ` · ${eyebrowSuffix}` : ''}
          </div>
          <div className="doc-chrome-title">{title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
      </div>
      <div className="doc-pages" style={{ maxWidth }}>
        {children}
      </div>
    </>
  );
}
