import { ToleranceBand, type ToleranceBandProps } from '@balise/ui';
import type { Confidence } from '@balise/schemas';

export interface MetricTileProps {
  label: string;
  valueText: string;
  unitText: string;
  rightPrimary?: string;
  rightSecondary?: string;
  confidence: Confidence;
  confidenceLabel: string;
  band: Omit<ToleranceBandProps, 'size' | 'width'>;
  /** mandatory. a tile without provenance is a bare number. */
  provenance: string;
  stateMessage?: { text: string; tone: 'breach' | 'caution' };
}

// a confidence grade is not a pass state, and green is only ever a pass state.
// high confidence in a heavy page is a well-measured heavy page; drawing the
// grade in the conformity colour reads as approval of the figure beside it.
const CONFIDENCE_COLOR: Record<Confidence, string> = {
  high: 'var(--text-secondary)',
  medium: 'var(--caution)',
  low: 'var(--caution)',
};

export function MetricTile(props: MetricTileProps) {
  const {
    label,
    valueText,
    unitText,
    rightPrimary,
    rightSecondary,
    confidence,
    confidenceLabel,
    band,
    provenance,
    stateMessage,
  } = props;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="eyebrow">{label}</span>
        <span
          className="mono"
          style={{
            fontWeight: 500,
            fontSize: 9,
            letterSpacing: '.06em',
            color: CONFIDENCE_COLOR[confidence],
          }}
        >
          {confidenceLabel}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '13px 0 4px' }}>
        <span
          className="mono"
          style={{ fontSize: 29, letterSpacing: '-.04em', lineHeight: 1 }}
        >
          {valueText}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{unitText}</span>
        {rightPrimary !== undefined ? (
          <span
            className="mono"
            style={{
              marginLeft: 'auto',
              fontSize: 9.5,
              color: 'var(--text-secondary)',
              textAlign: 'right',
              lineHeight: 1.4,
            }}
          >
            {rightPrimary}
            {rightSecondary !== undefined ? (
              <>
                <br />
                <span style={{ color: 'var(--text-tertiary)' }}>{rightSecondary}</span>
              </>
            ) : null}
          </span>
        ) : null}
      </div>
      <div style={{ marginTop: 8 }}>
        <ToleranceBand {...band} size="compact" width={236} />
      </div>
      {stateMessage === undefined ? null : (
        <div
          className="mono"
          style={{
            marginTop: 9,
            fontSize: 9.5,
            color: stateMessage.tone === 'breach' ? 'var(--breach)' : 'var(--caution)',
          }}
        >
          {stateMessage.text}
        </div>
      )}
      {/* provenance is never displaced by a state message. an estimate has to
          name its model and version wherever it appears (invariant 1), and a
          tile that swapped the line for an alert would drop it exactly when
          the figure is being read most closely. */}
      <div className="mono" style={{ marginTop: 9, fontSize: 9.5, color: 'var(--text-tertiary)' }}>
        {provenance}
      </div>
    </div>
  );
}
