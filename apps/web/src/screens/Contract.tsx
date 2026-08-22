import { fill, t } from '../i18n';
import {
  CONTRACT,
  calendarDate,
  contractCalendar,
  currentQuarter,
  quarterShort,
} from '../lib/contract-view';
import { dateWithYear } from '../lib/declaration-view';
import { conformityOutlook } from '../lib/criteria-view';
import {
  deliverySquares,
  marginText,
  measuredText,
  signedEngagements,
  statusColor,
  statusText,
  thresholdText,
  trendColor,
  trendLine,
  headroomDefinition,
  type Engagement,
} from '../lib/engagement-view';
import { trendLabel } from '../lib/verdict';

// the conformity engagement's outlook is read off the assessments. nothing
// here draws a rate of change: the ceiling is what answering the open criteria
// can reach, which is a fact, not a forecast.
const outlook = conformityOutlook(CONTRACT.conformityTargetPct);

// every date the contract still owes, in the order it falls.
const calendar = contractCalendar();

const GRID = 'minmax(200px,1.6fr) 92px 92px minmax(130px,1fr) 118px 84px';

const TREND = { width: 106, height: 16 } as const;

/**
 * the bar and the number beside it are one computation. the version this
 * replaces filled the conformity bar to 0 % here and to 78 % in the execution
 * report, both claiming to read the same assessments.
 */
function HeadroomCell({ row }: { row: Engagement }) {
  const squares = deliverySquares(row);
  if (squares !== null) {
    return (
      <span role="cell" className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
        {fill(t.contract.deliveredOf, { delivered: squares.delivered, total: squares.total })}
      </span>
    );
  }
  const caution = row.status !== 'tenu';
  const color = caution ? 'var(--caution)' : 'var(--conforme)';
  return (
    <span role="cell" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span className="progress-track" style={{ flex: 1, height: 6 }}>
        <span
          className="progress-fill"
          style={{ display: 'block', width: `${row.gaugePct ?? 0}%`, background: color }}
        />
      </span>
      <span className="mono" style={{ fontSize: 10, color: caution ? 'var(--caution)' : 'var(--text-secondary)' }}>
        {marginText(row, t)}
      </span>
    </span>
  );
}

function TrendCell({ row }: { row: Engagement }) {
  const squares = deliverySquares(row);
  if (squares !== null) {
    // quarterly deliveries render as squares: filled for delivered, outline
    // for still due
    return (
      <span
        role="cell"
        aria-label={fill(t.contract.deliveredOf, { delivered: squares.delivered, total: squares.total })}
      >
      <svg viewBox="0 0 110 20" width="110" height="20" aria-hidden="true">
        {Array.from({ length: squares.total }, (_, index) =>
          index < squares.delivered ? (
            <rect key={index} x={2 + index * 26} y={7} width={7} height={7} fill="var(--conforme)" />
          ) : (
            <rect key={index} x={2 + index * 26} y={7} width={7} height={7} fill="none" stroke="var(--text-secondary)" strokeOpacity=".45" />
          ),
        )}
      </svg>
      </span>
    );
  }
  // no history is no line, and a trend drawn from nothing is the one thing
  // this screen must not do. the cell says so instead.
  const line = trendLine(row, TREND.width, TREND.height);
  if (line === null) {
    return (
      <span role="cell" className="mono" style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}>
        {t.contract.noHistory}
      </span>
    );
  }
  return (
    <span role="cell" aria-label={trendLabel(line.classification)}>
    <svg viewBox="0 0 110 20" width="110" height="20" aria-hidden="true">
      <polyline
        fill="none"
        stroke={trendColor(line.classification)}
        strokeWidth="1.3"
        points={line.points}
        transform="translate(2 2)"
      />
    </svg>
    </span>
  );
}

