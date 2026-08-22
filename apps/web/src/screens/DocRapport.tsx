import { formatInt } from '@balise/ui';
import { fill, t, tFr } from '../i18n';
import { canon, documentsFixture, type DocEventPart } from '../fixtures/canon';
import { DocumentRegister } from '../components/DocumentRegister';
import { VerificationUrl } from '../components/VerificationUrl';
import {
  gaugeTone,
  marginText,
  measuredText,
  signedEngagements,
  statusColor,
  statusText,
  thresholdText,
} from '../lib/engagement-view';

const doc = documentsFixture.rapport;

/**
 * only the engagements the contract carries.
 *
 * the version this replaces held a fourth row reporting the supplier
 * `nonTenu` on the third-party share, which is a declaration of contractual
 * breach, for a commitment the tender left unchecked and this contract does
 * not contain. two paragraphs below it, on the same page, the écarts narrative
 * calls the same figure a target "que nous nous fixons". a report that
 * contradicts itself about whether the supplier is in breach is worse for the
 * supplier than no report.
 */
const rows = signedEngagements();

const GRID = '1.8fr 84px 84px 1fr 92px';

const GAUGE_TONE = {
  held: { fill: 'var(--ink)', opacity: 0.55, marker: true },
  caution: { fill: 'var(--caution)', opacity: 1, marker: true },
  breach: { fill: 'var(--breach)', opacity: 1, marker: false },
} as const;


function Gauge({ fillPct, tone }: { fillPct: number; tone: keyof typeof GAUGE_TONE }) {
  const spec = GAUGE_TONE[tone];
  const fillWidth = (fillPct / 100) * 120;
  return (
    <svg viewBox="0 0 120 12" width="120" height="12" aria-hidden="true">
      <rect x="0" y="4" width="120" height="4" fill="var(--ink)" fillOpacity=".1" />
      <rect x="0" y="4" width={fillWidth} height="4" fill={spec.fill} fillOpacity={spec.opacity} />
      {spec.marker ? <line x1={fillWidth} y1="1" x2={fillWidth} y2="11" stroke={spec.fill} strokeWidth="1.4" /> : null}
    </svg>
  );
}

