import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ToleranceBand } from '@balise/ui';
import { fill, t } from '../i18n';
import { scanFixture as scan } from '../fixtures/canon';
import { carbonCanon } from '../fixtures/carbon-canon';
import { carbonPage, carbonScale, formatCarbon, referenceModelRef } from '../lib/carbon-view';
import { PublicHeader } from '../components/PublicHeader';
import { lookupScan } from '../lib/scan-lookup';

// the scan's grade and band are estimated by @balise/carbon-models from the
// held capture. ecoindex publishes the grade, so the grade is ecoindex's own
// output and not a rating we invented from the band.
const scanPage = carbonPage('scan');
const scanAxis = carbonScale(scanPage);
const scanGrade = scanPage.aside.find((output) => output.grade !== null) ?? null;

const REFERENCE = `${referenceModelRef().id}@${referenceModelRef().version}`;

function Findings() {
  return (
    <div style={{ padding: '20px 26px', borderRight: '1px solid var(--divider-cell)' }}>
      <span className="eyebrow" style={{ fontSize: 9 }}>
        {t.publicScan.findingsTitle}
      </span>
      <div style={{ marginTop: 13, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {scan.findings.map((finding) => (
          <div
            key={finding.text}
            style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, alignItems: 'baseline' }}
          >
            <span
              className="mono"
              style={{ fontSize: 11, color: finding.tone === 'breach' ? 'var(--breach)' : 'var(--caution)' }}
            >
              {finding.amount}
            </span>
            <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>{finding.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// the acquisition hook: the scan answers the question the buyer will ask
// next, which is whether this service publishes a declaration at all.
function DeclarationLookup() {
  return (
    <div style={{ padding: '20px 26px' }}>
      <span className="eyebrow" style={{ fontSize: 9 }}>
        {t.publicScan.declarationTitle}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 13 }}>
        <span className="status-mark" style={{ background: 'var(--breach)' }} aria-hidden="true">
          ✕
        </span>
        <span style={{ fontWeight: 500, fontSize: 12.5 }}>{t.publicScan.declarationNone}</span>
      </div>
      <p style={{ margin: '9px 0 0', fontSize: 11.5, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
        {t.publicScan.declarationBody}
      </p>
      <button type="button" className="btn-ink" style={{ marginTop: 16 }}>
        {t.publicScan.follow}
      </button>
    </div>
  );
}

function Result() {
  return (
    <div style={{ marginTop: 38, background: 'var(--surface)', border: '1px solid var(--border-strong)' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--border-card)', flexWrap: 'wrap' }}>
        <div style={{ padding: '22px 26px', borderRight: '1px solid var(--divider-cell)' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
            {t.publicScan.gradeLabel}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span className="archivo" style={{ fontWeight: 700, fontSize: 40, lineHeight: 1 }}>
              {scanGrade?.grade ?? ''}
            </span>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {fill(t.publicScan.gradeScore, { score: Math.round(scanGrade?.score ?? 0) })}
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280, padding: '22px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
              {t.publicScan.bandLabel}
            </span>
            {/* the grade the kernel gave this capture. one cold pass with no
                history is low confidence, and a public surface saying so is
                worth more than one that does not. caution, never a pass
                colour: confidence is not conformity. */}
            <span
              className="mono"
              style={{
                fontSize: 9,
                color: scan.confidence === 'high' ? 'var(--text-secondary)' : 'var(--caution)',
              }}
            >
              {fill(t.publicScan.confidenceNote, { grade: t.publicScan.confidenceGrade[scan.confidence] })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 7 }}>
            <span className="mono" style={{ fontSize: 28, lineHeight: 1, letterSpacing: '-.03em' }}>
              {formatCarbon(scanPage.band.reference)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.dashboard.tiles.carbonUnit}</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)' }}>
              {formatCarbon(scanPage.band.low)} – {formatCarbon(scanPage.band.high)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 7.5, color: 'var(--text-tertiary)' }}>
              {scanAxis.min.toFixed(2)}
            </span>
            <ToleranceBand
              size="compact"
              width={560}
              scaleMin={scanAxis.min}
              scaleMax={scanAxis.max}
              median={scanPage.band.reference}
              bandLow={scanPage.band.low}
              bandHigh={scanPage.band.high}
              referenceModel={referenceModelRef()}
              confidence={scan.confidence}
              unitLabel={t.dashboard.tiles.carbonUnit}
            />
            <span className="mono" style={{ fontSize: 7.5, color: 'var(--text-tertiary)' }}>
              {scanAxis.max.toFixed(2)}
            </span>
          </div>
          {/* invariant 1: the estimate never appears without its model version */}
          <div className="mono" style={{ marginTop: 9, fontSize: 9.5, color: 'var(--text-tertiary)' }}>
            {fill(t.publicScan.provenance, {
              model: REFERENCE,
              count: scanPage.band.modelCount,
              grid: carbonCanon.grid.gCO2ePerKwh,
              zone: carbonCanon.grid.zone,
            })}
          </div>
          {/* one cold pass and no history: the band carries no noise region,
              and the surface says so rather than leaving the absence unexplained */}
          <div className="mono" style={{ marginTop: 4, fontSize: 9.5, color: 'var(--text-tertiary)' }}>
            {t.publicScan.provenanceNoFloor}
          </div>
        </div>
      </div>
      <div className="scan-panels">
        <Findings />
        <DeclarationLookup />
      </div>
    </div>
  );
}

function NoRecord({ domain, onReset }: { domain: string; onReset: () => void }) {
  return (
    <div style={{ marginTop: 38, background: 'var(--surface)', border: '1px solid var(--border-strong)', padding: '22px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span className="status-mark" style={{ background: 'var(--text-secondary)' }} aria-hidden="true">
          !
        </span>
        <span style={{ fontWeight: 500, fontSize: 12.5 }}>{t.publicScan.noRecordTitle}</span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-secondary)' }}>
          {domain}
        </span>
      </div>
      <p
        style={{
          margin: '10px 0 0',
          fontSize: 11.5,
          lineHeight: 1.65,
          color: 'var(--text-secondary)',
          maxWidth: '62ch',
        }}
      >
        {t.publicScan.noRecordBody}
      </p>
      <button type="button" className="btn-ink" style={{ marginTop: 16 }} onClick={onReset}>
        {t.publicScan.noRecordAction}
      </button>
    </div>
  );
}

export function FreeScan() {
  const navigate = useNavigate();
  const [field, setField] = useState<string>(scan.domain);
  const [submitted, setSubmitted] = useState<string>(scan.domain);
  const result = lookupScan(submitted, scan.domain);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(field);
  }

  function reset() {
    setField(scan.domain);
    setSubmitted(scan.domain);
  }

  return (
    <div className="screen-public">
      <PublicHeader
        links={
          <>
            <button type="button" onClick={() => navigate('/public/observatory')}>
              {t.publicScan.navObservatory}
            </button>
            <a href="#methodology">{t.publicScan.navMethodology}</a>
            <button type="button">{t.publicScan.navPricing}</button>
          </>
        }
      />
      <div className="public-body">
        <h1 className="public-hero">{t.publicScan.title}</h1>
        <p style={{ margin: '16px 0 0', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: '52ch' }}>
          {fill(t.publicScan.lede, { count: carbonCanon.assumptions.length })}
        </p>
        <form className="scan-field" onSubmit={onSubmit}>
          <label htmlFor="scan-domain" className="visually-hidden">
            {t.publicScan.fieldLabel}
          </label>
          <input
            id="scan-domain"
            name="domain"
            value={field}
            onChange={(event) => setField(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <button type="submit">{t.publicScan.submit}</button>
        </form>

        {result.status === 'measured' ? <Result /> : <NoRecord domain={result.domain} onReset={reset} />}

        <p
          style={{
            margin: '18px 0 0',
            fontSize: 10.5,
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
            maxWidth: '70ch',
          }}
        >
          {t.publicScan.captionBefore}
          <span className="mono" style={{ fontSize: 10 }}>
            {scan.profile}
          </span>
          {t.publicScan.captionAfter}
        </p>
      </div>
    </div>
  );
}
