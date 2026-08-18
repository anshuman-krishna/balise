import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ToleranceBand, formatInt } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon, observatoryFixture as obs, type ObservatoryRow } from '../fixtures/canon';
import { PublicHeader } from '../components/PublicHeader';
import {
  filterObservatory,
  isFiltered,
  NO_FILTER,
  toggleSector,
  type ObservatoryFilter,
} from '../lib/observatory-filter';

const GRID =
  '34px minmax(160px,1.5fr) minmax(170px,1.1fr) 132px 66px 74px 82px 116px 96px';

// the chips are a subset of the sectors in the index: a row outside them
// stays visible in the unfiltered extract and is reachable by no chip.
const SECTORS = ['epci', 'communes', 'etat', 'sante', 'transport'] as const;

const DECLARATION_COLOR = {
  ok: 'var(--conforme)',
  muted: 'var(--text-secondary)',
  caution: 'var(--caution)',
  breach: 'var(--breach)',
} as const;

const TONE_COLOR = {
  caution: 'var(--caution)',
  breach: 'var(--breach)',
} as const;

/**
 * a movement below the noise floor is not a change, so it is never coloured
 * as one. that rule is the same here as in the comparison verdicts.
 */
function trendColor(trend: ObservatoryRow['trend']): string {
  if (trend === null) {
    return 'var(--text-tertiary)';
  }
  if (!trend.significant) {
    return 'var(--text-secondary)';
  }
  return trend.pct < 0 ? 'var(--conforme)' : 'var(--breach)';
}

function trendText(trend: ObservatoryRow['trend']): string {
  if (trend === null) {
    return t.observatory.trendNa;
  }
  return `${trend.pct > 0 ? '+' : '−'}${Math.abs(trend.pct)}%`;
}

function IndexRow({ row }: { row: ObservatoryRow }) {
  return (
    <div
      className="row-hover"
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 13px',
        alignItems: 'center',
        padding: '9px 17px',
        borderBottom: '1px solid var(--divider-row)',
        background: row.highlighted === true ? 'var(--selected-row)' : undefined,
      }}
    >
      <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
        {String(row.rank).padStart(2, '0')}
      </span>
      <span
        className="mono"
        style={{ fontSize: 10.5, color: row.highlighted === true ? 'var(--measured)' : undefined }}
      >
        {row.domain}
      </span>
      <span style={{ fontSize: 10.5 }}>{row.organisme}</span>
      <ToleranceBand
        size="compact"
        width={132}
        scaleMin={obs.scale.min}
        scaleMax={obs.scale.max}
        median={row.band.median}
        bandLow={row.band.low}
        bandHigh={row.band.high}
        noiseLow={row.band.noiseLow}
        noiseHigh={row.band.noiseHigh}
        referenceModel={canon.referenceModel}
        confidence={row.band.confidence}
        state={row.band.state}
        unitLabel={t.dashboard.tiles.carbonUnit}
      />
      <span
        className="archivo"
        style={{
          fontWeight: 700,
          fontSize: 12,
          textAlign: 'right',
          color: row.gradeTone === undefined ? undefined : TONE_COLOR[row.gradeTone],
        }}
      >
        {row.grade}
      </span>
      <span
        className="mono"
        style={{
          fontSize: 10.5,
          textAlign: 'right',
          color: row.kbTone === undefined ? undefined : TONE_COLOR[row.kbTone],
        }}
      >
        {formatInt(row.kb)}
      </span>
      <span className="mono" style={{ fontSize: 10, textAlign: 'right', color: trendColor(row.trend) }}>
        {trendText(row.trend)}
      </span>
      <span
        className="mono"
        style={{
          fontSize: 10,
          color: row.declaration === null ? 'var(--breach)' : DECLARATION_COLOR[row.declaration.tone],
        }}
      >
        {row.declaration === null ? t.observatory.declarationNone : row.declaration.text}
      </span>
      <span className="mono" style={{ fontSize: 10, textAlign: 'right', color: 'var(--text-secondary)' }}>
        {row.agency ?? t.observatory.noAgency}
      </span>
    </div>
  );
}

