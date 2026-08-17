import { useState } from 'react';
import { fill, t } from '../i18n';
import { budgetsFixture as budgets, type BudgetRow, type BudgetTone } from '../fixtures/canon';

const GRID = 'minmax(210px,1.5fr) 96px 96px minmax(130px,1fr) 92px';

const TONE_COLOR: Record<BudgetTone, string> = {
  ok: 'var(--conforme)',
  warn: 'var(--caution)',
  breach: 'var(--breach)',
};

function HeadroomCell({ row }: { row: BudgetRow }) {
  if (row.note === true) {
    return (
      <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>
        {t.budgets.relativeNote}
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="progress-track" style={{ flex: 1 }}>
        <span
          className="progress-fill"
          style={{
            display: 'block',
            width: `${row.barPct ?? 0}%`,
            background: TONE_COLOR[row.barTone ?? 'ok'],
          }}
        />
      </span>
      <span className="mono" style={{ fontSize: 10, minWidth: 34, textAlign: 'right' }}>
        {row.headroom}
      </span>
    </span>
  );
}

export function Budgets() {
  const [mode, setMode] = useState<'visual' | 'yaml'>('visual');

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.budgets}</h1>
          <div className="screen-subtitle">
            {fill(t.budgets.subtitle, { file: budgets.file, branch: budgets.branch })}
          </div>
        </div>
        <div className="segmented" style={{ marginLeft: 'auto' }} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'visual'}
            className={mode === 'visual' ? 'active' : undefined}
            onClick={() => setMode('visual')}
          >
            {t.budgets.toggleVisual}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'yaml'}
            className={mode === 'yaml' ? 'active' : undefined}
            onClick={() => setMode('yaml')}
          >
            {t.budgets.toggleYaml}
          </button>
        </div>
      </div>

      {mode === 'visual' ? (
        <div className="card" style={{ marginTop: 16, padding: 0, overflowX: 'auto' }}>
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
              t.budgets.headers.scopeMetric,
              t.budgets.headers.current,
              t.budgets.headers.threshold,
              t.budgets.headers.headroom,
              t.budgets.headers.onBreach,
            ].map((header, index) => (
              <span
                key={header}
                className="mono"
                style={{
                  fontWeight: 500,
                  fontSize: 9,
                  letterSpacing: '.08em',
                  color: 'var(--text-tertiary)',
                  textAlign: index === 1 || index === 2 || index === 4 ? 'right' : 'left',
                }}
              >
                {header}
              </span>
            ))}
          </div>
          {budgets.rows.map((row) => (
            <div
              key={row.scope}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: '0 14px',
                alignItems: 'center',
                padding: '10px 17px',
                borderBottom: '1px solid var(--divider-row)',
                background: row.rowTone === 'breach' ? 'var(--tint-breach)' : undefined,
              }}
            >
              <span className="mono" style={{ fontSize: 10.5, color: row.rowTone === 'breach' ? 'var(--breach)' : 'var(--ink)' }}>
                {row.scope} <span style={{ color: 'var(--text-secondary)' }}>· {row.metric}</span>
              </span>
              <span
                className="mono"
                style={{ fontSize: 10.5, textAlign: 'right', color: row.currentTone === 'breach' ? 'var(--breach)' : 'var(--ink)' }}
              >
                {row.current}
              </span>
              <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--measured)' }}>
                {row.threshold}
              </span>
              <HeadroomCell row={row} />
              <span
                className="mono"
                style={{
                  fontWeight: 500,
                  fontSize: 9.5,
                  letterSpacing: '.05em',
                  textAlign: 'right',
                  color: row.action === 'fail' ? 'var(--breach)' : 'var(--caution)',
                }}
              >
                {row.action === 'fail' ? t.verdicts.fail : t.verdicts.warn}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="code-block" style={{ marginTop: 16 }}>
          {budgets.yaml.map((line, index) => (
            <div key={index}>
              {line.map((seg, segIndex) =>
                seg.k !== undefined ? (
                  <span key={segIndex} className={seg.k}>
                    {seg.text}
                  </span>
                ) : (
                  <span key={segIndex}>{seg.text}</span>
                ),
              )}
              {line.length === 1 && line[0]?.text === '' ? ' ' : null}
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-cols" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <span className="eyebrow">{t.budgets.rebaselineTitle}</span>
          <div style={{ marginTop: 10 }}>
            {budgets.rebaselines.map((entry) => (
              <div
                key={entry.date}
                style={{ display: 'flex', gap: 12, alignItems: 'baseline', padding: '8px 0', borderBottom: '1px solid var(--divider-row)' }}
              >
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{entry.date}</span>
                <span className="mono" style={{ fontSize: 10.5 }}>{entry.move}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{entry.author}</span>
                <span className="mono" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-secondary)' }}>{entry.reason}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '56ch' }}>
            {t.budgets.rebaselineNote}
          </p>
        </div>

        <div className="card">
          <span className="eyebrow">{fill(t.budgets.overridesTitle, { count: 1 })}</span>
          <div className="left-rule caution" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11.5 }}>
              <span className="mono" style={{ fontSize: 10.5, fontWeight: 500 }}>{budgets.override.pr}</span>
              {' · '}
              {budgets.override.summary}{' '}
              <span className="mono" style={{ fontSize: 10.5 }}>{budgets.override.route}</span>
            </div>
            <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {budgets.override.quote} <span className="mono" style={{ fontSize: 9.5 }}>· {budgets.override.by}</span>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '56ch' }}>
            {t.budgets.overridesNotePrefix} <em>{t.budgets.rapportName}</em>
            {t.budgets.overridesNoteSuffix}
          </p>
        </div>
      </div>
    </>
  );
}
