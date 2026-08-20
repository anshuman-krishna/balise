import { formatMeasured, ToleranceBand } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon, documentsFixture, tenderFixture } from '../fixtures/canon';
import { conformityPct } from '../lib/criteria-view';
import { signedEngagements } from '../lib/engagement-view';
import {
  bandModelNames,
  carbonAsides,
  carbonPage,
  carbonScale,
  formatCarbon,
  referenceModelRef,
  referenceSpecLabel,
} from '../lib/carbon-view';

// fig. 3 is the estimate the dashboard shows, drawn through the same component
// in the print register. the document and the app cannot state two figures.
const fig3 = carbonPage('dashboard');
const fig3Axis = carbonScale(fig3);
const fig3Aside = carbonAsides(fig3)[0] ?? null;
const fig3AsideOutput = fig3.aside[0] ?? null;
import { DocumentRegister } from '../components/DocumentRegister';
import { VerificationUrl } from '../components/VerificationUrl';

const doc = documentsFixture.annexe;
// the conformity figure on the cover is the one the declaration prints, read
// from the same assessments rather than typed twice.
const coverStats = doc.coverStats.map((stat) => {
  if (stat.value === '%') return { value: `${conformityPct()}%` };
  // the annexe accompanies the offer, so it states the engagements the offer
  // carries and counts them rather than repeating a number.
  if (stat.value === '#') return { value: String(signedEngagements().length) };
  return stat;
});

const STAT_LABELS = [
  () => t.docAnnexe.stats.since,
  () => t.docAnnexe.stats.runs,
  () => t.docAnnexe.stats.conformity,
  () => t.docAnnexe.stats.commitments,
];

// the stamp mark from the handoff: a deterministic visual seal, not a real
// qr code
const STAMP_CELLS = [
  [7, 7, 6, 6],
  [17, 7, 3, 6],
  [24, 7, 6, 3],
  [33, 7, 6, 6],
  [7, 17, 3, 6],
  [14, 17, 6, 3],
  [24, 20, 3, 6],
  [31, 17, 6, 6],
  [7, 27, 6, 3],
  [17, 30, 6, 6],
  [27, 27, 3, 6],
  [33, 33, 6, 6],
  [7, 33, 6, 6],
] as const;

function HashBlock({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>{label}</div>
      <div className="mono" style={{ marginTop: 4, fontSize: 9.5, letterSpacing: '.04em' }}>{doc.hash}</div>
      <VerificationUrl url={doc.verifyUrl} style={{ display: 'block', marginTop: 4, fontSize: 9 }} />
    </div>
  );
}

