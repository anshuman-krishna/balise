import { useState } from 'react';
import type { CriterionTier } from '@balise/schemas';
import { fill, t } from '../i18n';
import { criteriaCanon as crit } from '../fixtures/criteria-canon';
import {
  attestedText,
  conformityPct,
  evidenceText,
  rowsForTier,
  signOffNotice,
  sourceLine,
  statusLabel,
  STATUS_COLOR,
  TIER_COLOR,
  tierCards,
  tierShort,
} from '../lib/criteria-view';

const GRID = '46px minmax(240px,1.9fr) 118px 66px 104px minmax(180px,1.35fr) 108px';

type TierFilter = 'all' | CriterionTier;

const signOff = signOffNotice();

function SummaryStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, color }}>{value}</div>
    </div>
  );
}

export function Criteria() {
  const [tier, setTier] = useState<TierFilter>('all');
  const rows = rowsForTier(tier);
  const cards = tierCards();

  const chips: ReadonlyArray<{ key: TierFilter; label: string }> = [
    { key: 'all', label: fill(t.criteria.filter.all, { count: crit.pack.criteriaCount }) },
    { key: 'automated', label: fill(t.criteria.filter.automated, { count: crit.byTier.automated }) },
    { key: 'assisted', label: fill(t.criteria.filter.assisted, { count: crit.byTier.assisted }) },
    { key: 'declarative', label: fill(t.criteria.filter.declarative, { count: crit.byTier.declarative }) },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.criteria}</h1>
          <div className="screen-subtitle">
            {fill(t.criteria.subtitle, {
              pack: crit.pack.label,
              criteria: crit.pack.criteriaCount,
              families: crit.pack.familiesCount,
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
          <SummaryStat label={t.criteria.summary.conforme} value={String(crit.byStatus.conforme)} color="var(--conforme)" />
          <SummaryStat
            label={t.criteria.summary.partiel}
            value={String(crit.byStatus.partiellement_conforme)}
            color="var(--caution)"
          />
          <SummaryStat label={t.criteria.summary.nonConf} value={String(crit.byStatus.non_conforme)} color="var(--breach)" />
          <SummaryStat label={t.criteria.summary.na} value={String(crit.byStatus.non_applicable)} color="var(--text-tertiary)" />
          <div style={{ paddingLeft: 22, borderLeft: '1px solid var(--border-card)' }}>
            <SummaryStat
              label={fill(t.criteria.summary.taux, {
                done: crit.completion.conforme,
                total: crit.completion.applicable,
              })}
              value={`${conformityPct()}%`}
            />
          </div>
        </div>
      </div>

      {signOff === null ? null : (
        <div
          className="card"
          style={{ marginTop: 16, padding: '12px 16px 13px', borderLeft: '2px solid var(--caution)' }}
        >
          <div className="mono" style={{ fontWeight: 500, fontSize: 10, color: 'var(--caution)' }}>{signOff.title}</div>
          <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            {signOff.body}
          </div>
          <div className="mono" style={{ marginTop: 7, fontSize: 10, color: 'var(--text-tertiary)' }}>{sourceLine()}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 14 }}>
        {cards.map((card) => (
          <div key={card.tier} className="card" style={{ padding: '13px 16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span className="mono" style={{ fontWeight: 500, fontSize: 10, color: card.color }}>
                {card.label}
                {signOff === null ? null : (
                  <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 8.5, color: 'var(--text-tertiary)' }}>
                    {t.criteria.tiers.proposed}
                  </span>
                )}
              </span>
              <span className="mono" style={{ fontSize: 11 }}>
                {card.answered}/{card.total}
              </span>
            </div>
            <div className="progress-track" style={{ marginTop: 9 }}>
              <span
                className="progress-fill"
                style={{
                  display: 'block',
                  width: `${card.total === 0 ? 0 : (card.answered / card.total) * 100}%`,
                  background: card.color,
                }}
              />
            </div>
            <div style={{ marginTop: 9, fontSize: 10.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{card.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
        <span
          className="mono"
          style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)', marginRight: 4 }}
        >
          {t.criteria.filter.tier}
        </span>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={tier === chip.key ? 'chip active' : 'chip'}
            aria-pressed={tier === chip.key}
            onClick={() => setTier(chip.key)}
          >
            {chip.label}
          </button>
        ))}
        <span className="mono" style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--text-secondary)' }}>
          {fill(t.criteria.filter.shown, { count: rows.length })}
        </span>
      </div>

      <div className="card" style={{ marginTop: 10, padding: 0, overflowX: 'auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: '0 12px',
            alignItems: 'center',
            padding: '11px 17px 9px',
            borderBottom: '1px solid rgba(21,24,27,.14)',
          }}
        >
          {[
            t.criteria.headers.id,
            t.criteria.headers.criterion,
            t.criteria.headers.family,
            t.criteria.headers.tier,
            t.criteria.headers.status,
            t.criteria.headers.evidence,
            t.criteria.headers.verified,
          ].map((header, index) => (
            <span
              key={header}
              className="mono"
              style={{
                fontWeight: 500,
                fontSize: 9,
                letterSpacing: '.08em',
                color: 'var(--text-tertiary)',
                textAlign: index === 6 ? 'right' : 'left',
              }}
            >
              {header}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div
            key={row.id}
            className="row-hover"
            style={{
              display: 'grid',
              gridTemplateColumns: GRID,
              gap: '0 12px',
              alignItems: 'center',
              padding: '9px 17px',
              borderBottom: '1px solid var(--divider-row)',
            }}
          >
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>{row.id}</span>
            <span style={{ fontSize: 11.5, lineHeight: 1.4 }}>{row.statementFr}</span>
            <span className="mono" style={{ fontSize: 10, lineHeight: 1.35, color: 'var(--text-secondary)' }}>{row.family}</span>
            <span className="mono" style={{ fontWeight: 500, fontSize: 9, color: TIER_COLOR[row.tier] }}>
              {tierShort(row.tier)}
            </span>
            <span className="mono" style={{ fontWeight: 500, fontSize: 10, color: STATUS_COLOR[row.status] }}>
              {statusLabel(row.status)}
            </span>
            <span style={{ fontSize: 10.5, lineHeight: 1.45, color: 'var(--text-secondary)' }}>{evidenceText(row)}</span>
            <span className="mono" style={{ fontSize: 10, lineHeight: 1.35, color: 'var(--text-tertiary)', textAlign: 'right' }}>
              {attestedText(row)}
            </span>
          </div>
        ))}
        <div style={{ padding: '11px 17px', fontSize: 10.5, color: 'var(--text-secondary)' }}>{t.criteria.footnote}</div>
      </div>
    </>
  );
}
