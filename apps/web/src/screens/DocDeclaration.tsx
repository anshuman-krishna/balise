import { fill, t } from '../i18n';
import { canon, documentsFixture } from '../fixtures/canon';
import { criteriaCanon } from '../fixtures/criteria-canon';
import { conformityPct, nonConformeRows } from '../lib/criteria-view';
import { DocumentRegister } from '../components/DocumentRegister';
import { VerificationUrl } from '../components/VerificationUrl';

const doc = documentsFixture.declaration;
// the published document counts the same assessments the editor does. a
// declaration that named a criterion the referential does not have would not
// survive one reading by an auditor.
const stats = {
  taux: conformityPct(),
  conformes: criteriaCanon.completion.conforme,
  applicables: criteriaCanon.completion.applicable,
  partiels: criteriaCanon.byStatus.partiellement_conforme,
  nonConformes: criteriaCanon.byStatus.non_conforme,
};
const nonConformes = nonConformeRows();

export function DocDeclaration() {
  return (
    <DocumentRegister
      eyebrowSuffix={t.docs.publishedPage}
      title={
        <>
          {doc.url} · {fill(t.docs.draft, { version: doc.version })}
        </>
      }
      actions={
        <button type="button" className="btn btn-on-dark" style={{ fontSize: 11, padding: '6px 12px' }}>
          {t.docs.backToEditor}
        </button>
      }
      maxWidth={820}
    >
      <div className="doc-page" style={{ padding: '60px 68px 48px' }}>
        <div className="mono" style={{ fontWeight: 500, fontSize: 10, letterSpacing: '.14em', color: 'var(--text-secondary)' }}>
          {canon.service.organisation.toUpperCase()}
        </div>
        <h2 className="archivo" style={{ margin: '14px 0 0', fontWeight: 700, fontSize: 30, lineHeight: 1.15, letterSpacing: '-.01em' }}>
          {t.declaration.preview.heading}
        </h2>
        <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.75, color: 'var(--text-secondary)', maxWidth: '58ch' }}>
          {t.docDeclaration.intro1} <strong style={{ color: 'var(--ink)' }}>{canon.service.title.toLowerCase()}</strong>{' '}
          {fill(t.docDeclaration.intro2, { domain: canon.service.domain, reviewDate: doc.reviewDate })}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            marginTop: 34,
            borderTop: '1px solid var(--ink)',
            borderBottom: '1px solid rgba(21,24,27,.2)',
          }}
        >
          <div style={{ padding: '18px 18px 18px 0', borderRight: '1px solid var(--border-card)' }}>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>{t.docDeclaration.stats.taux}</div>
            <div className="mono" style={{ marginTop: 6, fontSize: 30, letterSpacing: '-.03em' }}>{stats.taux}%</div>
            <div className="mono" style={{ marginTop: 3, fontSize: 9, color: 'var(--text-secondary)' }}>
              {fill(t.docDeclaration.stats.tauxSub, { conformes: stats.conformes, applicables: stats.applicables })}
            </div>
          </div>
          <div style={{ padding: 18, borderRight: '1px solid var(--border-card)' }}>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>{t.docDeclaration.stats.partiels}</div>
            <div className="mono" style={{ marginTop: 6, fontSize: 30, letterSpacing: '-.03em', color: 'var(--caution)' }}>
              {stats.partiels}
            </div>
            <div className="mono" style={{ marginTop: 3, fontSize: 9, color: 'var(--text-secondary)' }}>
              {t.docDeclaration.stats.partielsSub}
            </div>
          </div>
          <div style={{ padding: '18px 0 18px 18px' }}>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>{t.docDeclaration.stats.nonConformes}</div>
            <div className="mono" style={{ marginTop: 6, fontSize: 30, letterSpacing: '-.03em', color: 'var(--breach)' }}>
              {stats.nonConformes}
            </div>
            <div className="mono" style={{ marginTop: 3, fontSize: 9, color: 'var(--text-secondary)' }}>
              {t.docDeclaration.stats.nonConformesSub}
            </div>
          </div>
        </div>

        <h3 className="archivo" style={{ margin: '36px 0 0', fontWeight: 600, fontSize: 14 }}>
          {t.docDeclaration.nonConformesTitle}
        </h3>
        <div style={{ marginTop: 14 }}>
          <div
            className="mono"
            style={{
              display: 'grid',
              gridTemplateColumns: '50px 1.9fr 1.4fr',
              gap: '0 16px',
              paddingBottom: 8,
              borderBottom: '1px solid var(--ink)',
              fontWeight: 500,
              fontSize: 9,
              letterSpacing: '.08em',
              color: 'var(--text-secondary)',
            }}
          >
            <span>{t.docDeclaration.headers.id}</span>
            <span>{t.docDeclaration.headers.criterion}</span>
            <span>{t.docDeclaration.headers.justification}</span>
          </div>
          {nonConformes.map((row, index) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1.9fr 1.4fr',
                gap: '0 16px',
                padding: '10px 0',
                borderBottom: index < nonConformes.length - 1 ? '1px solid rgba(21,24,27,.12)' : undefined,
                fontSize: 11,
                lineHeight: 1.6,
              }}
            >
              <span className="mono" style={{ fontSize: 10 }}>{row.id}</span>
              <span>{row.statementFr}</span>
              <span style={{ color: row.justification === null ? 'var(--breach)' : 'var(--text-secondary)' }}>
                {row.justification ?? t.docDeclaration.justificationMissing}
              </span>
            </div>
          ))}
        </div>

        <h3 className="archivo" style={{ margin: '32px 0 0', fontWeight: 600, fontSize: 14 }}>
          {t.docDeclaration.hostingTitle}
        </h3>
        <p style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.8, maxWidth: '60ch' }}>
          {fill(t.docDeclaration.hostingBody, {
            verifiedDate: doc.established,
            since: doc.since,
            methodology: doc.methodology,
          })}
        </p>

        <div
          style={{
            marginTop: 34,
            padding: '16px 18px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-tertiary)' }}>{t.docDeclaration.hashLabel}</div>
            <div className="mono" style={{ marginTop: 4, fontSize: 11 }}>{doc.hash}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-tertiary)' }}>{t.docDeclaration.verificationLabel}</div>
            <VerificationUrl url={doc.verifyUrl} tone="dark" style={{ display: 'block', marginTop: 4, fontSize: 11 }} />
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 10, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {fill(t.docDeclaration.footer, { date: doc.established, contact: doc.contact })}
        </div>
      </div>
    </DocumentRegister>
  );
}
