import { ToleranceBand } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon, fleetFixture as fleet, observatoryFixture as obs } from '../fixtures/canon';
import { corpusCanon } from '../fixtures/corpus-canon';
import { referenceModelRef } from '../lib/carbon-view';
import { conformityPct } from '../lib/criteria-view';
import {
  alertFor,
  benchmark,
  confidenceTone,
  declarationText,
  declarationTone,
  fleetRows,
  fleetSummary,
  TONE_COLOR,
  type CorpusRow,
} from '../lib/corpus-view';

const GRID = 'minmax(190px,1.5fr) 128px 82px 100px 128px 128px minmax(150px,1fr)';

// the histogram's drawing surface. the geometry inside it is computed from the
// corpus and scaled here; nothing about the distribution is decided in pixels.
const CHART = { width: 380, height: 104, left: 10, right: 370, base: 74, top: 26 } as const;

function SummaryStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, color }}>{value}</div>
    </div>
  );
}

function ServiceRow({ row }: { row: CorpusRow }) {
  const alert = alertFor(row, t);
  return (
    <div
      role="row"
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
      <span role="cell" className="mono" style={{ fontSize: 11 }}>{row.domain}</span>
      <span role="cell">
      <ToleranceBand
        size="compact"
        width={128}
        scaleMin={corpusCanon.scale.min}
        scaleMax={corpusCanon.scale.max}
        median={row.carbon.reference}
        bandLow={row.carbon.low}
        bandHigh={row.carbon.high}
        noiseLow={row.carbon.noise?.low ?? row.carbon.reference}
        noiseHigh={row.carbon.noise?.high ?? row.carbon.reference}
        referenceModel={referenceModelRef()}
        confidence={row.confidence}
        state="normal"
        unitLabel={t.dashboard.tiles.carbonUnit}
      />
      </span>
      <span
        role="cell"
        className="mono"
        style={{
          fontWeight: 500,
          fontSize: 9,
          textAlign: 'right',
          color: TONE_COLOR[confidenceTone(row.confidence)],
        }}
      >
        {t.confidence[row.confidence]}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 11, textAlign: 'right' }}>
        {row.rgesnPct ?? conformityPct()}%
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10, color: TONE_COLOR[declarationTone(row)] }}>
        {declarationText(row, t)}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
        {row.contract ?? '–'}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10, textAlign: 'right', color: TONE_COLOR[alert.tone] }}>
        {alert.text}
      </span>
    </div>
  );
}

export function Fleet() {
  const rows = fleetRows();
  const summary = fleetSummary(t);
  const chart = benchmark(t);
  const x = (fraction: number) => CHART.left + fraction * (CHART.right - CHART.left);
  // the mono face at 8px runs about 4.6 units a character in this viewbox.
  const label = (at: number, text: string) =>
    Math.max(CHART.left, Math.min(at + 4, CHART.right - text.length * 4.6));

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.fleet}</h1>
          <div className="screen-subtitle">
            {fill(t.fleet.subtitle, {
              agency: canon.tenant.agency,
              services: rows.length,
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
          <SummaryStat label={t.fleet.summary.breaches} value={String(summary.breaches)} color="var(--breach)" />
          <SummaryStat label={t.fleet.summary.staleDecl} value={String(summary.staleDeclarations)} color="var(--caution)" />
          <SummaryStat label={t.fleet.summary.deadlines} value={String(fleet.deadlines30d)} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16, padding: 0, overflowX: 'auto' }}>
        {/* the measured-profile note below is not a row. */}
        <div role="table" aria-label={t.a11y.tables.fleet}>
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
              role="columnheader"
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
        {rows.map((row) => (
          <ServiceRow key={row.domain} row={row} />
        ))}
        </div>
        <div
          style={{
            padding: '10px 17px',
            fontSize: 10.5,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            borderTop: '1px solid rgba(21,24,27,.1)',
          }}
        >
          {fill(t.fleet.measuredNote, { profile: obs.profile })}
        </div>
      </div>

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">{t.fleet.benchmarkTitle}</span>
          <svg
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            style={{ display: 'block', marginTop: 14, width: '100%', height: 'auto' }}
            aria-hidden="true"
          >
            <line x1={CHART.left} y1={CHART.base} x2={CHART.right} y2={CHART.base} stroke="var(--text-secondary)" strokeOpacity=".35" />
            <g fill="var(--text-secondary)" opacity=".35">
              {chart.bars.map((bar) => {
                const height = bar.height * (CHART.base - CHART.top);
                return (
                  <rect
                    key={bar.x}
                    x={x(bar.x) + 1}
                    y={CHART.base - height}
                    width={Math.max(1, bar.width * (CHART.right - CHART.left) - 2)}
                    height={height}
                  />
                );
              })}
            </g>
            {/* both labels sit to the right of their own line and stagger
                vertically, because the marker and the corpus median can land
                on adjacent bytes. leaning one of them left clipped it off the
                viewbox as soon as the service was near the light end. */}
            <line x1={x(chart.marker)} y1="18" x2={x(chart.marker)} y2="80" stroke="var(--measured)" strokeWidth="2" />
            <text x={label(x(chart.marker), chart.markerLabel)} y="10" fill="var(--measured)" fontFamily="var(--font-mono)" fontSize="8">
              {chart.markerLabel}
            </text>
            <line
              x1={x(chart.median)}
              y1="22"
              x2={x(chart.median)}
              y2="80"
              stroke="var(--ink)"
              strokeDasharray="3 2"
              strokeOpacity=".6"
            />
            <text
              x={label(x(chart.median), chart.medianLabel)}
              y="22"
              fill="var(--ink)"
              fillOpacity=".7"
              fontFamily="var(--font-mono)"
              fontSize="8"
            >
              {chart.medianLabel}
            </text>
            <g fill="var(--text-tertiary)" fontFamily="var(--font-mono)" fontSize="7.5">
              <text x={CHART.left} y="92">{chart.axis[0]}</text>
              <text x={x(0.5)} y="92" textAnchor="middle">{chart.axis[1]}</text>
              <text x={CHART.right} y="92" textAnchor="end">{chart.axis[2]}</text>
            </g>
          </svg>
          <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            {chart.caption}
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
