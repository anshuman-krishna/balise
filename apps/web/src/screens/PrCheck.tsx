import { useState } from 'react';
import { formatInt, formatSigned, Tabs, tabPanelAttributes, ToleranceBand } from '@balise/ui';
import { Link } from 'react-router';
import { fill, t } from '../i18n';
import { prCheckFixture as pr } from '../fixtures/canon';
import { referenceModelRef } from '../lib/carbon-view';
import { budgetCanon } from '../fixtures/budget-canon';
import { attributionCoverage, attributionLead } from '../lib/attribution-view';
import {
  checkFailed,
  checkRows,
  checkRunOutput,
  checkStatusText,
  type CheckRow,
  type CheckVerdict,
} from '../lib/budget-view';
import { Wordmark } from '../components/Wordmark';

const GRID = 'minmax(190px,1.5fr) 82px 82px 82px 132px 76px';

const VERDICT_LABEL: Record<CheckVerdict, () => string> = {
  fail: () => t.verdicts.fail,
  warn: () => t.verdicts.warn,
  noSig: () => t.verdicts.noSig,
  pass: () => t.verdicts.pass,
};

const VERDICT_COLOR: Record<CheckVerdict, string> = {
  fail: 'var(--breach)',
  warn: 'var(--caution)',
  noSig: 'var(--text-secondary)',
  pass: 'var(--conforme)',
};

// the budget verdicts, the attribution sentence and the annotation cost are all
// computed: see budget-canon.ts and attribution-canon.ts, both generated.
const rows = checkRows();
const failed = checkFailed();
const statusText = checkStatusText();
const lead = attributionLead();
// the artifact itself, built by @balise/budgets from the same assessments the
// rendered view above is drawn from.
const output = checkRunOutput();
const provenance = budgetCanon.provenance;
// the annotation the check would attach to a source file, as the check built
// it. the diff lines beside it are the customer's own code, which github
// renders and we never produce.
const placed = output.annotations.find((annotation) => annotation.path !== budgetCanon.file) ?? null;

const ANNOTATION_COLOR: Record<string, string> = {
  failure: 'var(--breach)',
  warning: 'var(--caution)',
  notice: 'var(--text-secondary)',
};

function Parts({ parts }: { parts: ReadonlyArray<{ text: string; mono?: boolean; strong?: boolean }> }) {
  return (
    <>
      {parts.map((part, index) =>
        part.mono === true ? (
          <span key={index} className="mono" style={{ fontSize: 10.5 }}>
            {part.text}
          </span>
        ) : part.strong === true ? (
          <strong key={index}>{part.text}</strong>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

function MeasurementRow({ row }: { row: CheckRow }) {
  // the delta band shows the delta against the noise field, centred on zero
  const spread = Math.max(row.deltaKb + row.madKb, row.floorKb * 2);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: GRID,
        gap: '0 12px',
        alignItems: 'center',
        padding: '8px 14px',
        borderBottom: '1px solid var(--divider-row)',
        background: row.verdict === 'fail' ? 'var(--tint-breach)' : undefined,
      }}
    >
      <span className="mono" style={{ fontSize: 10.5, color: row.verdict === 'fail' ? 'var(--breach)' : 'var(--ink)' }}>
        {row.label}
      </span>
      <span className="mono" style={{ fontSize: 10.5, textAlign: 'right' }}>{formatInt(row.baseKb)}</span>
      <span
        className="mono"
        style={{ fontSize: 10.5, textAlign: 'right', color: row.verdict === 'noSig' ? 'var(--ink)' : VERDICT_COLOR[row.verdict] }}
      >
        {formatInt(row.headKb)}
      </span>
      <span
        className="mono"
        style={{ fontSize: 10.5, textAlign: 'right', color: row.verdict === 'noSig' ? 'var(--ink)' : VERDICT_COLOR[row.verdict] }}
      >
        {formatSigned(row.deltaKb)}
      </span>
      <ToleranceBand
        size="compact"
        width={132}
        scaleMin={-spread * 0.35}
        scaleMax={spread * 1.15}
        median={row.deltaKb}
        bandLow={row.deltaKb - row.madKb}
        bandHigh={row.deltaKb + row.madKb}
        noiseLow={-row.floorKb}
        noiseHigh={row.floorKb}
        referenceModel={referenceModelRef()}
        confidence="high"
        state={row.verdict === 'fail' ? 'breach' : row.verdict === 'warn' ? 'caution' : 'normal'}
        deltaClassification={row.classification}
        unitLabel={t.prCheck.headers.delta}
      />
      <span
        className="mono"
        style={{ fontWeight: 500, fontSize: 9.5, letterSpacing: '.05em', textAlign: 'right', color: VERDICT_COLOR[row.verdict] }}
      >
        {VERDICT_LABEL[row.verdict]()}
      </span>
    </div>
  );
}

/** the merge block, shown only when the check actually concluded failure. */
function BlockedBanner() {
  return (
    <div className="gh-banner">
      <span
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'var(--breach)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 700,
          flex: 'none',
          marginTop: 1,
        }}
      >
        !
      </span>
      <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--breach)' }}>{t.prCheck.blockedTitle}</strong>
        <br />
        <span style={{ color: 'var(--text-secondary)' }}>
          {t.prCheck.blockedBody1} <span className="mono" style={{ fontSize: 10 }}>{pr.requiredCheck}</span>{' '}
          {t.prCheck.blockedBody2} <span className="mono" style={{ fontSize: 10 }}>{pr.into}</span>.
        </span>
      </span>
    </div>
  );
}