export function Contract() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.contractTracker}</h1>
          <div className="screen-subtitle">
            {fill(t.contract.subtitle, {
              ref: CONTRACT.ref,
              date: dateWithYear(CONTRACT.notifiedAt),
              months: CONTRACT.termMonths,
              article: CONTRACT.article,
            })}
          </div>
        </div>
        <button type="button" className="btn" style={{ fontSize: 11, padding: '6px 12px', borderColor: 'var(--ink)', color: 'var(--ink)' }}>
          {fill(t.contract.generateReport, { quarter: quarterShort(currentQuarter().quarter) })}
        </button>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0, overflowX: 'auto' }}>
        {/* the notes below are not rows. */}
        <div role="table" aria-label={t.a11y.tables.contractCommitments}>
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: '0 14px',
            alignItems: 'center',
            padding: '11px 17px 9px',
            borderBottom: '1px solid rgba(21,24,27,.14)',
          }}
        >
          {[
            t.contract.headers.engagement,
            t.contract.headers.seuil,
            t.contract.headers.actuel,
            t.contract.headers.headroom,
            t.contract.headers.trend,
            t.contract.headers.status,
          ].map((header, index) => (
            <span
              key={header}
              role="columnheader"
              className="mono"
              style={{
                fontWeight: 500,
                fontSize: 9,
                letterSpacing: '.08em',
                color: 'var(--text-tertiary)',
                textAlign: index === 1 || index === 2 || index === 5 ? 'right' : 'left',
              }}
            >
              {header}
            </span>
          ))}
        </div>
        {signedEngagements().map((row) => (
          <div
            key={row.id}
            role="row"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 14px',
              alignItems: 'center',
              padding: '11px 17px',
              borderBottom: '1px solid var(--divider-row)',
              background: row.status === 'enCours' ? 'var(--tint-caution)' : undefined,
            }}
          >
            <span role="cell" style={{ fontSize: 11.5, lineHeight: 1.4 }}>{row.labelFr}</span>
            <span role="cell" className="mono" style={{ fontSize: 11, textAlign: 'right' }}>{thresholdText(row, t)}</span>
            <span
              role="cell"
              className="mono"
              style={{ fontSize: 11, textAlign: 'right', color: row.status === 'enCours' ? 'var(--caution)' : 'var(--ink)' }}
            >
              {measuredText(row)}
            </span>
            <HeadroomCell row={row} />
            <TrendCell row={row} />
            <span
              role="cell"
              className="mono"
              style={{ fontWeight: 500, fontSize: 9.5, textAlign: 'right', color: statusColor(row) }}
            >
              {statusText(row, t)}
            </span>
          </div>
        ))}
        </div>
        <div style={{ padding: '11px 17px', fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
          {t.engagements.signedNote}
          <br />
          {headroomDefinition()}
        </div>
      </div>

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">{t.contract.earlyWarningTitle}</span>
          <div className="left-rule caution" style={{ marginTop: 13, paddingLeft: 12 }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
              {fill(t.contract.earlyWarning.rate, {
                current: outlook.currentPct,
                target: CONTRACT.conformityTargetPct,
                months: CONTRACT.conformityReviewMonths,
              })}{' '}
              {fill(t.contract.earlyWarning.ceiling, {
                unanswered: outlook.unanswered,
                ceiling: outlook.ceilingPct,
              })}
            </div>
            <div style={{ marginTop: 7, fontSize: 11, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {outlook.shortOfTarget === 0
                ? t.contract.earlyWarning.reached
                : fill(t.contract.earlyWarning.short, {
                    needed: outlook.neededForTarget,
                    applicable: outlook.applicable,
                    short: outlook.shortOfTarget,
                  })}
            </div>
            <div className="mono" style={{ marginTop: 7, fontSize: 9.5, lineHeight: 1.55, color: 'var(--text-tertiary)' }}>
              {t.contract.earlyWarning.noExtrapolation}
            </div>
          </div>
          <button type="button" className="btn" style={{ marginTop: 13, borderColor: 'var(--ink)', color: 'var(--ink)' }}>
            {fill(t.contract.openCriteria, { count: outlook.unanswered })}
          </button>
        </div>

        <div className="card">
          <span className="eyebrow">{t.contract.calendarTitle}</span>
          <div style={{ marginTop: 12 }}>
            {calendar.map((entry, index) => (
              <div
                key={entry.at.toISOString()}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '92px 1fr auto',
                  gap: 12,
                  alignItems: 'baseline',
                  padding: '7px 0',
                  borderBottom: index < calendar.length - 1 ? '1px solid var(--divider-row)' : undefined,
                }}
              >
                {/* uppercased in css, so what a screen reader is given is the
                    date as it is written rather than a run of capitals. */}
                <span
                  className="mono"
                  style={{
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    color: entry.urgent ? 'var(--caution)' : 'var(--text-secondary)',
                  }}
                >
                  {calendarDate(entry.at)}
                </span>
                <span style={{ fontSize: 11.5 }}>{entry.label}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {fill(t.contract.daysShort, { days: entry.days })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
