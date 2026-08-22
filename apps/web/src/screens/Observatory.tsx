import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ToleranceBand } from '@balise/ui';
import { fill, tFr } from '../i18n';
import { observatoryFixture as obs } from '../fixtures/canon';
import { corpusCanon } from '../fixtures/corpus-canon';
import { referenceModelRef } from '../lib/carbon-view';
import { PublicHeader } from '../components/PublicHeader';
import {
  AUDITED_DOMAIN,
  corpusRows,
  declarationText,
  declarationTone,
  hostingText,
  hostingTone,
  TONE_COLOR,
  trendColor,
  trendText,
  weightText,
  type CorpusRow,
} from '../lib/corpus-view';
import {
  filterObservatory,
  isFiltered,
  NO_FILTER,
  toggleSector,
  type ObservatoryFilter,
} from '../lib/observatory-filter';

const GRID =
  '34px minmax(150px,1.4fr) minmax(160px,1.1fr) 126px 62px 74px 78px 82px 104px 84px';

// the chips are a subset of the sectors in the index: a row outside them stays
// visible unfiltered and is reachable by no chip.
const SECTORS = ['epci', 'communes', 'etat', 'sante', 'transport'] as const;

const GRADE_COLOR = {
  none: undefined,
  caution: 'var(--caution)',
  breach: 'var(--breach)',
} as const;

function IndexRow({ row }: { row: CorpusRow }) {
  const highlighted = row.domain === AUDITED_DOMAIN;
  return (
    <div
      role="row"
      className="row-hover"
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 12px',
        alignItems: 'center',
        padding: '9px 17px',
        borderBottom: '1px solid var(--divider-row)',
        background: highlighted ? 'var(--selected-row)' : undefined,
      }}
    >
      <span role="cell" className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
        {String(row.rank).padStart(2, '0')}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10.5, color: highlighted ? 'var(--measured)' : undefined }}>
        {row.domain}
      </span>
      <span role="cell" style={{ fontSize: 10.5 }}>{row.organisme}</span>
      <span role="cell">
      <ToleranceBand
        size="compact"
        width={126}
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
        unitLabel={tFr.dashboard.tiles.carbonUnit}
      />
      </span>
      <span
        role="cell"
        className="archivo"
        style={{
          fontWeight: 700,
          fontSize: 12,
          textAlign: 'right',
          color: GRADE_COLOR[row.carbon.gradeTone],
        }}
      >
        {row.carbon.grade}
      </span>
      <span
        role="cell"
        className="mono"
        style={{
          fontSize: 10.5,
          textAlign: 'right',
          color: row.weight.tone === 'none' ? undefined : GRADE_COLOR[row.weight.tone],
        }}
      >
        {weightText(row)}
      </span>
      <span
        role="cell"
        className="mono"
        style={{ fontSize: 10, textAlign: 'right', color: trendColor(row.trend.classification) }}
      >
        {trendText(row, tFr)}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10, color: TONE_COLOR[hostingTone(row)] }}>
        {hostingText(row, tFr)}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10, color: TONE_COLOR[declarationTone(row)] }}>
        {declarationText(row, tFr)}
      </span>
      <span role="cell" className="mono" style={{ fontSize: 10, textAlign: 'right', color: 'var(--text-secondary)' }}>
        {row.agency ?? tFr.observatory.noAgency}
      </span>
    </div>
  );
}

