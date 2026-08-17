import { useState } from 'react';
import { fill, t } from '../i18n';
import { runDetailFixture as run } from '../fixtures/canon';
import { formatInt } from '@balise/ui';
import { Waterfall } from '../components/Waterfall';
import { ModelComparison } from '../components/ModelComparison';
import { DispersionPlot } from '../components/DispersionPlot';

type Tab = 'waterfall' | 'resources' | 'dispersion' | 'models' | 'environment';

const TABS: Tab[] = ['waterfall', 'resources', 'dispersion', 'models', 'environment'];

function ModelOutputsCard() {
  return (
    <div className="card">
      <span className="eyebrow">{t.runDetail.modelsTitle}</span>
      <div style={{ marginTop: 14 }}>
        <ModelComparison models={run.models} scaleMin={run.modelScale.min} scaleMax={run.modelScale.max} />
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '62ch' }}>
        {t.runDetail.modelsCaption}
      </p>
    </div>
  );
}

function DispersionCard() {
  const d = run.dispersion;
  return (
    <div className="card">
      <span className="eyebrow">{fill(t.runDetail.dispersionTitle, { n: d.baselineRuns.length })}</span>
      <div style={{ marginTop: 12 }}>
        <DispersionPlot
          baselineRuns={d.baselineRuns}
          candidateRuns={d.candidateRuns}
          baselineMedian={d.baselineMedian}
          candidateMedian={d.candidateMedian}
          mad={d.mad}
          noise={d.noiseKb}
          scaleMin={d.scaleMin}
          scaleMax={d.scaleMax}
          noiseLabel={fill(t.runDetail.noiseFloorLabel, { value: d.noiseKb })}
          deltaLabel={fill(t.runDetail.deltaTimesNoise, { delta: d.deltaKb, ratio: d.noiseRatio })}
          baselineRowLabel={t.runDetail.baselineRow}
          candidateRowLabel={t.runDetail.candidateRow}
          significant
        />
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '62ch' }}>
        {fill(t.runDetail.dispersionCaption, { mad: run.dispersion.mad })}
      </p>
    </div>
  );
}

function FingerprintCard() {
  return (
    <div className="card">
      <span className="eyebrow">{t.runDetail.fingerprintTitle}</span>
      <div className="kv-grid" style={{ marginTop: 12 }}>
        {run.fingerprint.map((entry) => (
          <div key={entry.key} style={{ display: 'contents' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              {entry.key}
            </span>
            {entry.link === true ? (
              <a href="#ledger" className="mono" style={{ fontSize: 10.5 }}>
                {entry.value} ↗
              </a>
            ) : (
              <span className="mono" style={{ fontSize: 10.5 }}>
                {entry.value}
              </span>
            )}
          </div>
        ))}
      </div>
      <div
        className="left-rule"
        style={{
          marginTop: 14,
          borderLeftColor: 'var(--conforme)',
          background: 'rgba(62,122,94,.06)',
          padding: '9px 11px 9px 11px',
        }}
      >
        <span style={{ fontSize: 10.5, lineHeight: 1.55, color: 'var(--ink)' }}>
          {t.runDetail.fingerprintMatchNote}
        </span>
      </div>
    </div>
  );
}

export function RunDetail() {
  const [tab, setTab] = useState<Tab>('waterfall');

  return (
    <>
      <h1 className="screen-title">{fill(t.runDetail.title, { id: run.id })}</h1>
      <div className="screen-subtitle">
        <span className="mono" style={{ fontSize: 10.5 }}>{run.timestamp}</span>
        {' · '}
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink)' }}>{run.route}</span>
        {' · '}
        <span className="mono" style={{ fontSize: 10.5 }}>{run.profile}</span>
        {' · '}
        {t.runDetail.coldCache}
      </div>

      <div className="tabs" role="tablist" aria-label={fill(t.runDetail.title, { id: run.id })}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'tab active' : 'tab'}
            onClick={() => setTab(key)}
          >
            {t.runDetail.tabs[key]}
          </button>
        ))}
      </div>

      {tab === 'waterfall' ? (
        <div className="dashboard-cols" style={{ gridTemplateColumns: '1.5fr 1fr', marginTop: 14 }}>
          <div className="card">
            <span className="eyebrow">
              {fill(t.runDetail.waterfallTitle, { requests: run.requests, kb: formatInt(run.totalKb) })}
            </span>
            <div style={{ marginTop: 4 }}>
              <Waterfall rows={run.waterfall} moreCount={run.moreCount} moreKb={run.moreKb} />
            </div>
          </div>
          <div className="stack">
            <ModelOutputsCard />
            <DispersionCard />
            <FingerprintCard />
          </div>
        </div>
      ) : null}

      {tab === 'dispersion' ? (
        <div style={{ marginTop: 14, maxWidth: 720 }}>
          <DispersionCard />
        </div>
      ) : null}

      {tab === 'models' ? (
        <div style={{ marginTop: 14, maxWidth: 720 }}>
          <ModelOutputsCard />
        </div>
      ) : null}

      {tab === 'environment' ? (
        <div style={{ marginTop: 14, maxWidth: 720 }}>
          <FingerprintCard />
        </div>
      ) : null}

      {tab === 'resources' ? (
        <p style={{ marginTop: 18, fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '56ch' }}>
          {fill(t.runDetail.plannedPanel, { version: 'V0.2' })}
        </p>
      ) : null}
    </>
  );
}
