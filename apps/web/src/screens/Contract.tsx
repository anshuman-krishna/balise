import { fill, t } from '../i18n';
import { contractFixture as contract, type ContractRow, type ContractStatus } from '../fixtures/canon';
import { conformityOutlook, conformityPct } from '../lib/criteria-view';

// the conformity engagement is read off the assessments, and so is the warning
// under it. nothing here draws a rate of change: the ceiling is what answering
// the open criteria can reach, which is a fact, not a forecast.
const outlook = conformityOutlook(contract.conformityTargetPct);
const rows: ContractRow[] = contract.rows.map((row) =>
  row.actuel !== null
    ? row
    : {
        ...row,
        actuel: `${conformityPct()}%`,
        headroom: {
          tone: 'caution',
          barPct: Math.min(100, (outlook.currentPct / contract.conformityTargetPct) * 100),
          ptToGo: Math.max(0, contract.conformityTargetPct - outlook.currentPct),
        },
      },
);

const GRID = 'minmax(200px,1.6fr) 92px 92px minmax(130px,1fr) 118px 84px';

const STATUS_LABEL: Record<ContractStatus, () => string> = {
  tenu: () => t.contract.statuses.tenu,
  atRisk: () => t.contract.statuses.atRisk,
  aJour: () => t.contract.statuses.aJour,
};

const STATUS_COLOR: Record<ContractStatus, string> = {
  tenu: 'var(--conforme)',
  atRisk: 'var(--caution)',
  aJour: 'var(--conforme)',
};

function HeadroomCell({ row }: { row: ContractRow }) {
  if (row.quarters !== undefined) {
    return <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{row.quarters.text}</span>;
  }
  if (row.headroom === undefined) {
    return null;
  }
  const color = row.headroom.tone === 'caution' ? 'var(--caution)' : 'var(--conforme)';
  const label =
    row.headroom.ptToGo !== undefined
      ? fill(t.contract.ptToGo, { points: row.headroom.ptToGo })
      : `${row.headroom.labelPct ?? 0}%`;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span className="progress-track" style={{ flex: 1, height: 6 }}>
        <span className="progress-fill" style={{ display: 'block', width: `${row.headroom.barPct}%`, background: color }} />
      </span>
      <span
        className="mono"
        style={{ fontSize: 10, color: row.headroom.tone === 'caution' ? 'var(--caution)' : 'var(--text-secondary)' }}
      >
        {label}
      </span>
    </span>
  );
}

function TrendCell({ row }: { row: ContractRow }) {
  const quarters = row.quarters;
  if (quarters !== undefined) {
    // quarterly deliveries render as squares: filled for delivered, outline
    // for still due
    return (
      <svg viewBox="0 0 110 20" width="110" height="20" aria-hidden="true">
        {Array.from({ length: quarters.total }, (_, index) =>
          index < quarters.delivered ? (
            <rect key={index} x={2 + index * 26} y={7} width={7} height={7} fill="var(--conforme)" />
          ) : (
            <rect key={index} x={2 + index * 26} y={7} width={7} height={7} fill="none" stroke="var(--text-secondary)" strokeOpacity=".45" />
          ),
        )}
      </svg>
    );
  }
  // no points is no history, and a trend drawn from nothing is the one thing
  // this screen must not do. the cell says so instead of drawing a line.
  if (row.trendPoints === '') {
    return (
      <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}>
        {t.contract.noHistory}
      </span>
    );
  }
  const stroke = row.trendTone === 'caution' ? 'var(--caution)' : 'var(--text-secondary)';
  return (
    <svg viewBox="0 0 110 20" width="110" height="20" aria-hidden="true">
      <polyline fill="none" stroke={stroke} strokeWidth="1.3" points={row.trendPoints} />
    </svg>
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
              ref: contract.ref,
              date: contract.notified,
              months: contract.months,
              article: contract.article,
            })}
          </div>
        </div>
        <button type="button" className="btn" style={{ fontSize: 11, padding: '6px 12px', borderColor: 'var(--ink)', color: 'var(--ink)' }}>
          {fill(t.contract.generateReport, { quarter: contract.quarter })}
        </button>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0, overflowX: 'auto' }}>
        <div
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
        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 14px',
              alignItems: 'center',
              padding: '11px 17px',
              borderBottom: '1px solid var(--divider-row)',
              background: row.rowTint === 'caution' ? 'var(--tint-caution)' : undefined,
            }}
          >
            <span style={{ fontSize: 11.5, lineHeight: 1.4 }}>{row.label}</span>
            <span className="mono" style={{ fontSize: 11, textAlign: 'right' }}>{row.seuil}</span>
            <span
              className="mono"
              style={{ fontSize: 11, textAlign: 'right', color: row.actuelTone === 'caution' ? 'var(--caution)' : 'var(--ink)' }}
            >
              {row.actuel}
            </span>
            <HeadroomCell row={row} />
            <TrendCell row={row} />
            <span
              className="mono"
              style={{ fontWeight: 500, fontSize: 9.5, textAlign: 'right', color: STATUS_COLOR[row.status] }}
            >
              {STATUS_LABEL[row.status]()}
            </span>
          </div>
        ))}
      </div>

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">{t.contract.earlyWarningTitle}</span>
          <div className="left-rule caution" style={{ marginTop: 13, paddingLeft: 12 }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.55 }}>
              {fill(t.contract.earlyWarning.rate, {
                current: outlook.currentPct,
                target: contract.conformityTargetPct,
                months: contract.conformityReviewMonths,
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
            {contract.calendar.map((entry, index) => (
              <div
                key={entry.date}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '88px 1fr auto',
                  gap: 12,
                  alignItems: 'baseline',
                  padding: '7px 0',
                  borderBottom: index < contract.calendar.length - 1 ? '1px solid var(--divider-row)' : undefined,
                }}
              >
                <span className="mono" style={{ fontSize: 10.5, color: entry.urgent === true ? 'var(--caution)' : 'var(--text-secondary)' }}>
                  {entry.date}
                </span>
                <span style={{ fontSize: 11.5 }}>{entry.label}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {entry.days === null ? '–' : fill(t.contract.daysShort, { days: entry.days })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
