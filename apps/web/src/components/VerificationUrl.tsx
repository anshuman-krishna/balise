import type { CSSProperties } from 'react';
import { Link } from 'react-router';

// the printed url is what a document carries verbatim in its footer. in the
// app it resolves, so the document and the public register are one click
// apart, which is the whole claim the footer is making.
export function VerificationUrl({
  url,
  tone = 'light',
  style,
}: {
  url: string;
  tone?: 'light' | 'dark';
  style?: CSSProperties;
}) {
  const hash = url.slice(url.lastIndexOf('/') + 1);
  return (
    <Link
      to={`/v/${hash}`}
      className={tone === 'dark' ? 'mono verify-link on-dark' : 'mono verify-link'}
      style={style}
    >
      {url}
    </Link>
  );
}
