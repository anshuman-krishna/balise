import { formatInt } from '@balise/ui';
import { fill, t } from '../i18n';
import type { ResourceKind, ResourceRow } from '../lib/capture-view';

const BAR_COLOR: Record<ResourceKind, string> = {
  'first-party': 'rgba(90,97,105,.55)',
  regression: 'var(--breach)',
  'third-party': 'var(--caution)',
};

const NAME_COLOR: Record<ResourceKind, string> = {
  'first-party': 'var(--ink)',
  regression: 'var(--breach)',
  'third-party': 'var(--caution)',
};

const GRID = '186px 1fr 58px';

/**
 * the load in time. a bar starts where the request started and is as long as
 * the response took, both from the capture; the weight is the column on the
 * right. the version of this that sized the bar by bytes and positioned it by
 * time was two scales on one mark.
 */
export function Waterfall({
  rows,
  remainder,
}: {
  rows: readonly ResourceRow[];
  remainder: { count: number; transferredBytes: number };
}) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          gap: '0 14px',
          padding: '10px 0 7px',
          borderBottom: '1px solid var(--divider-cell)',
        }}
      >
        <span className="mono" style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)' }}>
          {t.runDetail.resourceHeader}
        </span>
        <span className="mono" style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)' }}>
          {t.runDetail.timeHeader}
        </span>
        <span className="mono" style={{ fontWeight: 500, fontSize: 9, letterSpacing: '.08em', color: 'var(--text-tertiary)', textAlign: 'right' }}>
          {t.runDetail.kbHeader}
        </span>
      </div>
      {rows.map((row) => (
        <div
          key={row.url}
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
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
            {row.startFraction === null || row.durationFraction === null ? null : (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${row.startFraction * 100}%`,
                  width: `${Math.max(row.durationFraction * 100, 1.5)}%`,
                  background: BAR_COLOR[row.kind],
                }}
              />
            )}
          </span>
          <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: row.kind === 'regression' ? 'var(--breach)' : 'var(--ink)' }}>
            {formatInt(row.transferredBytes / 1000)}
          </span>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '0 14px', padding: '8px 0 0' }}>
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
          {fill(t.runDetail.moreRows, { count: remainder.count })}
        </span>
        <span />
        <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--text-tertiary)' }}>
          {formatInt(remainder.transferredBytes / 1000)}
        </span>
      </div>
    </div>
  );
}
