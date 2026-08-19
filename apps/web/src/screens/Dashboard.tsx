import { Link } from 'react-router';
import { formatInt, formatNumber, formatSigned, ToleranceTrend } from '@balise/ui';
import { fill, t } from '../i18n';
import { canon } from '../fixtures/canon';
import { criteriaCanon } from '../fixtures/criteria-canon';
import { pendingDeclarative, sourceLine, tierCards } from '../lib/criteria-view';
import { MetricTile } from '../components/MetricTile';

// the completeness card reads the engine's answers, in the pack's tier order.
const completenessRows = tierCards();
const answeredTotal = completenessRows.reduce((total, row) => total + row.answered, 0);

function TierRow({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const overColor = done < total && color === 'var(--conforme)' ? 'var(--measured)' : color;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span
          className="mono"
          style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.07em', color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
        <span className="mono" style={{ fontSize: 10, color: overColor }}>
          {done}/{total}
        </span>
      </div>
      <div className="progress-track" style={{ marginTop: 5 }}>
        <div
          className="progress-fill"
          style={{ width: `${(done / total) * 100}%`, background: overColor }}
        />
      </div>
    </div>
  );
}

export function Dashboard() {
  const d = t.dashboard;
  const ref = canon.referenceModel;
  const referenceLabel = `${ref.id}@${ref.version}`;

  return (
    <>
      <h1 className="screen-title">{canon.service.title}</h1>
      <div className="screen-subtitle">
        {fill(d.scopeLine, { scenarios: canon.service.scenarios, journeys: canon.service.journeys })}
        {' · '}
        {fill(d.continuousSince, {
          date: canon.service.continuousSince,
          runs: formatInt(canon.service.runsRetained),
        })}
      </div>

      <div className="tile-grid">
        <MetricTile
          label={d.tiles.carbonPerVisit}
          valueText={formatNumber(canon.carbon.median, 2)}
          unitText={d.tiles.carbonUnit}
          rightPrimary={`${formatNumber(canon.carbon.low, 2)} – ${formatNumber(canon.carbon.high, 2)}`}
          rightSecondary={fill(d.tiles.acrossModels, { count: canon.models.length })}
          confidence="high"
          confidenceLabel={t.confidence.high}
          band={{
            scaleMin: canon.carbon.scaleMin,
            scaleMax: canon.carbon.scaleMax,
            median: canon.carbon.median,
            bandLow: canon.carbon.low,
            bandHigh: canon.carbon.high,
            noiseLow: canon.carbon.noiseLow,
            noiseHigh: canon.carbon.noiseHigh,
            referenceModel: ref,
            confidence: 'high',
            unitLabel: d.tiles.carbonUnit,
          }}
          provenance={fill(d.tiles.provenanceReference, {
            model: referenceLabel,
            count: canon.models.length,
          })}
        />

        <MetricTile
          label={d.tiles.transferred}
          valueText={formatInt(canon.transferred.medianKb)}
          unitText={d.tiles.kbUnit}
          rightPrimary={fill(d.tiles.madShort, { value: canon.transferred.madKb })}
          confidence="high"
          confidenceLabel={t.confidence.high}
          band={{
            scaleMin: canon.transferred.scaleMin,
            scaleMax: canon.transferred.scaleMax,
            median: canon.transferred.medianKb,
            bandLow: canon.transferred.medianKb - canon.transferred.madKb,
            bandHigh: canon.transferred.medianKb + canon.transferred.madKb,
            noiseLow: canon.transferred.medianKb - canon.transferred.noiseKb,
            noiseHigh: canon.transferred.medianKb + canon.transferred.noiseKb,
            budget: canon.transferred.budgetKb,
            referenceModel: ref,
            confidence: 'high',
            unitLabel: d.tiles.kbUnit,
          }}
          provenance={d.tiles.provenanceMeasured}
        />

        <MetricTile
          label={d.tiles.thirdPartyShare}
          valueText={formatInt(canon.thirdParty.sharePct)}
          unitText={d.tiles.pctOfBytes}
          rightPrimary={fill(d.tiles.commitCeiling, { value: canon.thirdParty.commitCeilingPct })}
          confidence="high"
          confidenceLabel={t.confidence.high}
          band={{
            scaleMin: canon.thirdParty.scaleMin,
            scaleMax: canon.thirdParty.scaleMax,
            median: canon.thirdParty.sharePct,
            bandLow: canon.thirdParty.bandLow,
            bandHigh: canon.thirdParty.bandHigh,
            budget: canon.thirdParty.commitCeilingPct,
            // absolute contractual threshold, no delta involved: breach is
            // legitimate without a classification.
            state: 'breach',
            referenceModel: ref,
            confidence: 'high',
            unitLabel: d.tiles.pctOfBytes,
          }}
          provenance={d.tiles.provenanceMeasured}
          stateMessage={{ text: d.tiles.thresholdBreached, tone: 'breach' }}
        />

        <MetricTile
          label={d.tiles.domNodes}
          valueText={formatInt(canon.domNodes.median)}
          unitText={d.tiles.nodesUnit}
          rightPrimary={fill(d.tiles.madShort, { value: canon.domNodes.mad })}
          confidence="medium"
          confidenceLabel={t.confidence.medium}
          band={{
            scaleMin: canon.domNodes.scaleMin,
            scaleMax: canon.domNodes.scaleMax,
            median: canon.domNodes.median,
            bandLow: canon.domNodes.bandLow,
            bandHigh: canon.domNodes.bandHigh,
            noiseLow: canon.domNodes.noiseLow,
            noiseHigh: canon.domNodes.noiseHigh,
            referenceModel: ref,
            confidence: 'medium',
            unitLabel: d.tiles.nodesUnit,
          }}
          provenance={d.tiles.provenanceMeasured}
          stateMessage={{
            text: fill(d.tiles.dispersionHigh, {
              varied: canon.domNodes.runsVaried,
              total: canon.domNodes.runsTotal,
            }),
            tone: 'caution',
          }}
        />
      </div>

      <div className="dashboard-cols">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="eyebrow">{d.trend.title}</span>
            <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>
              {fill(d.trend.journeyLabel, { journey: canon.trend.journey })}
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <ToleranceTrend
              points={canon.trend.points}
              deploys={canon.trend.deploys}
              gridValues={canon.trend.gridValues}
              budget={canon.trend.budgetKb}
              budgetLabel={fill(d.trend.budgetLabel, { value: formatInt(canon.trend.budgetKb) })}
              startLabel={canon.trend.startLabel}
              endLabel={canon.trend.endLabel}
              unitLabel={d.tiles.kbUnit}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--divider-cell)',
            }}
          >
            <div className="left-rule breach" style={{ flex: 1 }}>
              <div className="mono" style={{ fontWeight: 500, fontSize: 9.5, letterSpacing: '.05em', color: 'var(--breach)' }}>
                REGRESSION · PR #412
              </div>
              <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.45 }}>
                {formatSigned(canon.regression.gainedKb)} KB, clears the noise floor by 26x.
              </div>
            </div>
            <div className="left-rule" style={{ flex: 1 }}>
              <div className="mono" style={{ fontWeight: 500, fontSize: 9.5, letterSpacing: '.05em', color: 'var(--text-secondary)' }}>
                PR #417 · Δ −5 KB
              </div>
              <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.45, color: 'var(--text-secondary)' }}>
                Inside the noise field. Reported as {t.verdicts.noSigFull.toLowerCase()}.
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <span className="eyebrow">{d.regressions.title} · 1</span>
            <div className="left-rule breach" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                <span className="mono" style={{ fontSize: 10.5 }}>
                  {canon.regression.route}
                </span>{' '}
                {d.regressions.gained}{' '}
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--breach)' }}>
                  {formatSigned(canon.regression.gainedKb)} KB
                </span>
              </div>
              <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                160 KB is <span className="mono" style={{ fontSize: 10 }}>date-fns</span> locale data
                introduced by <span className="mono" style={{ fontSize: 10 }}>PR #412</span> · c. bellanger
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Link to="/comparison" className="btn btn-primary" style={{ display: 'inline-block' }}>
                  {d.regressions.openComparison}
                </Link>
                <button type="button" className="btn">
                  {d.regressions.addToBacklog}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="eyebrow">{d.completeness.title}</span>
              <span className="mono" style={{ fontSize: 10 }}>
                {answeredTotal}/{criteriaCanon.pack.criteriaCount}
              </span>
            </div>
            {completenessRows.map((row) => (
              <TierRow key={row.tier} label={row.label} done={row.answered} total={row.total} color={row.color} />
            ))}
            <p style={{ margin: '12px 0 0', fontSize: 10.5, lineHeight: 1.55, color: 'var(--text-secondary)', maxWidth: '52ch' }}>
              {fill(d.completeness.declarativeNote, { count: pendingDeclarative() })}
            </p>
            <p
              className="mono"
              style={{ margin: '8px 0 0', fontSize: 9.5, lineHeight: 1.5, color: 'var(--text-tertiary)', maxWidth: '52ch' }}
            >
              {sourceLine()}
            </p>
          </div>

          <div className="card-dark">
            <span className="eyebrow">{d.deadline.title}</span>
            <div className="mono" style={{ marginTop: 12, fontSize: 22, letterSpacing: '-.02em' }}>
              {canon.deadline.date}
            </div>
            <div style={{ marginTop: 6, fontSize: 10.5, color: 'var(--on-dark-text)' }}>
              {fill(d.deadline.detail, { contract: canon.deadline.contract, days: canon.deadline.days })}
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="button" className="btn btn-on-dark">
                {d.deadline.previewReport}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
