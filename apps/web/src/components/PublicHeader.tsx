import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';

// the public surfaces carry no app chrome: no service switcher, no
// fingerprint row, no tenant. this bar is all they get, and it is the same
// on all three so a permalink looks like the observatory it came from.
export function PublicHeader({ path, links }: { path?: string; links?: ReactNode }) {
  return (
    <div className="public-header">
      <Wordmark size={14} onDark={false} />
      <span className="public-wordmark">BALISE</span>
      {path !== undefined ? (
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
          {path}
        </span>
      ) : null}
      {links !== undefined ? <span className="public-links">{links}</span> : null}
    </div>
  );
}