export function Observatory() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ObservatoryFilter>(NO_FILTER);
  const rows = filterObservatory(corpusRows(), filter);
  const filtered = isFiltered(filter);

  const headers = [
    tFr.observatory.headers.rank,
    tFr.observatory.headers.service,
    tFr.observatory.headers.organisme,
    tFr.observatory.headers.footprint,
    tFr.observatory.headers.grade,
    tFr.observatory.headers.kb,
    tFr.observatory.headers.trend,
    tFr.observatory.headers.hosting,
    tFr.observatory.headers.declaration,
    tFr.observatory.headers.agency,
  ];

  return (
    <div className="screen-public">
      <PublicHeader
        path={tFr.observatory.path}
        links={
          <>
            <button type="button" onClick={() => navigate('/public/scan')}>
              {tFr.observatory.navScan}
            </button>
            <a href="#methodology">{tFr.observatory.navMethodology}</a>
          </>
        }
      />
      <div style={{ padding: '32px 26px 60px' }}>
        <h1 className="archivo" style={{ margin: 0, fontWeight: 600, fontSize: 22 }}>
          {tFr.observatory.title}
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: 11.5, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '76ch' }}>
          {fill(tFr.observatory.introBefore, { count: corpusCanon.size, date: obs.measuredOn })}
          <span className="mono" style={{ fontSize: 10.5 }}>
            {obs.profile}
          </span>
          {tFr.observatory.introAfter}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <span
            className="mono"
            style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)' }}
          >
            {tFr.observatory.filtersLabel}
          </span>
          {SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              className={filter.sector === sector ? 'chip active' : 'chip'}
              aria-pressed={filter.sector === sector}
              onClick={() => setFilter(toggleSector(filter, sector))}
            >
              {tFr.observatory.sectors[sector]}
            </button>
          ))}
          <button
            type="button"
            className={filter.withoutDeclaration ? 'chip chip-breach active' : 'chip chip-breach'}
            style={{ marginLeft: 12 }}
            aria-pressed={filter.withoutDeclaration}
            onClick={() => setFilter({ ...filter, withoutDeclaration: !filter.withoutDeclaration })}
          >
            {fill(tFr.observatory.withoutDeclaration, { count: corpusCanon.withoutDeclaration })}
          </button>
        </div>

        <div className="card" style={{ marginTop: 12, padding: 0, overflowX: 'auto' }}>
          {/* the empty state below is not a row. */}
          <div role="table" aria-label={tFr.a11y.tables.observatory}>
          <div
            role="row"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 12px',
              alignItems: 'center',
              padding: '10px 17px 8px',
              borderBottom: '1px solid rgba(21,24,27,.14)',
            }}
          >
            {headers.map((header, index) => (
              <span
                key={header}
                role="columnheader"
                className="mono"
                style={{
                  fontWeight: 500,
                  fontSize: 9,
                  letterSpacing: '.07em',
                  color: 'var(--text-tertiary)',
                  textAlign: index === 4 || index === 5 || index === 6 || index === 9 ? 'right' : 'left',
                }}
              >
                {header}
              </span>
            ))}
          </div>
          {rows.map((row) => (
            <IndexRow key={row.domain} row={row} />
          ))}
          </div>
          {rows.length === 0 ? (
            <div style={{ padding: '26px 17px' }}>
              <div style={{ fontWeight: 500, fontSize: 12.5 }}>{tFr.observatory.emptyTitle}</div>
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  maxWidth: '62ch',
                }}
              >
                {fill(tFr.observatory.emptyBody, { total: corpusCanon.size })}
              </p>
              <button type="button" className="btn" style={{ marginTop: 14 }} onClick={() => setFilter(NO_FILTER)}>
                {tFr.observatory.emptyAction}
              </button>
            </div>
          ) : null}
          <div
            style={{
              padding: '11px 17px',
              fontSize: 10.5,
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              borderTop: '1px solid rgba(21,24,27,.1)',
            }}
            id="methodology"
          >
            {filtered
              ? fill(tFr.observatory.filteredFooter, { shown: rows.length, total: corpusCanon.size })
              : tFr.observatory.footer}
            <br />
            {/* invariant 1: the bands in this table name their reference model */}
            {fill(tFr.observatory.footerModel, {
              models: corpusCanon.rows[0]!.carbon.modelCount,
              model: `${referenceModelRef().id}@${referenceModelRef().version}`,
              methodology: obs.methodology,
            })}
            <br />
            {fill(tFr.observatory.footerHosting, {
              verified: corpusCanon.hostingVerified,
              total: corpusCanon.size,
              unchecked: corpusCanon.hostingUnchecked,
            })}
            <br />
            {tFr.observatory.footerTrend}
          </div>
        </div>
      </div>
    </div>
  );
}
