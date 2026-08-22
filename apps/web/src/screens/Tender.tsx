import { fill, t } from '../i18n';
import { formatInt, ToleranceBand } from '@balise/ui';
import { canon, tenderFixture as tender } from '../fixtures/canon';
import { carbonPage, carbonScale, referenceModelRef } from '../lib/carbon-view';
import { conformityHistory, criteriaCount } from '../lib/criteria-view';
import {
  marginColor,
  marginText,
  measuredText,
  proposedEngagements,
  thresholdText,
  headroomDefinition,
  engagement as engagementById,
  type Engagement,
} from '../lib/engagement-view';

const GRID = '26px minmax(210px,1.7fr) 118px 96px minmax(120px,1fr)';

/**
 * an engagement is a measured value, a threshold someone signs, and the margin
 * between them. the margin is never typed: the version of this printed 11 % of
 * headroom on the pair the contract tracker printed 10 % on.
 */
function CommitmentLine({ row }: { row: Engagement }) {
  const carbon = row.measured.band !== null;
  const page = carbon ? carbonPage('dashboard') : null;
  return (
    <div
      role="row"
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 12px',
        alignItems: 'center',
        padding: '10px 17px',
        borderBottom: '1px solid var(--divider-row)',
        opacity: row.inOffer ? undefined : 0.55,
      }}
    >
      {/* the mark is decorative; whether the commitment is in the offer is
          said in the cell's own text. */}
      <span role="cell" aria-label={row.inOffer ? t.tender.inOffer : t.tender.notInOffer}>
      {row.inOffer ? (
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
      </span>
      <span role="cell" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{row.labelFr}</span>
      {/* invariant 1: an estimate is never a bare number, on any surface. the
          carbon commitment used to print "0.076 g" with no band and no model
          version, on the workspace that produces the annexe. */}
      <span role="cell">
      {carbon && page !== null ? (
        <ToleranceBand
          size="compact"
          width={118}
          scaleMin={carbonScale(page).min}
          scaleMax={carbonScale(page).max}
          median={row.measured.value}
          bandLow={row.measured.band!.low}
          bandHigh={row.measured.band!.high}
          noiseLow={page.noise?.low ?? row.measured.value}
          noiseHigh={page.noise?.high ?? row.measured.value}
          referenceModel={referenceModelRef()}
          confidence={row.measured.confidence ?? 'low'}
          state="normal"
          unitLabel={t.dashboard.tiles.carbonUnit}
        />
      ) : (
        <span
          className="mono"
          style={{
            fontSize: 11,
            textAlign: 'right',
            color: row.margin.kind === 'notMet' ? 'var(--breach)' : 'var(--ink)',
          }}
        >
          {measuredText(row)}
        </span>
      )}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 11, textAlign: 'right', color: 'var(--measured)' }}>
        {thresholdText(row, t)}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10, color: marginColor(row) }}>{marginText(row, t)}</span>
    </div>
  );
}

export function Tender() {
  const history = conformityHistory();
  const lowest = Math.min(...history.map((point) => point.conforme));
  const highest = Math.max(...history.map((point) => point.conforme));
  const historyX = (index: number) =>
    history.length === 1 ? 125 : 14 + (index / (history.length - 1)) * 222;
  const historyY = (conforme: number) =>
    highest === lowest ? 22 : 34 - ((conforme - lowest) / (highest - lowest)) * 24;
  const historyPoints = history
    .map((point, index) => `${historyX(index).toFixed(1)},${historyY(point.conforme).toFixed(1)}`)
    .join(' ');

  const proposal = engagementById('third-party-share');
  const shortfallPoints =
    proposal.margin.kind === 'notMet' ? Math.round(proposal.margin.points) : 0;

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
            {/* the headroom definition below is not a row. */}
            <div role="table" aria-label={t.a11y.tables.tenderCommitments}>
            <div
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: '0 12px',
                alignItems: 'center',
                padding: '0 17px 8px',
                borderBottom: '1px solid rgba(21,24,27,.14)',
              }}
            >
              <span role="columnheader" aria-label={t.tender.headers.inOffer} />
              {[t.tender.headers.commitment, t.tender.headers.measured, t.tender.headers.proposed, t.tender.headers.margin].map(
                (header, index) => (
                  <span
                    key={header}
                    role="columnheader"
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
            {proposedEngagements().map((row) => (
              <CommitmentLine key={row.id} row={row} />
            ))}
            </div>
            <div style={{ padding: '10px 17px', fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {headroomDefinition()}
            </div>
          </div>
          <div style={{ padding: '13px 17px 15px', background: 'var(--tint-caution)', borderTop: '1px solid rgba(196,118,26,.3)' }}>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              {/* the points come from the proposal itself: measured minus the
                  threshold it would have signed. */}
              <strong>{t.tender.warningStrong}</strong>{' '}
              {fill(t.tender.warningBody, { points: shortfallPoints })}
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
            {/* one point per published version of the declaration, which is
                the conformity history the product holds. the version this
                replaces drew fourteen coordinates typed into a fixture and
                captioned them as a rate, reading version 1's count of
                conforming criteria as a percentage. */}
            <svg viewBox="0 0 250 46" width="100%" height="46" style={{ display: 'block', marginTop: 12 }} aria-hidden="true">
              <polyline
                fill="none"
                stroke="var(--measured)"
                strokeWidth="1.4"
                strokeDasharray={history.some((point) => point.draft) ? '4 2' : undefined}
                points={historyPoints}
              />
              {history.map((point, index) => (
                <circle
                  key={point.tag}
                  cx={historyX(index)}
                  cy={historyY(point.conforme)}
                  r="2.2"
                  fill={point.draft ? 'var(--paper)' : 'var(--measured)'}
                  stroke="var(--measured)"
                  strokeWidth="1"
                />
              ))}
              <g fill="var(--text-secondary)" fontFamily="var(--font-mono)" fontSize="7.5">
                {history.map((point, index) => (
                  <text key={point.tag} x={historyX(index)} y="44" textAnchor="middle">
                    {point.tag} · {point.conforme}
                  </text>
                ))}
              </g>
            </svg>
            <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {fill(t.tender.conformityCounts, {
                versions: history.length,
                total: criteriaCount(),
              })}
              <br />
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
