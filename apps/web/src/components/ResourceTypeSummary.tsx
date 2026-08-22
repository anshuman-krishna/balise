import type { ResourceSummary } from '@balise/measure-core';
import { formatInt } from '@balise/ui';
import { fill, t } from '../i18n';

const GRID = 'minmax(84px,1fr) 40px 74px 56px';

// the run's bytes by resource type, reduced from the same capture the
// waterfall draws, so the two panels cannot disagree.
export function ResourceTypeSummary({ summary }: { summary: ResourceSummary }) {
  const headers = t.runDetail.resources.headers;
  return (
    <div className="card">
      <span className="eyebrow">
        {fill(t.runDetail.resources.byTypeTitle, {
          requests: summary.resourceCount,
          kb: formatInt(summary.totalTransferredBytes / 1000),
        })}
      </span>
      <div role="table" aria-label={t.a11y.tables.resourcesByType}>
      <div
        role="row"
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          gap: '0 12px',
          padding: '12px 0 7px',
          borderBottom: '1px solid var(--divider-cell)',
        }}
      >
        {[headers.type, headers.requests, headers.transferred, headers.share].map((header, index) => (
          <span
            key={header}
            role="columnheader"
            className="mono"
            style={{
              fontWeight: 500,
              fontSize: 9,
              letterSpacing: '.08em',
              color: 'var(--text-tertiary)',
              textAlign: index === 0 ? 'left' : 'right',
            }}
          >
            {header}
          </span>
        ))}
      </div>
      {summary.groups.map((group) => (
        <div
          key={group.resourceType}
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: '0 12px',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--divider-row)',
          }}
        >
          <span role="cell" style={{ fontSize: 11 }}>{t.runDetail.resources.types[group.resourceType]}</span>
          <span role="cell" className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--text-secondary)' }}>
            {group.requestCount}
          </span>
          <span role="cell" className="mono" style={{ fontSize: 10.5, textAlign: 'right' }}>
            {formatInt(group.transferredBytes / 1000)}
          </span>
          <span role="cell" className="mono" style={{ fontSize: 10, textAlign: 'right', color: 'var(--text-secondary)' }}>
            {(group.transferredShare * 100).toFixed(1)}%
          </span>
          {/* the bar draws the share printed beside it. nothing new is in it,
              so it is not a cell and not read twice. */}
          <span aria-hidden="true" style={{ gridColumn: '1 / -1', marginTop: 6 }}>
            <span className="progress-track" style={{ display: 'block' }}>
              <span
                className="progress-fill"
                style={{ display: 'block', width: `${group.transferredShare * 100}%`, background: 'var(--measured)' }}
              />
            </span>
          </span>
        </div>
      ))}
      </div>
    </div>
  );
}
