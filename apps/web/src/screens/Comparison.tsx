import { Link } from 'react-router';
import type { Confidence, DeltaClassification } from '@balise/schemas';
import { classifyDelta } from '@balise/measure-core';
import { formatInt, formatNumber, formatSigned, ToleranceBand } from '@balise/ui';
import { fill, t } from '../i18n';
import { comparisonFixture as cmp, type ComparisonRow } from '../fixtures/canon';
import {
  carbonDeltaRow,
  carbonPage,
  formatCarbon,
  referenceModelRef,
  referenceSpecLabel,
} from '../lib/carbon-view';
import { confidenceLabel } from '../lib/measurement-view';
import { comparable, differences, fieldList } from '../lib/fingerprint-view';
import { VERDICT_COLOR, verdictKeyFor, type VerdictKey } from '../lib/verdict';
import {
  attributionCoverage,
  attributionLead,
  attributionRows,
  originRows,
  unexplainedOrigin,
} from '../lib/attribution-view';

const GRID = 'minmax(160px,1.4fr) 88px 88px 96px 146px 92px';

function formatByKind(kind: ComparisonRow['kind'], value: number): string {
  switch (kind) {
    case 'kb':
      return formatInt(value / 1000);
    case 'ms':
      return `${formatInt(value)} ms`;
    case 'count':
      return formatInt(value);
    case 'g':
      return formatNumber(value, 2);
  }
}

function deltaByKind(kind: ComparisonRow['kind'], value: number): string {
  return kind === 'kb' ? formatSigned(value / 1000) : kind === 'g' ? formatSigned(value, 2) : formatSigned(value);
}

interface DisplayRow {
  label: string;
  confidence: Confidence;
  baselineText: string;
  candidateText: string;
  deltaText: string;
  verdict: VerdictKey;
  classification: DeltaClassification;
  band: {
    scaleMin: number;
    scaleMax: number;
    median: number;
    bandLow: number;
    bandHigh: number;
    noiseLow: number;
    noiseHigh: number;
  };
}

// the verdicts come from the kernel: classifyDelta is called here, not
// reimplemented. the delta band shows the delta against the noise field,
// centred on zero.
function toDisplayRow(row: ComparisonRow): DisplayRow {
  const delta = classifyDelta(row.before, row.after, row.floor);
  const floorValue = row.floor.status === 'established' ? row.floor.value : 0;
  const spread = Math.max(Math.abs(delta.value) + row.after.mad, floorValue * 2);
  return {
    label: row.label,
    confidence: row.confidence,
    baselineText: formatByKind(row.kind, row.before.median),
    candidateText: formatByKind(row.kind, row.after.median),
    deltaText: deltaByKind(row.kind, delta.value),
    verdict: verdictKeyFor(delta.classification, row.overThreshold),
    classification: delta.classification,
    band: {
      scaleMin: -spread * 0.35,
      scaleMax: spread * 1.15,
      median: delta.value,
      bandLow: delta.value - row.after.mad,
      bandHigh: delta.value + row.after.mad,
      noiseLow: -floorValue,
      noiseHigh: floorValue,
    },
  };
}

function VerdictCell({ verdict }: { verdict: VerdictKey }) {
  const label =
    verdict === 'breach'
      ? t.verdicts.breach
      : verdict === 'real'
        ? t.verdicts.real
        : verdict === 'noSig'
          ? t.verdicts.noSig
          : t.verdicts.indeterminate;
  return (
    <span
      className="mono"
      style={{ fontWeight: 500, fontSize: 9.5, letterSpacing: '.05em', textAlign: 'right', color: VERDICT_COLOR[verdict] }}
    >
      {label}
    </span>
  );
}

function RunChip({ run, date, tag, accent }: { run: string; date: string; tag: string; accent?: boolean }) {
  return (
    <Link
      to="/runs"
      style={{
        display: 'inline-block',
        padding: '8px 12px',
        border: `1px solid ${accent === true ? 'var(--measured)' : 'var(--border-strong)'}`,
        background: 'var(--surface)',
        color: 'inherit',
      }}
    >
      <span
        className="mono"
        style={{ display: 'block', fontWeight: 500, fontSize: 8.5, letterSpacing: '.08em', color: accent === true ? 'var(--measured)' : 'var(--text-tertiary)' }}
      >
        {tag}
      </span>
      <span className="mono" style={{ display: 'block', marginTop: 3, fontSize: 10.5 }}>
        {run} · {date}
      </span>
    </Link>
  );
}

