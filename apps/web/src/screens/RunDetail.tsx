import { useState } from 'react';
import { Link } from 'react-router';
import { classifyDelta } from '@balise/measure-core';
import { formatInt, formatNumber, ToleranceDispersion } from '@balise/ui';
import { fill, t } from '../i18n';
import { runDetailFixture as run } from '../fixtures/canon';
import { REF, shortHash } from '../fixtures/ledger-refs';
import { Waterfall } from '../components/Waterfall';
import { ModelComparison } from '../components/ModelComparison';
import {
  allModelBars,
  carbonAsides,
  carbonPage,
  carbonProvenance,
  carbonScale,
  formatCarbon,
  modelsRan,
} from '../lib/carbon-view';
import { ResourceTable } from '../components/ResourceTable';
import { ResourceTypeSummary } from '../components/ResourceTypeSummary';
import { summariseResources } from '../lib/resources';

// the verdict on this card comes from the kernel, like the comparison
// verdicts do. nothing here decides for itself whether a delta is real.
const dispersionDelta = classifyDelta(run.dispersion.before, run.dispersion.after, run.dispersion.floor);
const deltaKb = Math.round(dispersionDelta.value / 1000);
const floorKb = run.dispersion.floor.status === 'established' ? run.dispersion.floor.value / 1000 : 0;
const noiseRatio = floorKb === 0 ? 0 : Math.round(Math.abs(deltaKb) / floorKb);
const resourceSummary = summariseResources(run.resources, run.remainder);

type Tab = 'waterfall' | 'resources' | 'dispersion' | 'models' | 'environment';

const TABS: Tab[] = ['waterfall', 'resources', 'dispersion', 'models', 'environment'];

function ModelOutputsCard() {
  const page = carbonPage('candidate');
  const axis = carbonScale(page);
  const bars = allModelBars(page).map((bar) => ({
    name: bar.label,
    value: bar.value,
    low: bar.low,
    high: bar.high,
    isReference: bar.isReference,
    inBand: bar.inBand,
    note: bar.note,
  }));

  // two plots, not one. putting a score-derived figure on the band's axis
  // would crush the models that share it into one mark and read as agreement
  // where there is none, which is the opposite of what 10.1 is for.
  const bandBars = bars.filter((bar) => bar.inBand);
  const asideBars = bars.filter((bar) => !bar.inBand);
  const asideMax = asideBars.length === 0 ? 0 : Math.max(...asideBars.map((bar) => bar.value)) * 1.15;

  return (
    <div className="card">
      <span className="eyebrow">{t.runDetail.modelsTitle}</span>
      <div style={{ marginTop: 14 }}>
        <span className="mono" style={{ fontWeight: 500, fontSize: 8.5, letterSpacing: '.1em', color: 'var(--text-tertiary)' }}>
          {t.carbon.bandTitle}
        </span>
        <div style={{ marginTop: 8 }}>
          <ModelComparison models={bandBars} scaleMin={axis.min} scaleMax={axis.max} format={formatCarbon} />
        </div>
      </div>
      {asideBars.length === 0 ? null : (
        <div style={{ marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--divider-cell)' }}>
          <span className="mono" style={{ fontWeight: 500, fontSize: 8.5, letterSpacing: '.1em', color: 'var(--text-tertiary)' }}>
            {t.carbon.asideTitle}
          </span>
          <div style={{ marginTop: 8 }}>
            <ModelComparison models={asideBars} scaleMin={0} scaleMax={asideMax} format={formatCarbon} />
          </div>
        </div>
      )}
      <p style={{ margin: '10px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '62ch' }}>
        {t.runDetail.modelsCaption}
      </p>
      {carbonAsides(page).map((aside) => (
        <p
          key={aside.id}
          style={{ margin: '8px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '62ch' }}
        >
          <span className="mono" style={{ fontSize: 9.5 }}>{aside.id}</span> {aside.note} {aside.ownValue}
        </p>
      ))}
      <p className="mono" style={{ margin: '8px 0 0', fontSize: 9.5, color: 'var(--text-tertiary)' }}>
        {carbonProvenance(page)}
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
        <ToleranceDispersion
          baselineRuns={d.baselineRuns}
          candidateRuns={d.candidateRuns}
          baselineMedian={d.baselineMedian}
          candidateMedian={d.candidateMedian}
          baselineMad={d.baselineMad}
          candidateMad={d.candidateMad}
          noise={d.noiseKb}
          scaleMin={d.scaleMin}
          scaleMax={d.scaleMax}
          noiseLabel={
            d.noiseKb === null
              ? t.runDetail.noFloorLabel
              : fill(t.runDetail.noiseFloorLabel, { value: formatNumber(d.noiseKb, 1) })
          }
          deltaLabel={fill(t.runDetail.deltaTimesNoise, { delta: deltaKb, ratio: noiseRatio })}
          baselineRowLabel={t.runDetail.baselineRow}
          candidateRowLabel={t.runDetail.candidateRow}
          deltaClassification={dispersionDelta.classification}
          formatTick={(value) => formatInt(value)}
        />
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '62ch' }}>
        {fill(t.runDetail.dispersionCaption, {
          baseMad: formatNumber(run.dispersion.baselineMad, 1),
          candMad: formatNumber(run.dispersion.candidateMad, 1),
          runs: run.dispersion.baselineRuns.length,
        })}
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
          // the models row is empty in the fixture on purpose: what ran is
          // read from the registry, so it cannot name a model this build does
          // not carry.
          <div key={entry.key} style={{ display: 'contents' }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              {entry.key}
            </span>
            {entry.link === true ? (
              <Link to={`/v/${shortHash(REF.run)}`} className="mono" style={{ fontSize: 10.5 }}>
                {entry.value} ↗
              </Link>
            ) : (
              <span className="mono" style={{ fontSize: 10.5 }}>
                {entry.key === 'models' ? modelsRan() : entry.value}
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
        <div className="dashboard-cols" style={{ gridTemplateColumns: '1.5fr 1fr', marginTop: 14 }}>
          <div className="stack">
            <ResourceTable
              records={run.resources}
              remainder={run.remainder}
              totalRequests={resourceSummary.totalRequests}
            />
            <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '72ch' }}>
              {t.runDetail.resources.coverageCaption}
            </p>
          </div>
          <div className="stack">
            <ResourceTypeSummary summary={resourceSummary} />
            <p style={{ margin: 0, fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {fill(t.runDetail.resources.tailCaption, {
                count: run.remainder.requests,
                kb: run.remainder.transferredKb,
              })}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