/** what the check actually posts, verbatim: the api payload, not a mock of it. */
function Artifact() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <span className="eyebrow">{pr.budgetCheck}</span>
        <div className="mono" style={{ marginTop: 8, fontSize: 10.5 }}>
          conclusion:{' '}
          <span style={{ color: checkFailed() ? 'var(--breach)' : 'var(--conforme)' }}>{output.conclusion}</span>
        </div>
        <div className="mono" style={{ marginTop: 3, fontSize: 10.5 }}>title: {output.title}</div>
        <p style={{ margin: '10px 0 0', fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '64ch' }}>
          {t.prCheck.artifactNote}
        </p>
      </div>

      {/* wrapped rather than scrolled: the sentence about the noise floor is
          the point of the comment and must not run off the edge. */}
      <div className="code-block" style={{ whiteSpace: 'pre-wrap' }}>
        {output.summary}
      </div>
      <div className="code-block" style={{ whiteSpace: 'pre-wrap' }}>
        {output.text}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          className="mono"
          style={{
            padding: '10px 16px',
            fontWeight: 500,
            fontSize: 9.5,
            letterSpacing: '.08em',
            color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--divider-cell)',
          }}
        >
          annotations · {output.annotations.length}
        </div>
        {output.annotations.map((annotation) => (
          <div
            key={`${annotation.path}-${annotation.level}-${annotation.startLine}-${annotation.title}`}
            style={{ padding: '9px 16px', borderBottom: '1px solid var(--divider-row)' }}
          >
            <span
              className="mono"
              style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: '.05em', color: ANNOTATION_COLOR[annotation.level] }}
            >
              {annotation.level}
            </span>{' '}
            <span className="mono" style={{ fontSize: 10 }}>
              {annotation.path}:{annotation.startLine}
              {annotation.endLine === annotation.startLine ? '' : `-${annotation.endLine}`}
            </span>
            <div style={{ marginTop: 3, fontSize: 11, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {annotation.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** the same check as github renders it, which is where a developer meets it. */
function Rendered() {
  return (
    <>
      <div className="gh-card">
        <div style={{ padding: '14px 16px 12px' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {pr.title} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{pr.number}</span>
          </div>
          <div style={{ marginTop: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
            <span className="mono" style={{ fontSize: 10 }}>{pr.author}</span> {t.prCheck.merge1} {pr.commits}{' '}
            {t.prCheck.merge2} <span className="mono" style={{ fontSize: 10 }}>{pr.into}</span> {t.prCheck.merge3}{' '}
            <span className="mono" style={{ fontSize: 10 }}>{pr.from}</span>
          </div>
        </div>

        {failed ? <BlockedBanner /> : null}

        <div>
          {[{ name: pr.budgetCheck, state: failed ? 'fail' : 'pass', text: statusText }, ...pr.statuses].map((status) => (
            <div
              key={status.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                borderTop: '1px solid var(--divider-row)',
              }}
            >
              <span className="gh-dot" style={{ background: status.state === 'fail' ? 'var(--breach)' : 'var(--conforme)' }} />
              <span style={{ fontSize: 11.5, fontWeight: 600 }}>{status.name}</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>· {status.text}</span>
              <a href="#details" style={{ marginLeft: 'auto', fontSize: 11 }}>
                {t.prCheck.details}
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="gh-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            background: 'var(--paper)',
            borderBottom: '1px solid var(--divider-cell)',
          }}
        >
          <Wordmark size={14} onDark={false} />
          <span style={{ fontSize: 11.5, fontWeight: 600 }}>balise</span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {t.prCheck.commented} {fill(t.appBar.minutesAgo, { minutes: pr.commentedMinutesAgo })}
          </span>
        </div>

        <div style={{ padding: '12px 0 0' }}>
          <div style={{ padding: '0 14px', fontSize: 11.5 }}>
            <strong>{fill(t.prCheck.measurementLine, { runs: pr.runsPerScenario }).split(' · ')[0]}</strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              {' · '}
              {fill(t.prCheck.measurementLine, { runs: pr.runsPerScenario }).split(' · ').slice(1).join(' · ')}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 12px',
              padding: '10px 14px 7px',
              borderBottom: '1px solid rgba(21,24,27,.14)',
            }}
          >
            {[
              t.prCheck.headers.route,
              t.prCheck.headers.base,
              t.prCheck.headers.head,
              t.prCheck.headers.delta,
              t.prCheck.headers.vsNoise,
              t.prCheck.headers.verdict,
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
            <MeasurementRow key={row.scenarioId} row={row} />
          ))}

          <div style={{ padding: '12px 14px 0' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600 }}>{t.prCheck.attributionHeading}</div>
            <p style={{ margin: '6px 0 0', fontSize: 11.5, lineHeight: 1.6, maxWidth: '72ch' }}>
              <Parts
                parts={lead.map((part) => ({ text: part.text, mono: part.token, strong: part.measure }))}
              />
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.6, maxWidth: '72ch', color: 'var(--text-secondary)' }}>
              {attributionCoverage()}
            </p>
          </div>

          <div
            style={{
              margin: '12px 14px 0',
              padding: '10px 0 12px',
              borderTop: '1px solid var(--divider-cell)',
              fontSize: 10,
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
            }}
          >
            {/* the same provenance the posted comment carries, from one place. */}
            {t.prCheck.provenanceMethodology} {provenance.methodologyVersion} · {t.prCheck.provenanceModels}{' '}
            <span className="mono" style={{ fontSize: 9.5 }}>{provenance.models.join(' ')}</span> ·{' '}
            {t.prCheck.provenanceRun}{' '}
            <span className="mono" style={{ fontSize: 9.5 }}>{provenance.runId}</span> · {t.prCheck.provenanceLedger}{' '}
            <Link to={`/v/${provenance.ledgerRef}`} className="mono" style={{ fontSize: 9.5 }}>
              {provenance.ledgerRef}
            </Link>{' '}
            ·{' '}
            <a href="#override">{t.prCheck.overrideLink}</a> {t.prCheck.overrideNote}
          </div>
        </div>
      </div>

      <div className="gh-card">
        <div
          className="mono"
          style={{
            padding: '10px 14px',
            fontWeight: 500,
            fontSize: 9.5,
            letterSpacing: '.08em',
            color: 'var(--text-secondary)',
            borderBottom: '1px solid var(--divider-cell)',
          }}
        >
          {placed === null
            ? fill(t.prCheck.annotationTitle, { file: pr.annotation.file })
            : fill(t.prCheck.annotationTitle, {
                file: `${placed.path}:${placed.startLine}-${placed.endLine}`,
              })}
        </div>
        <div style={{ padding: '10px 14px 0' }}>
          {pr.annotation.lines.map((line) => (
            <div key={line.no} className={line.added ? 'diff-line added' : 'diff-line'}>
              <span className="no">{line.no}</span>
              <span className="code">{line.text}</span>
            </div>
          ))}
        </div>
        {placed === null ? null : (
          <div
            style={{
              margin: '10px 14px 12px',
              padding: '9px 12px',
              borderLeft: `2px solid ${ANNOTATION_COLOR[placed.level]}`,
              background: 'var(--inset-panel)',
            }}
          >
            <span
              className="mono"
              style={{ fontWeight: 500, fontSize: 10.5, color: ANNOTATION_COLOR[placed.level] }}
            >
              {placed.title}
            </span>
            <div style={{ marginTop: 3, fontSize: 11, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {placed.message}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function PrCheck() {
  const [mode, setMode] = useState<'rendered' | 'markdown'>('rendered');

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div>
          <h1 className="screen-title">{t.prCheck.title}</h1>
          <div className="screen-subtitle">{t.prCheck.subtitle}</div>
        </div>
        <Tabs
          label={t.prCheck.toggleLabel}
          name="check"
          variant="segmented"
          style={{ marginLeft: 'auto' }}
          tabs={[
            { key: 'rendered', label: t.prCheck.toggleRendered },
            { key: 'markdown', label: t.prCheck.toggleMarkdown },
          ]}
          selected={mode}
          onSelect={setMode}
        />
      </div>

      <div
        {...tabPanelAttributes('check', mode)}
        style={{ maxWidth: 1020, marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {mode === 'markdown' ? <Artifact /> : <Rendered />}
      </div>
    </>
  );
}