export function Observatory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ObservatoryFilter>(NO_FILTER);
  const rows = filterObservatory(obs.rows, filter);
  const filtered = isFiltered(filter);

  const headers = [
    t.observatory.headers.rank,
    t.observatory.headers.service,
    t.observatory.headers.organisme,
    t.observatory.headers.footprint,
    t.observatory.headers.grade,
    t.observatory.headers.kb,
    t.observatory.headers.trend,
    t.observatory.headers.declaration,
    t.observatory.headers.agency,
  ];

  return (
    <div className="screen-public">
      <PublicHeader
        path={t.observatory.path}
        links={
          <>
            <button type="button" onClick={() => navigate('/public/scan')}>
              {t.observatory.navScan}
            </button>
            <a href="#methodology">{t.observatory.navMethodology}</a>
          </>
        }
      />
      <div style={{ padding: '32px 26px 60px' }}>
        <h1 className="archivo" style={{ margin: 0, fontWeight: 600, fontSize: 22 }}>
          {t.observatory.title}
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '76ch' }}>
          {fill(t.observatory.introBefore, { count: formatInt(obs.total), date: obs.measuredOn })}
          <span className="mono" style={{ fontSize: 10.5 }}>
            {obs.profile}
          </span>
          {t.observatory.introAfter}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <span
            className="mono"
            style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)' }}
          >
            {t.observatory.filtersLabel}
          </span>
          {SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              className={filter.sector === sector ? 'chip active' : 'chip'}
              aria-pressed={filter.sector === sector}
              onClick={() => setFilter(toggleSector(filter, sector))}
            >
              {t.observatory.sectors[sector]}
            </button>
          ))}
          <button
            type="button"
            className={filter.withoutDeclaration ? 'chip chip-breach active' : 'chip chip-breach'}
            style={{ marginLeft: 12 }}
            aria-pressed={filter.withoutDeclaration}
            onClick={() => setFilter({ ...filter, withoutDeclaration: !filter.withoutDeclaration })}
          >
            {fill(t.observatory.withoutDeclaration, { count: formatInt(obs.withoutDeclaration) })}
          </button>
        </div>

        <div className="card" style={{ marginTop: 12, padding: 0, overflowX: 'auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 13px',
              alignItems: 'center',
              padding: '10px 17px 8px',
              borderBottom: '1px solid rgba(21,24,27,.14)',
            }}
          >
            {headers.map((header, index) => (
              <span
                key={header}
                className="mono"
                style={{
                  fontWeight: 500,
                  fontSize: 9,
                  letterSpacing: '.07em',
                  color: 'var(--text-tertiary)',
                  textAlign: index === 4 || index === 5 || index === 6 || index === 8 ? 'right' : 'left',
                }}
              >
                {header}
              </span>
            ))}
          </div>
          {rows.map((row) => (
            <IndexRow key={row.domain} row={row} />
          ))}
          {rows.length === 0 ? (
            <div style={{ padding: '26px 17px' }}>
              <div style={{ fontWeight: 500, fontSize: 12.5 }}>{t.observatory.emptyTitle}</div>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  maxWidth: '62ch',
                }}
              >
                {fill(t.observatory.emptyBody, { shown: obs.rows.length, total: formatInt(obs.total) })}
              </p>
              <button type="button" className="btn" style={{ marginTop: 14 }} onClick={() => setFilter(NO_FILTER)}>
                {t.observatory.emptyAction}
              </button>
            </div>
          ) : null}
          <div
            style={{
              padding: '11px 17px',
              fontSize: 10.5,
              lineHeight: 1.6,
              color: 'var(--text-secondary)',
              borderTop: '1px solid rgba(21,24,27,.1)',
            }}
          >
            {filtered
              ? fill(t.observatory.filteredFooter, { shown: rows.length })
              : fill(t.observatory.footer, { total: formatInt(obs.total) })}
            <br />
            {/* invariant 1: the bands in this table name their reference model */}
            {fill(t.observatory.footerModel, {
              models: obs.modelCount,
              model: `${canon.referenceModel.id}@${canon.referenceModel.version}`,
              methodology: obs.methodology,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