export function Comparison() {
  const rows = cmp.rows.map(toDisplayRow);
  // the estimate row is derived: the figures come from @balise/carbon-models,
  // and its verdict is inherited from the transferred-bytes row rather than
  // decided again. an estimate that is monotone in a measured metric cannot be
  // significant on its own, so nothing here can make it so.
  const carbon = carbonDeltaRow();
  const driver = rows[0];
  // the attribution card is engine output: every figure below comes from
  // @balise/attribution, computed over two builds with real source maps.
  const lead = attributionLead();
  const attribution = attributionRows();
  const origins = originRows();
  const unexplained = unexplainedOrigin();
  // invariant 3, computed rather than asserted. the chip used to say the
  // environments matched whatever they were, on a screen whose whole job is to
  // put two runs beside each other.
  const matched = comparable('baseline', 'candidate');
  const differing = differences('baseline', 'candidate');

  return (
    <>
      <h1 className="screen-title">{t.nav.items.comparison}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <RunChip run={cmp.baseline.run} date={cmp.baseline.date} tag={fill(t.comparison.baselineTag, { branch: cmp.baseline.branch })} />
        <span aria-hidden="true" style={{ color: 'var(--text-secondary)' }}>→</span>
        <RunChip run={cmp.candidate.run} date={cmp.candidate.date} tag={fill(t.comparison.candidateTag, { branch: cmp.candidate.branch })} accent />
        <span
          className="mono"
          title={
            matched ? t.fingerprint.matched : fill(t.fingerprint.mismatched, { fields: fieldList(differing) })
          }
          style={{
            marginLeft: 'auto',
            padding: '5px 9px',
            border: `1px solid ${matched ? 'rgba(62,122,94,.4)' : 'rgba(179,49,44,.4)'}`,
            background: matched ? 'rgba(62,122,94,.08)' : 'var(--tint-breach)',
            color: matched ? 'var(--conforme)' : 'var(--breach)',
            fontWeight: 500,
            fontSize: 9,
            letterSpacing: '.06em',
          }}
        >
          {matched
            ? t.comparison.fingerprintMatch
            : fill(t.comparison.fingerprintDiffers, { fields: fieldList(differing) })}
        </span>
      </div>

      <div className="card" style={{ marginTop: 14, padding: 0, overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: '0 14px',
            padding: '11px 17px 9px',
            borderBottom: '1px solid rgba(21,24,27,.14)',
          }}
        >
          {[
            t.comparison.headers.metric,
            t.comparison.headers.baseline,
            t.comparison.headers.candidate,
            t.comparison.headers.delta,
            t.comparison.headers.vsNoise,
            t.comparison.headers.verdict,
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

        {rows.map((row) => (
          <div
            key={row.label}
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 14px',
              alignItems: 'center',
              padding: '10px 17px',
              borderBottom: '1px solid var(--divider-row)',
              background: row.verdict === 'breach' ? 'var(--tint-breach)' : undefined,
            }}
          >
            <span style={{ fontSize: 11.5 }}>
              {row.label}
              {/* the grade is the kernel's. anything short of high is said on
                  the row it applies to, in caution, wherever that row appears. */}
              {row.confidence === 'high' ? null : (
                <span style={{ color: 'var(--caution)', fontSize: 10 }}>
                  {' '}
                  △ {confidenceLabel(row.confidence)}
                </span>
              )}
            </span>
            <span className="mono" style={{ fontSize: 10.5, textAlign: 'right' }}>{row.baselineText}</span>
            <span
              className="mono"
              style={{ fontSize: 10.5, textAlign: 'right', color: row.verdict === 'breach' || row.verdict === 'real' ? VERDICT_COLOR[row.verdict] : 'var(--ink)' }}
            >
              {row.candidateText}
            </span>
            <span
              className="mono"
              style={{ fontSize: 10.5, textAlign: 'right', color: row.verdict === 'breach' ? 'var(--breach)' : 'var(--ink)' }}
            >
              {row.deltaText}
            </span>
            <ToleranceBand
              size="compact"
              width={146}
              scaleMin={row.band.scaleMin}
              scaleMax={row.band.scaleMax}
              median={row.band.median}
              bandLow={row.band.bandLow}
              bandHigh={row.band.bandHigh}
              noiseLow={row.band.noiseLow}
              noiseHigh={row.band.noiseHigh}
              referenceModel={referenceModelRef()}
              confidence={row.confidence}
              state={row.verdict === 'breach' ? 'breach' : 'normal'}
              deltaClassification={row.classification}
              unitLabel={t.comparison.headers.delta}
            />
            <VerdictCell verdict={row.verdict} />
          </div>
        ))}

        {carbon === null || driver === undefined ? null : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 14px',
              alignItems: 'center',
              padding: '10px 17px',
              background: driver.verdict === 'breach' ? 'var(--tint-breach)' : undefined,
            }}
          >
            <span style={{ fontSize: 11.5 }}>
              {fill(t.comparison.carbonRow, { model: referenceSpecLabel(carbonPage('candidate')) })}
            </span>
            <span className="mono" style={{ fontSize: 10.5, textAlign: 'right' }}>{formatCarbon(carbon.before)}</span>
            <span
              className="mono"
              style={{ fontSize: 10.5, textAlign: 'right', color: driver.verdict === 'breach' ? 'var(--breach)' : 'var(--ink)' }}
            >
              {formatCarbon(carbon.after)}
            </span>
            <span
              className="mono"
              style={{ fontSize: 10.5, textAlign: 'right', color: driver.verdict === 'breach' ? 'var(--breach)' : 'var(--ink)' }}
            >
              {formatSigned(carbon.delta, 3)}
            </span>
            <ToleranceBand
              size="compact"
              width={146}
              scaleMin={-carbon.floor * 2}
              scaleMax={carbon.bandHigh * 1.15}
              median={carbon.delta}
              bandLow={carbon.bandLow}
              bandHigh={carbon.bandHigh}
              noiseLow={-carbon.floor}
              noiseHigh={carbon.floor}
              referenceModel={referenceModelRef(carbonPage('candidate'))}
              confidence="high"
              state={driver.verdict === 'breach' ? 'breach' : 'normal'}
              deltaClassification={driver.classification}
              unitLabel={t.comparison.headers.delta}
            />
            <VerdictCell verdict={driver.verdict} />
          </div>
        )}
      </div>

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">{t.comparison.attributionTitle}</span>
          <div className="left-rule breach" style={{ marginTop: 12 }}>
            <span style={{ fontSize: 11.5, lineHeight: 1.6 }}>
              {lead.map((part, index) =>
                part.token === true ? (
                  <span key={index} className="mono" style={{ fontSize: 10.5 }}>
                    {part.text}
                  </span>
                ) : part.measure === true ? (
                  <strong key={index} className="mono" style={{ fontSize: 10.5 }}>
                    {part.text}
                  </strong>
                ) : (
                  <span key={index}>{part.text}</span>
                ),
              )}
            </span>
          </div>
          <div className="kv-grid" style={{ marginTop: 14, gridTemplateColumns: '86px 1fr auto' }}>
            {attribution.map((entry) => (
              <div key={entry.key} style={{ display: 'contents' }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                  {t.comparison.attributionKeys[entry.key]}
                </span>
                <span className="mono" style={{ fontSize: 10.5, overflowWrap: 'anywhere' }}>{entry.value}</span>
                <span
                  className="mono"
                  style={{ fontSize: 10, textAlign: 'right', color: entry.tone === 'breach' ? 'var(--breach)' : 'var(--text-secondary)' }}
                >
                  {entry.note}
                </span>
              </div>
            ))}
          </div>
          <div className="inset-panel" style={{ marginTop: 14 }}>
            <span style={{ fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {attributionCoverage()}
            </span>
          </div>
        </div>

        <div className="card">
          <span className="eyebrow">{t.comparison.thirdPartyTitle}</span>
          <div style={{ marginTop: 8 }}>
            {origins.map((row) => (
              <div
                key={row.origin}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  padding: '9px 0',
                  borderBottom: '1px solid var(--divider-row)',
                  background: row.isNew ? 'var(--tint-caution)' : undefined,
                }}
              >
                <span className="mono" style={{ fontSize: 10.5, color: row.isNew ? 'var(--caution)' : 'var(--ink)' }}>
                  {row.origin}
                </span>
                <span
                  className="mono"
                  style={{
                    marginLeft: 'auto',
                    fontSize: row.isNew ? 9.5 : 10,
                    fontWeight: row.isNew ? 500 : 400,
                    letterSpacing: row.isNew ? '.05em' : undefined,
                    color: row.isNew ? 'var(--caution)' : 'var(--text-secondary)',
                  }}
                >
                  {row.isNew ? t.comparison.newOrigin : t.comparison.unchanged}
                </span>
                <span className="mono" style={{ fontSize: 10.5, minWidth: 52, textAlign: 'right' }}>
                  {row.transferred}
                </span>
              </div>
            ))}
          </div>
          {unexplained === null ? null : (
            <div className="inset-panel" style={{ marginTop: 14 }}>
              <span style={{ fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {fill(t.comparison.noSourceMap, { origin: unexplained })}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
