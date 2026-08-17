import { formatInt, formatSigned, ToleranceBand } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon, prCheckFixture as pr, type PrCheckRow, type PrVerdict } from '../fixtures/canon';
import { Wordmark } from '../components/Wordmark';

const GRID = 'minmax(190px,1.5fr) 82px 82px 82px 132px 76px';

const VERDICT_LABEL: Record<PrVerdict, () => string> = {
  fail: () => t.verdicts.fail,
  warn: () => t.verdicts.warn,
  noSig: () => t.verdicts.noSig,
};

const VERDICT_COLOR: Record<PrVerdict, string> = {
  fail: 'var(--breach)',
  warn: 'var(--caution)',
  noSig: 'var(--text-secondary)',
};

function Parts({ parts }: { parts: ReadonlyArray<{ text: string; mono?: boolean; strong?: boolean }> }) {
  return (
    <>
      {parts.map((part, index) =>
        part.mono === true ? (
          <span key={index} className="mono" style={{ fontSize: 10.5 }}>
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

function MeasurementRow({ row }: { row: PrCheckRow }) {
  // the delta band shows the delta against the noise field, centred on zero
  const spread = Math.max(row.deltaKb + row.madKb, row.floorKb * 2);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 12px',
        alignItems: 'center',
        padding: '8px 14px',
        borderBottom: '1px solid var(--divider-row)',
        background: row.verdict === 'fail' ? 'var(--tint-breach)' : undefined,
      }}
    >
      <span className="mono" style={{ fontSize: 10.5, color: row.verdict === 'fail' ? 'var(--breach)' : 'var(--ink)' }}>
        {row.route}
      </span>
      <span className="mono" style={{ fontSize: 10.5, textAlign: 'right' }}>{formatInt(row.baseKb)}</span>
      <span
        className="mono"
        style={{ fontSize: 10.5, textAlign: 'right', color: row.verdict === 'noSig' ? 'var(--ink)' : VERDICT_COLOR[row.verdict] }}
      >
        {formatInt(row.headKb)}
      </span>
      <span
        className="mono"
        style={{ fontSize: 10.5, textAlign: 'right', color: row.verdict === 'noSig' ? 'var(--ink)' : VERDICT_COLOR[row.verdict] }}
      >
        {formatSigned(row.deltaKb)}
      </span>
      <ToleranceBand
        size="compact"
        width={132}
        scaleMin={-spread * 0.35}
        scaleMax={spread * 1.15}
        median={row.deltaKb}
        bandLow={row.deltaKb - row.madKb}
        bandHigh={row.deltaKb + row.madKb}
        noiseLow={-row.floorKb}
        noiseHigh={row.floorKb}
        referenceModel={canon.referenceModel}
        confidence="high"
        state={row.verdict === 'fail' ? 'breach' : row.verdict === 'warn' ? 'caution' : 'normal'}
        deltaClassification={row.verdict === 'noSig' ? 'no-significant-change' : 'regression'}
        unitLabel={t.prCheck.headers.delta}
      />
      <span
        className="mono"
        style={{ fontWeight: 500, fontSize: 9.5, letterSpacing: '.05em', textAlign: 'right', color: VERDICT_COLOR[row.verdict] }}
      >
        {VERDICT_LABEL[row.verdict]()}
      </span>
    </div>
  );
}

export function PrCheck() {
  return (
    <>
      <h1 className="screen-title">{t.prCheck.title}</h1>
      <div className="screen-subtitle">{t.prCheck.subtitle}</div>

      <div style={{ maxWidth: 1020, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="gh-card">
          <div style={{ padding: '14px 16px 12px' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {pr.title} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{pr.number}</span>
            </div>
            <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
              <span className="mono" style={{ fontSize: 10 }}>{pr.author}</span> {t.prCheck.merge1} {pr.commits}{' '}
              {t.prCheck.merge2} <span className="mono" style={{ fontSize: 10 }}>{pr.into}</span> {t.prCheck.merge3}{' '}
              <span className="mono" style={{ fontSize: 10 }}>{pr.from}</span>
            </div>
          </div>

          <div className="gh-banner">
            <span
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--breach)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 700,
                flex: 'none',
                marginTop: 1,
              }}
            >
              !
            </span>
            <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--breach)' }}>{t.prCheck.blockedTitle}</strong>
              <br />
              <span style={{ color: 'var(--text-secondary)' }}>
                {t.prCheck.blockedBody1} <span className="mono" style={{ fontSize: 10 }}>{pr.requiredCheck}</span>{' '}
                {t.prCheck.blockedBody2} <span className="mono" style={{ fontSize: 10 }}>{pr.into}</span>.
              </span>
            </span>
          </div>

          <div>
            {pr.statuses.map((status) => (
              <div
                key={status.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  borderTop: '1px solid var(--divider-row)',
                }}
              >
                <span className="gh-dot" style={{ background: status.state === 'fail' ? 'var(--breach)' : 'var(--conforme)' }} />
                <span style={{ fontSize: 11.5, fontWeight: 600 }}>{status.name}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>· {status.text}</span>
                <a href="#details" style={{ marginLeft: 'auto', fontSize: 11 }}>
                  {t.prCheck.details}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="gh-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: 'var(--paper)',
              borderBottom: '1px solid var(--divider-cell)',
            }}
          >
            <Wordmark size={14} onDark={false} />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>balise</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {t.prCheck.commented} {fill(t.appBar.minutesAgo, { minutes: pr.commentedMinutesAgo })}
            </span>
          </div>

          <div style={{ padding: '12px 0 0' }}>
            <div style={{ padding: '0 14px', fontSize: 11.5 }}>
              <strong>{fill(t.prCheck.measurementLine, { runs: pr.runsPerScenario }).split(' · ')[0]}</strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {' · '}
                {fill(t.prCheck.measurementLine, { runs: pr.runsPerScenario }).split(' · ').slice(1).join(' · ')}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: '0 12px',
                padding: '10px 14px 7px',
                borderBottom: '1px solid rgba(21,24,27,.14)',
              }}
            >
              {[
                t.prCheck.headers.route,
                t.prCheck.headers.base,
                t.prCheck.headers.head,
                t.prCheck.headers.delta,
                t.prCheck.headers.vsNoise,
                t.prCheck.headers.verdict,
              ].map((header, index) => (
                <span
                  key={header}
                  className="mono"
                  style={{
                    fontWeight: 500,
                    fontSize: 9,
                    letterSpacing: '.08em',
                    color: 'var(--text-tertiary)',
                    textAlign: index === 0 || index === 4 ? 'left' : 'right',
                  }}
                >
                  {header}
                </span>
              ))}
            </div>
            {pr.rows.map((row) => (
              <MeasurementRow key={row.route} row={row} />
            ))}

            <div style={{ padding: '12px 14px 0' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600 }}>{t.prCheck.attributionHeading}</div>
              <p style={{ margin: '6px 0 0', fontSize: 11.5, lineHeight: 1.6, maxWidth: '72ch' }}>
                <Parts parts={pr.attributionParts} />
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.6, maxWidth: '72ch', color: 'var(--text-secondary)' }}>
                {t.prCheck.fixLabel} <Parts parts={pr.fixParts} />
              </p>
            </div>

            <div
              style={{
                margin: '12px 14px 0',
                padding: '10px 0 12px',
                borderTop: '1px solid var(--divider-cell)',
                fontSize: 10,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
              }}
            >
              {t.prCheck.provenanceMethodology} {pr.provenance.methodology} · {t.prCheck.provenanceModels}{' '}
              <span className="mono" style={{ fontSize: 9.5 }}>{pr.provenance.models}</span> · {t.prCheck.provenanceRun}{' '}
              <span className="mono" style={{ fontSize: 9.5 }}>{pr.provenance.run}</span> · {t.prCheck.provenanceLedger}{' '}
              <a href="#ledger" className="mono" style={{ fontSize: 9.5 }}>{pr.provenance.ledger}</a> ·{' '}
              <a href="#override">{t.prCheck.overrideLink}</a> {t.prCheck.overrideNote}
            </div>
          </div>
        </div>

        <div className="gh-card">
          <div
            className="mono"
            style={{
              padding: '10px 14px',
              fontWeight: 500,
              fontSize: 9.5,
              letterSpacing: '.08em',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid var(--divider-cell)',
            }}
          >
            {fill(t.prCheck.annotationTitle, { file: pr.annotation.file })}
          </div>
          <div style={{ padding: '10px 14px 0' }}>
            {pr.annotation.lines.map((line) => (
              <div key={line.no} className={line.added ? 'diff-line added' : 'diff-line'}>
                <span className="no">{line.no}</span>
                <span className="code">{line.text}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              margin: '10px 14px 12px',
              padding: '9px 12px',
              borderLeft: '2px solid var(--breach)',
              background: 'var(--inset-panel)',
            }}
          >
            <span className="mono" style={{ fontWeight: 500, fontSize: 10.5, color: 'var(--breach)', flex: 'none' }}>
              +{pr.annotation.costKb} KB
            </span>
            <span style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--text-secondary)' }}>{pr.annotation.note}</span>
          </div>
        </div>
      </div>
    </>
  );
}
