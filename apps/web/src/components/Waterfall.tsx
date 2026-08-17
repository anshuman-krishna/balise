import { fill, t } from '../i18n';
import type { WaterfallKind } from '../fixtures/canon';

export interface WaterfallRow {
  name: string;
  kb: number;
  start: number;
  kind: WaterfallKind;
}

const BAR_COLOR: Record<WaterfallKind, string> = {
  'first-party': 'rgba(90,97,105,.55)',
  app: 'var(--measured)',
  regression: 'var(--breach)',
  'third-party': 'var(--caution)',
};

const NAME_COLOR: Record<WaterfallKind, string> = {
  'first-party': 'var(--ink)',
  app: 'var(--ink)',
  regression: 'var(--breach)',
  'third-party': 'var(--caution)',
};

// Resource list with proportional bars positioned by start time. Bars share
// one scale: width is bytes relative to the largest resource, offset is the
// start fraction of the scenario duration.
export function Waterfall({ rows, moreCount, moreKb }: { rows: readonly WaterfallRow[]; moreCount: number; moreKb: number }) {
  const maxKb = Math.max(...rows.map((row) => row.kb));
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '186px 1fr 58px',
          gap: '0 14px',
          padding: '10px 0 7px',
          borderBottom: '1px solid var(--divider-cell)',
        }}
      >
        <span className="mono" style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)' }}>
          {t.runDetail.resourceHeader}
        </span>
        <span />
        <span className="mono" style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)', textAlign: 'right' }}>
          {t.runDetail.kbHeader}
        </span>
      </div>
      {rows.map((row) => (
        <div
          key={row.name}
          style={{
            display: 'grid',
            gridTemplateColumns: '186px 1fr 58px',
            gap: '0 14px',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--divider-row)',
            background: row.kind === 'regression' ? 'var(--tint-breach)' : undefined,
          }}
        >
          <span className="mono" style={{ fontSize: 10.5, color: NAME_COLOR[row.kind], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.name}
            {row.kind === 'third-party' ? (
              <span style={{ color: 'var(--caution)' }}> {t.runDetail.thirdPartyTag}</span>
            ) : null}
          </span>
          <span style={{ position: 'relative', height: 7, background: 'var(--track)' }}>
            <span
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${row.start * 100}%`,
                width: `${Math.max((row.kb / maxKb) * 55, 1.5)}%`,
                background: BAR_COLOR[row.kind],
              }}
            />
          </span>
          <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: row.kind === 'regression' ? 'var(--breach)' : 'var(--ink)' }}>
            {row.kb}
          </span>
        </div>
      ))}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '186px 1fr 58px',
          gap: '0 14px',
          padding: '8px 0 0',
        }}
      >
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
          {fill(t.runDetail.moreRows, { count: moreCount })}
        </span>
        <span />
        <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--text-tertiary)' }}>
          {moreKb}
        </span>
      </div>
    </div>
  );
}
