import { ToleranceBand } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon, fleetFixture as fleet, type FleetRow } from '../fixtures/canon';
import { referenceModelRef } from '../lib/carbon-view';
import { conformityPct } from '../lib/criteria-view';

const GRID = 'minmax(190px,1.5fr) 128px 82px 100px 128px 128px minmax(150px,1fr)';

const TONE_COLOR = {
  ok: 'var(--conforme)',
  muted: 'var(--text-secondary)',
  caution: 'var(--caution)',
  breach: 'var(--breach)',
  none: 'var(--text-tertiary)',
} as const;

function SummaryStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, color }}>{value}</div>
    </div>
  );
}

function ServiceRow({ row }: { row: FleetRow }) {
  return (
    <div
      className="row-hover"
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 14px',
        alignItems: 'center',
        padding: '10px 17px',
        borderBottom: '1px solid var(--divider-row)',
      }}
    >
      <span className="mono" style={{ fontSize: 11 }}>{row.domain}</span>
      <ToleranceBand
        size="compact"
        width={128}
        scaleMin={fleet.scale.min}
        scaleMax={fleet.scale.max}
        median={row.band.median}
        bandLow={row.band.low}
        bandHigh={row.band.high}
        noiseLow={row.band.noiseLow}
        noiseHigh={row.band.noiseHigh}
        referenceModel={referenceModelRef()}
        confidence={row.band.confidence}
        state={row.band.state}
        unitLabel={t.dashboard.tiles.carbonUnit}
      />
      <span
        className="mono"
        style={{
          fontWeight: 500,
          fontSize: 9,
          textAlign: 'right',
          color: row.conf === 'low' ? 'var(--caution)' : 'var(--conforme)',
        }}
      >
        {row.conf === 'low' ? t.confidence.low : t.confidence.high}
      </span>
      <span className="mono" style={{ fontSize: 11, textAlign: 'right' }}>
        {row.rgesnPct ?? conformityPct()}%
      </span>
      <span className="mono" style={{ fontSize: 10, color: TONE_COLOR[row.declaration.tone] }}>{row.declaration.text}</span>
      <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{row.contract}</span>
      <span className="mono" style={{ fontSize: 10, textAlign: 'right', color: TONE_COLOR[row.alert.tone] }}>
        {row.alert.text}
      </span>
    </div>
  );
}

export function Fleet() {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.fleet}</h1>
          <div className="screen-subtitle">
            {fill(t.fleet.subtitle, {
              agency: canon.tenant.agency,
              services: fleet.services,
              contracts: fleet.activeContracts,
              tenders: fleet.openTenders,
            })}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 22,
            padding: '11px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border-card)',
          }}
        >
          <SummaryStat label={t.fleet.summary.breaches} value={String(fleet.summary.breaches)} color="var(--breach)" />
          <SummaryStat label={t.fleet.summary.staleDecl} value={String(fleet.summary.staleDeclarations)} color="var(--caution)" />
          <SummaryStat label={t.fleet.summary.deadlines} value={String(fleet.summary.deadlines30d)} />
        </div>
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
            t.fleet.headers.service,
            t.fleet.headers.carbonVisit,
            t.fleet.headers.conf,
            t.fleet.headers.rgesn,
            t.fleet.headers.declaration,
            t.fleet.headers.contract,
            t.fleet.headers.alert,
          ].map((header, index) => (
            <span
              key={header}
              className="mono"
              style={{
                fontWeight: 500,
                fontSize: 9,
                letterSpacing: '.08em',
                color: 'var(--text-tertiary)',
                textAlign: index === 2 || index === 3 || index === 6 ? 'right' : 'left',
              }}
            >
              {header}
            </span>
          ))}
        </div>
        {fleet.rows.map((row) => (
          <ServiceRow key={row.domain} row={row} />
        ))}
      </div>

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">{t.fleet.benchmarkTitle}</span>
          <svg viewBox="0 0 380 92" width="100%" height="92" style={{ display: 'block', marginTop: 14 }} aria-hidden="true">
            <line x1="10" y1="66" x2="370" y2="66" stroke="var(--text-secondary)" strokeOpacity=".35" />
            <g fill="var(--text-secondary)" opacity=".35">
              {fleet.benchmark.bars.map((bar) => (
                <rect key={bar.x} x={bar.x} y={bar.y} width={9} height={bar.h} />
              ))}
            </g>
            <line x1={fleet.benchmark.markerX} y1="10" x2={fleet.benchmark.markerX} y2="72" stroke="var(--measured)" strokeWidth="2" />
            <text x={fleet.benchmark.markerX + 4} y="16" fill="var(--measured)" fontFamily="var(--font-mono)" fontSize="8">
              {fleet.benchmark.markerLabel}
            </text>
            <line
              x1={fleet.benchmark.medianX}
              y1="14"
              x2={fleet.benchmark.medianX}
              y2="72"
              stroke="var(--ink)"
              strokeDasharray="3 2"
              strokeOpacity=".6"
            />
            <text x={fleet.benchmark.medianX + 4} y="24" fill="var(--ink)" fillOpacity=".7" fontFamily="var(--font-mono)" fontSize="8">
              {fill(t.fleet.medianLabel, { value: fleet.benchmark.medianValue })}
            </text>
            <g fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="7.5">
              <text x="10" y="84">{fleet.benchmark.axis[0]}</text>
              <text x="180" y="84">{fleet.benchmark.axis[1]}</text>
              <text x="360" y="84" textAnchor="end">{fleet.benchmark.axis[2]}</text>
            </g>
          </svg>
          <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            {fill(t.fleet.benchmarkCaption, { n: fleet.benchmark.n, pct: fleet.benchmark.bestPct })}
          </div>
        </div>

        <div className="card-dark">
          <span className="eyebrow">{t.fleet.clientAccessTitle}</span>
          <div style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.65, color: 'var(--on-dark-text)' }}>
            {t.fleet.clientAccessBody}
          </div>
          <div className="mono" style={{ marginTop: 14, fontSize: 10.5 }}>
            {fleet.clientAccess.viewers.map((viewer) => (
              <div
                key={viewer.email}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  padding: '7px 0',
                  borderBottom: '1px solid var(--on-dark-divider)',
                }}
              >
                <span style={{ color: 'var(--paper)' }}>{viewer.email}</span>
                <span style={{ color: 'var(--on-dark-muted)' }}>{fill(t.fleet.viewerService, { count: viewer.services })}</span>
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '7px 0' }}>
              <span style={{ color: 'var(--on-dark-muted)' }}>
                {fill(t.fleet.invitationsPending, { count: fleet.clientAccess.pendingInvitations })}
              </span>
              <span style={{ color: 'var(--on-dark-muted)' }}>–</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
