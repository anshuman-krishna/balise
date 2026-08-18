import { formatInt } from '@balise/ui';
import { fill, t } from '../i18n';
import type { ResourceSummary } from '../lib/resources';

const GRID = 'minmax(84px,1fr) 40px 74px 56px';

// the run's bytes by resource type. the totals are derived from the same
// records the waterfall draws, so the two panels cannot disagree.
export function ResourceTypeSummary({ summary }: { summary: ResourceSummary }) {
  const headers = t.runDetail.resources.headers;
  return (
    <div className="card">
      <span className="eyebrow">
        {fill(t.runDetail.resources.byTypeTitle, {
          requests: summary.totalRequests,
          kb: formatInt(summary.totalTransferredKb),
        })}
      </span>
      <div
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
          key={group.type}
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: '0 12px',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--divider-row)',
          }}
        >
          <span style={{ fontSize: 11 }}>{t.runDetail.resources.types[group.type]}</span>
          <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--text-secondary)' }}>
            {group.requests}
          </span>
          <span className="mono" style={{ fontSize: 10.5, textAlign: 'right' }}>
            {formatInt(group.transferredKb)}
          </span>
          <span className="mono" style={{ fontSize: 10, textAlign: 'right', color: 'var(--text-secondary)' }}>
            {(group.share * 100).toFixed(1)}%
          </span>
          <span style={{ gridColumn: '1 / -1', marginTop: 6 }}>
            <span className="progress-track" style={{ display: 'block' }}>
              <span
                className="progress-fill"
                style={{ display: 'block', width: `${group.share * 100}%`, background: 'var(--measured)' }}
              />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