export function DocAnnexe() {
  return (
    <DocumentRegister
      title={
        <>
          {t.nav.items.docAnnexe} · <span className="mono" style={{ fontSize: 11.5 }}>{doc.ref}</span> ·{' '}
          {tenderFixture.output.branding}
        </>
      }
      actions={
        <>
          <button type="button" className="btn btn-on-dark" style={{ fontSize: 11, padding: '6px 12px' }}>
            {t.docs.backToWorkspace}
          </button>
          <button type="button" className="btn-doc-primary">{t.docs.exportPdf}</button>
        </>
      }
      maxWidth={1000}
    >
      <div className="doc-page" style={{ padding: '64px 72px 52px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: 16,
            borderBottom: '2px solid var(--ink)',
          }}
        >
          <div>
            <div className="archivo" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '.06em' }}>{doc.agencyName}</div>
            <div className="mono" style={{ marginTop: 3, fontSize: 9.5, color: 'var(--text-secondary)' }}>{doc.agencyLine}</div>
          </div>
          <div className="mono" style={{ textAlign: 'right', fontSize: 9.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {t.docAnnexe.memoire}
            <br />
            {t.docAnnexe.annexeLine}
            <br />
            {doc.date}
          </div>
        </div>

        <div style={{ marginTop: 56 }}>
          <div className="mono" style={{ fontWeight: 500, fontSize: 10, letterSpacing: '.14em', color: 'var(--text-secondary)' }}>
            {fill(t.docAnnexe.consultation, { ref: doc.ref })}
          </div>
          <h2
            className="archivo"
            style={{ margin: '16px 0 0', fontWeight: 700, fontSize: 33, lineHeight: 1.15, letterSpacing: '-.01em', maxWidth: '22ch' }}
          >
            {t.docAnnexe.title}
          </h2>
          <div style={{ marginTop: 18, fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '56ch' }}>
            {fill(t.docAnnexe.lede, { title: tenderFixture.title, organisation: canon.service.organisation })}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            marginTop: 56,
            borderTop: '1px solid var(--ink)',
            borderBottom: '1px solid rgba(21,24,27,.2)',
          }}
        >
          {coverStats.map((stat, index) => (
            <div
              key={STAT_LABELS[index]!()}
              style={{
                padding: index === 0 ? '16px 16px 16px 0' : index === 3 ? '16px 0 16px 16px' : 16,
                borderRight: index < 3 ? '1px solid var(--border-card)' : undefined,
              }}
            >
              <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-secondary)' }}>{STAT_LABELS[index]!()}</div>
              <div className="mono" style={{ marginTop: 5, fontSize: 17, letterSpacing: '-.02em' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 30 }}>
          <div style={{ fontSize: 10, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '44ch' }}>
            {tenderFixture.output.methodLine}
          </div>
          <div style={{ flex: 'none' }}>
            <HashBlock label={t.docAnnexe.docHashLabel} />
          </div>
        </div>
      </div>

      <div className="doc-page" style={{ padding: '58px 72px 46px' }}>
        <div
          className="mono"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 9,
            color: 'var(--text-secondary)',
            paddingBottom: 9,
            borderBottom: '1px solid rgba(21,24,27,.2)',
          }}
        >
          <span>
            {doc.agencyName} · {doc.ref}
          </span>
          <span>{fill(t.docAnnexe.runningRight, { page: doc.page, pages: doc.pages })}</span>
        </div>

        <h3 className="archivo" style={{ margin: '34px 0 0', fontWeight: 600, fontSize: 17 }}>{t.docAnnexe.section2Title}</h3>
        <p style={{ margin: '14px 0 0', fontSize: 12.5, lineHeight: 1.8, maxWidth: '62ch' }}>{t.docAnnexe.section2Body}</p>

        <div style={{ marginTop: 26 }}>
          <div className="mono" style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.12em', color: 'var(--text-secondary)' }}>
            {t.docAnnexe.figLabel}
          </div>
          <div style={{ marginTop: 16 }}>
            <ToleranceBand
              size="canonical"
              register="print"
              width={480}
              scaleMin={fig3Axis.min}
              scaleMax={fig3Axis.max}
              median={fig3.band.reference}
              bandLow={fig3.band.low}
              bandHigh={fig3.band.high}
              {...(fig3.noise === null ? {} : { noiseLow: fig3.noise.low, noiseHigh: fig3.noise.high })}
              referenceModel={referenceModelRef()}
              confidence="high"
              unitLabel={t.dashboard.tiles.carbonUnit}
              formatTick={(value) => value.toFixed(2).replace('.', ',')}
            />
          </div>
          <div style={{ marginTop: 9, fontSize: 9.5, lineHeight: 1.65, color: 'var(--text-secondary)', maxWidth: '64ch' }}>
            {fill(t.docAnnexe.figCaption, {
              band: bandModelNames(fig3),
              floor: fig3.noise === null ? '0' : formatMeasured(fig3.noise.floorBytes, 'bytes'),
              reference: referenceSpecLabel(fig3),
            })}
            {/* the model outside the band is named in the document too. a
                figure a buyer can check has to say what was left out of it. */}
            {fig3Aside === null || fig3AsideOutput === null ? null : (
              <div style={{ marginTop: 5 }}>
                {fill(t.docAnnexe.figCaptionAside, {
                  model: `${fig3Aside.id} v${fig3AsideOutput.specVersion}`,
                  headline: fig3Aside.headline,
                  value: formatCarbon(fig3AsideOutput.value).replace('.', ','),
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <div
            className="mono"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.7fr 100px 100px 1fr',
              gap: '0 16px',
              paddingBottom: 8,
              borderBottom: '1px solid var(--ink)',
              fontWeight: 500,
              fontSize: 9,
              letterSpacing: '.08em',
              color: 'var(--text-secondary)',
            }}
          >
            <span>{t.docAnnexe.headers.indicator}</span>
            <span style={{ textAlign: 'right' }}>{t.docAnnexe.headers.median}</span>
            <span style={{ textAlign: 'right' }}>{t.docAnnexe.headers.mad}</span>
            <span>{t.docAnnexe.headers.confidence}</span>
          </div>
          {doc.indicators.map((row, index) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.7fr 100px 100px 1fr',
                gap: '0 16px',
                padding: '9px 0',
                borderBottom: index < doc.indicators.length - 1 ? '1px solid rgba(21,24,27,.12)' : undefined,
                fontSize: 11,
              }}
            >
              <span>{row.label}</span>
              <span className="mono" style={{ textAlign: 'right' }}>{row.median}</span>
              <span className="mono" style={{ textAlign: 'right' }}>{row.mad}</span>
              <span className="mono" style={{ fontSize: 10, color: row.conf === 'medium' ? 'var(--caution)' : 'var(--ink)' }}>
                {row.conf === 'medium' ? t.docAnnexe.confMedium : t.docAnnexe.confHigh}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, padding: '13px 15px', border: '1px solid var(--border-strongest)', fontSize: 11, lineHeight: 1.7 }}>
          <strong>{t.docAnnexe.ecartsStrong}</strong> {doc.ecartsBody}
        </div>

        <div
          style={{
            marginTop: 36,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
              <rect x="1" y="1" width="44" height="44" fill="none" stroke="var(--ink)" strokeWidth=".8" />
              <g fill="var(--ink)">
                {STAMP_CELLS.map(([x, y, w, h]) => (
                  <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} />
                ))}
              </g>
            </svg>
            <HashBlock label={t.docAnnexe.hashLabel} />
          </div>
        </div>
      </div>
    </DocumentRegister>
  );
}
