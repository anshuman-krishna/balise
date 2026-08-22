import { tFr } from '../i18n';
import type { FindingsView } from '../lib/findings-view';

/**
 * what the capture shows about itself, one measured quantity per line.
 *
 * the mono column is always a measurement: bytes that crossed the wire, files
 * counted, nodes counted. it is never a delta and never a saving, which is what
 * the three authored lines this replaces used to put there.
 */
export function FindingsList({
  view,
  amountWidth = 74,
}: {
  view: FindingsView;
  amountWidth?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {view.none === null ? null : (
        <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          {view.none}
        </p>
      )}
      {view.rows.map((finding) => (
        <div
          key={finding.id}
          style={{
            display: 'grid',
            gridTemplateColumns: `${amountWidth}px 1fr`,
            gap: 12,
            alignItems: 'baseline',
          }}
        >
          <span
            className="mono"
            style={{
              fontSize: 11,
              textAlign: 'right',
              color: finding.severity === 'breach' ? 'var(--breach)' : 'var(--caution)',
            }}
          >
            {finding.amount}
          </span>
          <div>
            <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>{finding.sentence}</span>
            {/* the visible name is truncated to a file name. the url is what
                identifies the response, so it names the item rather than hiding
                behind a hover on something the keyboard cannot reach. */}
            {finding.evidence.length === 0 ? null : (
              <div
                role="list"
                aria-label={tFr.a11y.evidence}
                style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '0 12px' }}
              >
                {finding.evidence.map((entry) => (
                  <span
                    key={entry.url}
                    role="listitem"
                    aria-label={`${entry.url} ${entry.amount}`}
                    className="mono"
                    style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}
                  >
                    {entry.name} {entry.amount}
                  </span>
                ))}
              </div>
            )}
            {finding.unavailable === null ? null : (
              <div style={{ marginTop: 4, fontSize: 10, color: 'var(--caution)' }}>
                {finding.unavailable}
              </div>
            )}
          </div>
        </div>
      ))}
      {view.withheld.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: 'grid',
            gridTemplateColumns: `${amountWidth}px 1fr`,
            gap: 12,
            alignItems: 'baseline',
          }}
        >
          {/* nothing was measured, so nothing goes in the measurement column. */}
          <span
            className="mono"
            style={{ fontSize: 11, textAlign: 'right', color: 'var(--text-tertiary)' }}
          >
            –
          </span>
          <span style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            {entry.text}
          </span>
        </div>
      ))}
      <p style={{ margin: '2px 0 0', fontSize: 10, lineHeight: 1.5, color: 'var(--text-tertiary)' }}>
        {view.note}
      </p>
    </div>
  );
}
