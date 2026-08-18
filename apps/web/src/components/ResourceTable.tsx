import { formatInt } from '@balise/ui';
import { fill, t } from '../i18n';
import type { ResourceRecord } from '../fixtures/canon';
import type { ResourceRemainder } from '../lib/resources';

// the origin floor fits the longest third-party host without clipping
const GRID = 'minmax(170px,1.5fr) 96px 88px 88px 76px minmax(168px,1fr)';

// the per-resource records behind the waterfall, with what the waterfall
// has no room for: type, decoded size, coverage and origin.
export function ResourceTable({
  records,
  remainder,
  totalRequests,
}: {
  records: readonly ResourceRecord[];
  remainder: ResourceRemainder;
  totalRequests: number;
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
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <div style={{ padding: '15px 17px 0' }}>
        <span className="eyebrow">
          {fill(t.runDetail.resources.recordsTitle, { count: records.length, requests: totalRequests })}
        </span>
      </div>
      <div
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
      {records.map((record) => (
        <div
          key={record.name}
          className="row-hover"
          style={{
            display: 'grid',
            gridTemplateColumns: GRID,
            gap: '0 12px',
            alignItems: 'center',
            padding: '9px 17px',
            borderBottom: '1px solid var(--divider-row)',
            background: record.regression === true ? 'var(--tint-breach)' : undefined,
          }}
        >
          <span
            className="mono"
            style={{ fontSize: 10.5, color: record.regression === true ? 'var(--breach)' : undefined }}
          >
            {record.name}
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
            {t.runDetail.resources.types[record.type]}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              textAlign: 'right',
              color: record.regression === true ? 'var(--breach)' : undefined,
            }}
          >
            {formatInt(record.transferredKb)}
          </span>
          <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--text-secondary)' }}>
            {formatInt(record.decodedKb)}
          </span>
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              textAlign: 'right',
              color: record.unusedDecodedKb === undefined ? 'var(--text-tertiary)' : 'var(--caution)',
            }}
          >
            {record.unusedDecodedKb === undefined ? '–' : formatInt(record.unusedDecodedKb)}
          </span>
          <span
            className="mono"
            style={{ fontSize: 10, color: record.origin === undefined ? 'var(--text-tertiary)' : 'var(--caution)' }}
          >
            {record.origin ?? t.runDetail.resources.firstParty}
          </span>
        </div>
      ))}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          gap: '0 12px',
          alignItems: 'center',
          padding: '9px 17px',
        }}
      >
        <span style={{ gridColumn: '1 / 3', fontSize: 10.5, color: 'var(--text-tertiary)' }}>
          {fill(t.runDetail.resources.remainderRow, { count: remainder.requests })}
        </span>
        <span className="mono" style={{ fontSize: 10.5, textAlign: 'right', color: 'var(--text-tertiary)' }}>
          {formatInt(remainder.transferredKb)}
        </span>
      </div>
    </div>
  );
}
