import { useState } from 'react';
import { Link } from 'react-router';
import type { BudgetStatus } from '@balise/schemas';
import { Tabs, tabPanelAttributes } from '@balise/ui';
import { fill, t } from '../i18n';
import { budgetsFixture as budgets } from '../fixtures/canon';
import { budgetCanon } from '../fixtures/budget-canon';
import { budgetRows, overrideCard, type BudgetRow } from '../lib/budget-view';
import { highlightYaml } from '../lib/yaml-highlight';

const GRID = 'minmax(210px,1.5fr) 96px 96px minmax(130px,1fr) 92px';

const STATUS_COLOR: Record<BudgetStatus, string> = {
  conforme: 'var(--conforme)',
  warn: 'var(--caution)',
  breach: 'var(--breach)',
  non_evalue: 'var(--text-tertiary)',
};

const rows = budgetRows();
const yamlLines = highlightYaml(budgetCanon.source);
const override = overrideCard();

function HeadroomCell({ row }: { row: BudgetRow }) {
  if (row.barPct === null || row.headroom === null) {
    return (
      <span className="mono" style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>
        {row.reasonNote ?? t.budgets.relativeNote}
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="progress-track" style={{ flex: 1 }}>
        <span
          className="progress-fill"
          style={{ display: 'block', width: `${row.barPct}%`, background: STATUS_COLOR[row.status] }}
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
            {fill(t.budgets.subtitle, { file: budgetCanon.file, branch: budgetCanon.branchName })}
          </div>
        </div>
        <Tabs
          label={t.budgets.toggleLabel}
          name="budgets"
          variant="segmented"
          style={{ marginLeft: 'auto' }}
          tabs={[
            { key: 'visual', label: t.budgets.toggleVisual },
            { key: 'yaml', label: t.budgets.toggleYaml },
          ]}
          selected={mode}
          onSelect={setMode}
        />
      </div>

      <div {...tabPanelAttributes('budgets', mode)}>
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
          {rows.map((row) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: '0 14px',
                alignItems: 'center',
                padding: '10px 17px',
                borderBottom: '1px solid var(--divider-row)',
                background: row.status === 'breach' ? 'var(--tint-breach)' : undefined,
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 10.5, color: row.status === 'breach' ? 'var(--breach)' : 'var(--ink)' }}
              >
                {row.scope} <span style={{ color: 'var(--text-secondary)' }}>· {row.metric}</span>
                {row.scenario !== null ? (
                  <span style={{ color: 'var(--text-tertiary)' }}>
                    {' '}
                    · {fill(t.budgets.worstOn, { scenario: row.scenario })}
                  </span>
                ) : null}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  textAlign: 'right',
                  color: row.status === 'breach' ? 'var(--breach)' : 'var(--ink)',
                }}
              >
                {row.current ?? '–'}
              </span>
              <span
                className="mono"
                style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--measured)' }}
                title={row.thresholdSource ?? undefined}
              >
                {row.threshold ?? '–'}
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
              {row.withinNoise || row.overridden ? (
                <span
                  className="mono"
                  style={{ gridColumn: '1 / -1', fontSize: 9.5, color: 'var(--text-tertiary)', paddingTop: 3 }}
                >
                  {[row.withinNoise ? t.budgets.withinNoiseNote : null, row.overridden ? t.budgets.overriddenNote : null]
                    .filter((note) => note !== null)
                    .join(' · ')}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="code-block" style={{ marginTop: 16 }}>
          {yamlLines.map((line, index) => (
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
              {line.length === 0 ? ' ' : null}
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
          <span className="eyebrow">
            {fill(t.budgets.overridesTitle, { count: budgetCanon.main.summary.overridden.length })}
          </span>
          <div className="left-rule caution" style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11.5 }}>
              {override.requestedIn !== null ? (
                <>
                  <span className="mono" style={{ fontSize: 10.5, fontWeight: 500 }}>{override.requestedIn}</span>
                  {' · '}
                </>
              ) : null}
              <span className="mono" style={{ fontSize: 10.5 }}>{override.past}</span> {t.budgets.overPast}{' '}
              <span className="mono" style={{ fontSize: 10.5 }}>{override.scope}</span>
            </div>
            <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
              {override.reason}{' '}
              <span className="mono" style={{ fontSize: 9.5 }}>· {override.by}</span>
              {override.ledgerRef !== null ? (
                <>
                  {' · '}
                  <Link to={`/v/${override.ledgerRef}`} className="mono" style={{ fontSize: 9.5 }}>
                    {override.ledgerRef}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 10.5, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '56ch' }}>
            {t.budgets.overridesNotePrefix} <em>{t.budgets.rapportName}</em>
            {t.budgets.overridesNoteSuffix}
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
