import { fill, t } from '../i18n';

// the designed empty state for surfaces that exist in the reference but are
// not yet built. it states the absence; it does not fake content.
export function Placeholder({ title, version }: { title: string; version: string }) {
  return (
    <>
      <span className="eyebrow">{t.placeholder.eyebrow}</span>
      <h1 className="screen-title" style={{ marginTop: 8 }}>
        {title}
      </h1>
      <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '56ch' }}>
        {fill(t.placeholder.body, { version })} {t.placeholder.reference}
      </p>
    </>
  );
}