function EventParts({ parts }: { parts: readonly DocEventPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.mono === true ? (
          <span key={index} className="mono" style={{ fontSize: 10 }}>
            {part.text}
          </span>
        ) : part.strong === true ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

export function DocRapport() {
  return (
    <DocumentRegister
      title={
        <>
          {t.nav.items.docRapport} {doc.quarterLabel} ·{' '}
          <span className="mono" style={{ fontSize: 11.5 }}>{fill(t.docRapport.marcheRef, { ref: doc.ref })}</span>
        </>
      }
      actions={
        <>
          <button type="button" className="btn btn-on-dark" style={{ fontSize: 11, padding: '6px 12px' }}>
            {t.docs.backToTracker}
          </button>
          <button type="button" className="btn-doc-primary">{t.docs.anchorSend}</button>
        </>
      }
      maxWidth={820}
    >
      <div className="doc-page" style={{ padding: '58px 68px 46px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: 14,
            borderBottom: '2px solid var(--ink)',
          }}
        >
          <div>
            <div className="archivo" style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.06em' }}>
              {canon.tenant.agency.toUpperCase()}
            </div>
            <div className="mono" style={{ marginTop: 3, fontSize: 9, color: 'var(--text-secondary)' }}>
              {fill(t.docRapport.holder, { ref: doc.ref })}
            </div>
          </div>
          <div className="mono" style={{ textAlign: 'right', fontSize: 9, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {fill(t.docRapport.headRight1, { quarter: doc.quarter })}
            <br />
            {fill(t.docRapport.headRight2, { period: doc.period })}
            <br />
            {fill(t.docRapport.headRight3, { article: doc.article })}
          </div>
        </div>

        <h1 className="archivo" style={{ margin: '32px 0 0', fontWeight: 700, fontSize: 24, lineHeight: 1.2, letterSpacing: '-.01em' }}>
          {t.docRapport.title}
        </h1>
        <p style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', maxWidth: '58ch' }}>
          {fill(t.docRapport.intro, { runs: formatInt(doc.runs) })}
        </p>

        <div role="table" aria-label={tFr.a11y.tables.reportCommitments} style={{ marginTop: 28 }}>
          <div
            role="row"
            className="mono"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 14px',
              paddingBottom: 8,
              borderBottom: '1px solid var(--ink)',
              fontWeight: 500,
              fontSize: 9,
              letterSpacing: '.08em',
              color: 'var(--text-secondary)',
            }}
          >
            <span role="columnheader">{t.docRapport.headers.engagement}</span>
            <span role="columnheader" style={{ textAlign: 'right' }}>{t.docRapport.headers.seuil}</span>
            <span role="columnheader" style={{ textAlign: 'right' }}>{t.docRapport.headers.t3}</span>
            <span role="columnheader">{t.docRapport.headers.marge}</span>
            <span role="columnheader" style={{ textAlign: 'right' }}>{t.docRapport.headers.etat}</span>
          </div>
          {rows.map((row, index) => (
            <div
              key={row.id}
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: '0 14px',
                padding: '11px 0',
                borderBottom: index < rows.length - 1 ? '1px solid rgba(21,24,27,.12)' : undefined,
                alignItems: 'center',
                fontSize: 11,
              }}
            >
              <span role="cell">{row.labelFr}</span>
              <span role="cell" className="mono" style={{ textAlign: 'right' }}>{thresholdText(row, tFr)}</span>
              <span
                role="cell"
                className="mono"
                style={{ textAlign: 'right', color: row.status === 'nonTenu' ? 'var(--breach)' : 'var(--ink)' }}
              >
                {measuredText(row)}
              </span>
              {/* the gauge is drawn and hidden, so the cell carries the figure
                  it draws. */}
              <span role="cell" aria-label={marginText(row, tFr)}>
                <Gauge fillPct={row.gaugePct ?? 0} tone={gaugeTone(row)} />
              </span>
              <span role="cell" className="mono" style={{ fontSize: 9.5, textAlign: 'right', color: statusColor(row) }}>
                {statusText(row, tFr)}
              </span>
            </div>
          ))}
        </div>

        <h2 className="archivo" style={{ margin: '30px 0 0', fontWeight: 600, fontSize: 13 }}>{t.docRapport.eventsTitle}</h2>
        <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.85 }}>
          {doc.events.map((event, index) => (
            <div
              key={event.date}
              style={{
                display: 'grid',
                gridTemplateColumns: '74px 1fr',
                gap: 14,
                padding: '6px 0',
                borderBottom: index < doc.events.length - 1 ? '1px solid rgba(21,24,27,.1)' : undefined,
              }}
            >
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{event.date}</span>
              <span>
                <EventParts parts={event.parts} />
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 26, padding: '14px 16px', border: '1px solid var(--border-strongest)', fontSize: 11, lineHeight: 1.7 }}>
          <strong>{t.docRapport.calloutStrong}</strong> {doc.calloutBody}
        </div>

        <div
          style={{
            marginTop: 32,
            paddingTop: 14,
            borderTop: '1px solid rgba(21,24,27,.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 20,
          }}
        >
          <div className="mono" style={{ fontSize: 8.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {doc.footerLine1}
            <br />
            {doc.footerLine2}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>{t.docRapport.hashLabel}</div>
            <div className="mono" style={{ marginTop: 4, fontSize: 10 }}>{doc.hash}</div>
            <VerificationUrl url={doc.verifyUrl} style={{ display: 'block', marginTop: 4, fontSize: 9 }} />
          </div>
        </div>
      </div>
    </DocumentRegister>
  );
}
