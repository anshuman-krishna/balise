import { formatInt } from '@balise/ui';
import { fill, t } from '../i18n';
import type { ResourceRow } from '../lib/capture-view';

// the origin floor fits the longest third-party host without clipping
const GRID = 'minmax(170px,1.5fr) 96px 88px 88px 76px minmax(168px,1fr)';

function bytes(value: number | null): string {
  return value === null ? '–' : formatInt(value / 1000);
}

/**
 * every resource the capture holds, with what the waterfall has no room for:
 * type, decoded size, coverage and origin. all of them, not a chosen few with
 * the rest summarised as a line: the capture records each one, so the table
 * shows each one.
 */
export function ResourceTable({
  rows,
  requestCount,
}: {
  rows: readonly ResourceRow[];
  requestCount: number;
}) {
  const headers = t.runDetail.resources.headers;
  const columns = [
    headers.resource,
    headers.type,
    headers.transferred,
    headers.decoded,
    headers.unused,
    headers.origin,
  ];

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '15px 17px 0' }}>
        <span className="eyebrow">
          {fill(t.runDetail.resources.recordsTitle, { count: rows.length, requests: requestCount })}
        </span>
      </div>
      {/* the eyebrow above is typed in capitals for the eye. a name is read
          aloud, and some screen readers spell capitals out letter by letter. */}
      <div
        role="table"
        aria-label={fill(t.a11y.tables.resources, { count: rows.length, requests: requestCount })}
        style={{ overflowX: 'auto' }}
      >
        <div
          role="row"
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: '0 12px',
            padding: '12px 17px 8px',
            borderBottom: '1px solid var(--divider-cell)',
          }}
        >
          {columns.map((header, index) => (
            <span
              key={header}
              role="columnheader"
              className="mono"
              style={{
                fontWeight: 500,
                fontSize: 9,
                letterSpacing: '.08em',
                color: 'var(--text-tertiary)',
                textAlign: index >= 2 && index <= 4 ? 'right' : 'left',
              }}
            >
              {header}
            </span>
          ))}
        </div>
        <div role="rowgroup" style={{ maxHeight: 460, overflowY: 'auto' }}>
          {rows.map((row) => (
            <div
              key={row.url}
              role="row"
              className="row-hover"
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: '0 12px',
                alignItems: 'center',
                padding: '9px 17px',
                borderBottom: '1px solid var(--divider-row)',
                background: row.kind === 'regression' ? 'var(--tint-breach)' : undefined,
              }}
            >
              <span role="cell"
                className="mono"
                style={{
                  fontSize: 10.5,
                  color: row.kind === 'regression' ? 'var(--breach)' : undefined,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={row.url}
              >
                {row.name}
              </span>
              <span role="cell" style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                {t.runDetail.resources.types[row.resourceType]}
              </span>
              <span role="cell"
                className="mono"
                style={{
                  fontSize: 10.5,
                  textAlign: 'right',
                  color: row.kind === 'regression' ? 'var(--breach)' : undefined,
                }}
              >
                {bytes(row.transferredBytes)}
              </span>
              <span role="cell" className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--text-secondary)' }}>
                {bytes(row.decodedBytes)}
              </span>
              <span role="cell"
                className="mono"
                style={{
                  fontSize: 10.5,
                  textAlign: 'right',
                  color: row.unusedDecodedBytes === null ? 'var(--text-tertiary)' : 'var(--caution)',
                }}
              >
                {bytes(row.unusedDecodedBytes)}
              </span>
              <span role="cell"
                className="mono"
                style={{ fontSize: 10, color: row.origin === null ? 'var(--text-tertiary)' : 'var(--caution)' }}
              >
                {row.origin ?? t.runDetail.resources.firstParty}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
