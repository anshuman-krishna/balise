import { fill, t } from '../i18n';
import { formatInt } from '@balise/ui';
import { canon, tenderFixture as tender, type CommitmentMargin, type CommitmentRow } from '../fixtures/canon';

const GRID = '26px minmax(210px,1.7fr) 96px 96px minmax(120px,1fr)';

function marginLabel(margin: CommitmentMargin): { text: string; color: string } {
  switch (margin.kind) {
    case 'headroom':
      return { text: fill(t.tender.margins.headroom, { pct: margin.pct }), color: 'var(--conforme)' };
    case 'stretch':
      return { text: fill(t.tender.margins.stretch, { points: margin.points }), color: 'var(--caution)' };
    case 'notMet':
      return { text: t.tender.margins.notMet, color: 'var(--breach)' };
    case 'process':
      return { text: t.tender.margins.process, color: 'var(--text-secondary)' };
  }
}

function CommitmentLine({ row }: { row: CommitmentRow }) {
  const margin = marginLabel(row.margin);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 12px',
        alignItems: 'center',
        padding: '10px 17px',
        borderBottom: '1px solid var(--divider-row)',
        opacity: row.checked ? undefined : 0.55,
      }}
    >
      {row.checked ? (
        <span
          aria-hidden="true"
          style={{
            width: 13,
            height: 13,
            background: 'var(--measured)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 9,
          }}
        >
          ✓
        </span>
      ) : (
        <span aria-hidden="true" style={{ width: 13, height: 13, border: '1px solid rgba(21,24,27,.35)', display: 'block' }} />
      )}
      <span style={{ fontSize: 11.5, lineHeight: 1.4 }}>{row.label}</span>
      <span
        className="mono"
        style={{ fontSize: 11, textAlign: 'right', color: row.measuredTone === 'breach' ? 'var(--breach)' : 'var(--ink)' }}
      >
        {row.measured}
      </span>
      <span className="mono" style={{ fontSize: 11, textAlign: 'right', color: 'var(--measured)' }}>{row.proposed}</span>
      <span className="mono" style={{ fontSize: 10, color: margin.color }}>{margin.text}</span>
    </div>
  );
}

export function Tender() {
  const steps = [
    t.tender.steps.reference,
    t.tender.steps.scope,
    t.tender.steps.commitments,
    t.tender.steps.narrative,
    t.tender.steps.export,
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.tenderWorkspace}</h1>
          <div className="screen-subtitle">
            <span className="mono" style={{ fontSize: 10.5 }}>{tender.ref}</span> · {tender.title} ·{' '}
            {canon.service.organisation}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{t.tender.remiseDesOffres}</div>
          <div className="mono" style={{ fontSize: 15, color: 'var(--caution)' }}>{tender.deadline.date}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            {fill(t.tender.daysVia, { days: tender.deadline.days, platform: tender.deadline.platform })}
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginTop: 16, padding: 0, overflowX: 'auto' }}
      >
        {steps.map((step, index) => {
          const done = index < tender.currentStep;
          const current = index === tender.currentStep;
          return (
            <div
              key={step}
              style={{
                flex: 1,
                padding: '12px 15px',
                borderRight: index < steps.length - 1 ? '1px solid rgba(21,24,27,.1)' : undefined,
                background: current ? 'var(--selected-row)' : undefined,
                borderBottom: current ? '2px solid var(--measured)' : undefined,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 9,
                  color: done ? 'var(--conforme)' : current ? 'var(--measured)' : 'var(--text-tertiary)',
                }}
              >
                {String(index + 1).padStart(2, '0')}
                {done ? ` · ${t.tender.stepDone}` : current ? ` · ${t.tender.stepCurrent}` : ''}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontWeight: 500,
                  fontSize: 11.5,
                  color: done || current ? 'var(--ink)' : 'var(--text-tertiary)',
                }}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '15px 17px 0' }}>
            <span className="eyebrow">{t.tender.commitmentsTitle}</span>
            <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {t.tender.commitmentsCaption}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: '0 12px',
                alignItems: 'center',
                padding: '0 17px 8px',
                borderBottom: '1px solid rgba(21,24,27,.14)',
              }}
            >
              <span />
              {[t.tender.headers.commitment, t.tender.headers.measured, t.tender.headers.proposed, t.tender.headers.margin].map(
                (header, index) => (
                  <span
                    key={header}
                    className="mono"
                    style={{
                      fontWeight: 500,
                      fontSize: 9,
                      letterSpacing: '.08em',
                      color: 'var(--text-tertiary)',
                      textAlign: index === 1 || index === 2 ? 'right' : 'left',
                    }}
                  >
                    {header}
                  </span>
                ),
              )}
            </div>
            {tender.commitments.map((row) => (
              <CommitmentLine key={row.label} row={row} />
            ))}
          </div>
          <div style={{ padding: '13px 17px 15px', background: 'var(--tint-caution)', borderTop: '1px solid rgba(196,118,26,.3)' }}>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              <strong>{t.tender.warningStrong}</strong> {fill(t.tender.warningBody, { points: tender.warningPoints })}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <span className="eyebrow">{t.tender.historyTitle}</span>
            <div style={{ marginTop: 11, fontSize: 11.5, lineHeight: 1.6 }}>
              {t.tender.historySince} <span className="mono" style={{ fontSize: 11 }}>{tender.history.since}</span> ·{' '}
              {fill(t.tender.historyCounts, {
                days: tender.history.days,
                runs: formatInt(tender.history.runs),
                versions: tender.history.declarationVersions,
              })}
            </div>
            <svg viewBox="0 0 250 46" width="100%" height="46" style={{ display: 'block', marginTop: 12 }} aria-hidden="true">
              <polyline fill="none" stroke="var(--measured)" strokeWidth="1.4" points={tender.history.points} />
              <polygon fill="var(--measured)" opacity=".12" points={`${tender.history.points} 240,44 4,44`} />
              <text x="4" y="8" fill="var(--text-secondary)" fontFamily="var(--font-mono)" fontSize="7.5">
                {fill(t.tender.conformityRate, { from: tender.history.rateFrom, to: tender.history.rateTo })}
              </text>
            </svg>
            <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {t.tender.historyCaption}
            </div>
          </div>

          <div className="card">
            <span className="eyebrow">{t.tender.outputTitle}</span>
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '7px 12px',
                marginTop: 12,
                fontSize: 10.5,
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-tertiary)' }}>{t.tender.outputKeys.branding}</span>
              <span>{tender.output.branding}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{t.tender.outputKeys.format}</span>
              <span>{fill(t.tender.outputFormat, { pages: tender.output.pages })}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{t.tender.outputKeys.figures}</span>
              <span>{fill(t.tender.outputFigures, { count: tender.output.figureCount })}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{t.tender.outputKeys.verification}</span>
              <span style={{ color: 'var(--measured)' }}>{tender.output.verifyUrl}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>{t.tender.outputKeys.editable}</span>
              <span>{t.tender.outputEditable}</span>
            </div>
            <button
              type="button"
              style={{
                appearance: 'none',
                border: 'none',
                borderRadius: 0,
                cursor: 'pointer',
                marginTop: 14,
                display: 'block',
                width: '100%',
                textAlign: 'center',
                padding: '8px 12px',
                background: 'var(--ink)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: 11.5,
              }}
            >
              {t.tender.openAnnex}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
