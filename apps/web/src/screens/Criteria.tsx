import { useState } from 'react';
import { fill, t } from '../i18n';
import { canon, criteriaFixture as crit, type CriterionStatus, type CriterionTier } from '../fixtures/canon';

const GRID = '46px minmax(240px,1.9fr) 88px 66px 104px minmax(160px,1.25fr) 92px';

const TIER_COLOR: Record<CriterionTier, string> = {
  AUTO: 'var(--measured)',
  ASSIST: 'var(--text-secondary)',
  DECL: 'var(--caution)',
};

const STATUS_COLOR: Record<CriterionStatus, string> = {
  conforme: 'var(--conforme)',
  partiellement: 'var(--caution)',
  nonConforme: 'var(--breach)',
  nonEvalue: 'var(--text-secondary)',
  nonApplicable: 'var(--text-tertiary)',
};

const STATUS_LABEL: Record<CriterionStatus, () => string> = {
  conforme: () => t.criteria.statuses.conforme,
  partiellement: () => t.criteria.statuses.partiellement,
  nonConforme: () => t.criteria.statuses.nonConforme,
  nonEvalue: () => t.criteria.statuses.nonEvalue,
  nonApplicable: () => t.criteria.statuses.nonApplicable,
};

type TierFilter = 'all' | CriterionTier;

interface TierCard {
  label: string;
  desc: string;
  done: number;
  total: number;
  color: string;
  countColor?: string;
}

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
  const rows = tier === 'all' ? crit.rows : crit.rows.filter((row) => row.tier === tier);

  const tierCards: TierCard[] = [
    {
      label: t.dashboard.completeness.automated,
      desc: t.criteria.tiers.automatedDesc,
      done: canon.completeness.automated.done,
      total: canon.completeness.automated.total,
      color: 'var(--measured)',
    },
    {
      label: t.dashboard.completeness.assisted,
      desc: t.criteria.tiers.assistedDesc,
      done: canon.completeness.assisted.done,
      total: canon.completeness.assisted.total,
      color: 'var(--text-secondary)',
    },
    {
      label: t.dashboard.completeness.declarative,
      desc: t.criteria.tiers.declarativeDesc,
      done: canon.completeness.declarative.done,
      total: canon.completeness.declarative.total,
      color: 'var(--caution)',
      countColor: 'var(--caution)',
    },
  ];

  const chips: ReadonlyArray<{ key: TierFilter; label: string }> = [
    { key: 'all', label: fill(t.criteria.filter.all, { count: crit.tierCounts.all }) },
    { key: 'AUTO', label: fill(t.criteria.filter.automated, { count: crit.tierCounts.automated }) },
    { key: 'ASSIST', label: fill(t.criteria.filter.assisted, { count: crit.tierCounts.assisted }) },
    { key: 'DECL', label: fill(t.criteria.filter.declarative, { count: crit.tierCounts.declarative }) },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <h1 className="screen-title">{t.nav.items.criteria}</h1>
          <div className="screen-subtitle">
            {fill(t.criteria.subtitle, {
              pack: crit.pack,
              criteria: crit.criteriaCount,
              families: crit.familiesCount,
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
          <SummaryStat label={t.criteria.summary.conforme} value={String(crit.summary.conforme)} color="var(--conforme)" />
          <SummaryStat label={t.criteria.summary.partiel} value={String(crit.summary.partiel)} color="var(--caution)" />
          <SummaryStat label={t.criteria.summary.nonConf} value={String(crit.summary.nonConforme)} color="var(--breach)" />
          <SummaryStat label={t.criteria.summary.na} value={String(crit.summary.na)} color="var(--text-tertiary)" />
          <div style={{ paddingLeft: 22, borderLeft: '1px solid var(--border-card)' }}>
            <SummaryStat
              label={fill(t.criteria.summary.taux, { done: crit.summary.tauxDone, total: crit.summary.tauxTotal })}
              value={`${crit.summary.tauxPct}%`}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 16 }}>
        {tierCards.map((card) => (
          <div key={card.label} className="card" style={{ padding: '13px 16px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="mono" style={{ fontWeight: 500, fontSize: 10, color: card.color }}>{card.label}</span>
              <span className="mono" style={{ fontSize: 11, color: card.countColor }}>
                {card.done}/{card.total}
              </span>
            </div>
            <div className="progress-track" style={{ marginTop: 9 }}>
              <span
                className="progress-fill"
                style={{ display: 'block', width: `${(card.done / card.total) * 100}%`, background: card.color }}
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
            <span style={{ fontSize: 11.5, lineHeight: 1.4 }}>{row.title}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{row.family}</span>
            <span className="mono" style={{ fontWeight: 500, fontSize: 9, color: TIER_COLOR[row.tier] }}>{row.tier}</span>
            <span className="mono" style={{ fontWeight: 500, fontSize: 10, color: STATUS_COLOR[row.status] }}>
              {STATUS_LABEL[row.status]()}
            </span>
            <span className="mono" style={{ fontSize: 10, lineHeight: 1.4, color: 'var(--text-secondary)' }}>{row.evidence}</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right' }}>{row.who}</span>
          </div>
        ))}
        <div style={{ padding: '11px 17px', fontSize: 10.5, color: 'var(--text-secondary)' }}>{t.criteria.footnote}</div>
      </div>
    </>
  );
}
