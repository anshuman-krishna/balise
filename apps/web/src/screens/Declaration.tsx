import { fill, t } from '../i18n';
import { canon, criteriaFixture, declarationFixture as decl } from '../fixtures/canon';

// the published page repeats the workspace summary; one source of numbers
const summary = criteriaFixture.summary;

// the light chrome tones of the preview frame come from the handoff and have
// no token; they appear only on this grey panel
const FRAME_TEXT = '#e7e8e4';

function Parts({ parts }: { parts: ReadonlyArray<{ text: string; mono?: boolean }> }) {
  return (
    <>
      {parts.map((part, index) =>
        part.mono === true ? (
          <span key={index} className="mono" style={{ fontSize: 10.5 }}>
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function FamilyBar({ family }: { family: (typeof decl.preview.families)[number] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr 52px', gap: 11, alignItems: 'center' }}>
      <span style={{ fontSize: 10.5 }}>{family.name}</span>
      <div style={{ height: 9, background: 'rgba(21,24,27,.08)', display: 'flex' }}>
        <div style={{ width: `${family.ok}%`, background: 'var(--conforme)' }} />
        {family.warn > 0 ? <div style={{ width: `${family.warn}%`, background: 'var(--caution)' }} /> : null}
        {family.bad > 0 ? <div style={{ width: `${family.bad}%`, background: 'var(--breach)' }} /> : null}
      </div>
      <span className="mono" style={{ fontSize: 10, textAlign: 'right' }}>{family.label}</span>
    </div>
  );
}

export function Declaration() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.declarationEditor}</h1>
          <div className="screen-subtitle">
            {fill(t.declaration.subtitle, {
              draft: decl.draft,
              published: decl.published,
              publishedDate: decl.publishedDate,
              reviewDate: decl.reviewDate,
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn" style={{ fontSize: 11, padding: '6px 12px' }}>
            {fill(t.declaration.diffVs, { version: decl.published })}
          </button>
          <button
            type="button"
            className="btn"
            style={{ fontSize: 11, padding: '6px 12px', borderColor: 'var(--ink)', color: 'var(--ink)' }}
          >
            {t.declaration.previewPage}
          </button>
          <button
            type="button"
            disabled
            style={{
              appearance: 'none',
              borderRadius: 0,
              padding: '6px 12px',
              background: 'rgba(21,24,27,.12)',
              border: '1px solid var(--border-strong)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 11,
              color: 'var(--text-tertiary)',
              cursor: 'not-allowed',
            }}
          >
            {t.declaration.publishBlocked}
          </button>
        </div>
      </div>

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1fr 1.15fr', marginTop: 16 }}>
        <div className="stack">
          <div className="card">
            <span className="eyebrow" style={{ color: 'var(--breach)' }}>
              {fill(t.declaration.blockingTitle, { count: decl.blocking.length })}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 13 }}>
              {decl.blocking.map((item, index) => (
                <div key={index} className="left-rule breach">
                  <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    <Parts parts={item.parts} />
                  </div>
                  <div style={{ marginTop: 3, fontSize: 10.5, color: 'var(--text-secondary)' }}>{item.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">{t.declaration.knownGapsTitle}</span>
            <div
              style={{
                marginTop: 12,
                padding: '11px 12px',
                border: '1px solid rgba(21,24,27,.16)',
                background: 'var(--paper)',
                fontSize: 11.5,
                lineHeight: 1.65,
              }}
            >
              {decl.knownGapsText}
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-block',
                  width: 1,
                  height: 13,
                  background: 'var(--measured)',
                  verticalAlign: -2,
                  marginLeft: 1,
                }}
              />
            </div>
            <p style={{ margin: '9px 0 0', fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {t.declaration.knownGapsNote}
            </p>
          </div>

          <div className="card">
            <span className="eyebrow">{t.declaration.versionHistoryTitle}</span>
            <div className="mono" style={{ marginTop: 12, fontSize: 10.5, lineHeight: 1.95 }}>
              {decl.versions.map((version) => (
                <div key={version.tag} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: version.draft ? 'var(--measured)' : 'var(--text-tertiary)' }}>
                    {version.tag}
                    {version.draft ? ` ${t.declaration.draftTag}` : ''}
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {version.date} · {fill(t.declaration.conformeCount, { count: version.conforme })}
                    {version.ledger !== undefined ? ` · ${fill(t.declaration.ledgerRef, { hash: version.ledger })}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--text-secondary)', border: '1px solid var(--border-strong)', padding: '20px 20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 12 }}>
            <span className="eyebrow" style={{ color: 'var(--paper)' }}>{t.declaration.livePreviewTitle}</span>
            <span className="mono" style={{ fontSize: 9.5, color: FRAME_TEXT }}>{decl.preview.url}</span>
          </div>

          <div style={{ background: 'var(--surface)', padding: '26px 28px 28px' }}>
            <div className="mono" style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.12em', color: 'var(--text-secondary)' }}>
              {decl.preview.orgEyebrow}
            </div>
            <h2 className="archivo" style={{ margin: '9px 0 0', fontWeight: 600, fontSize: 21, lineHeight: 1.2 }}>
              {t.declaration.preview.heading}
            </h2>
            <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {fill(t.declaration.preview.meta, {
                service: canon.service.title,
                date: decl.preview.establishedDate,
                referential: decl.preview.referential,
              })}
            </div>

            <div
              style={{
                display: 'flex',
                marginTop: 20,
                borderTop: '1px solid var(--ink)',
                borderBottom: '1px solid rgba(21,24,27,.18)',
              }}
            >
              <div style={{ flex: 1, padding: '13px 0' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{t.declaration.preview.taux}</div>
                <div className="mono" style={{ fontSize: 26, letterSpacing: '-.03em' }}>{summary.tauxPct}%</div>
              </div>
              <div style={{ flex: 1, padding: '13px 0' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{t.declaration.preview.conformes}</div>
                <div className="mono" style={{ fontSize: 26, letterSpacing: '-.03em' }}>
                  {summary.tauxDone}
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>/{summary.tauxTotal}</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: '13px 0' }}>
                <div className="mono" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
                  {t.declaration.preview.nonConformes}
                </div>
                <div className="mono" style={{ fontSize: 26, letterSpacing: '-.03em', color: 'var(--breach)' }}>
                  {summary.nonConforme}
                </div>
              </div>
            </div>

            <div
              className="archivo"
              style={{
                marginTop: 18,
                fontWeight: 600,
                fontSize: 9,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              {t.declaration.preview.familyTitle}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 11 }}>
              {decl.preview.families.map((family) => (
                <FamilyBar key={family.name} family={family} />
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid rgba(21,24,27,.18)',
                fontSize: 10.5,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
              }}
            >
              {fill(t.declaration.preview.hosting, {
                host: decl.preview.host,
                date: decl.preview.verifiedDate,
                version: decl.preview.methodologyVersion,
              })}{' '}
              <span className="mono" style={{ fontSize: 9.5, color: 'var(--measured)' }}>{decl.preview.verifyUrl}</span>.
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono" style={{ fontSize: 9.5, color: FRAME_TEXT }}>{t.declaration.footerBadge}</span>
            <span style={{ display: 'inline-flex', alignItems: 'stretch', border: '1px solid rgba(21,24,27,.3)', background: 'var(--surface)' }}>
              <span
                className="archivo"
                style={{
                  padding: '5px 8px',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  fontWeight: 600,
                  fontSize: 8,
                  letterSpacing: '.12em',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                BALISE
              </span>
              <span style={{ padding: '5px 9px', fontSize: 9.5 }}>
                {t.declaration.preview.badgeName} <span className="mono">{summary.tauxPct}%</span> · {decl.preview.badgeDate}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
