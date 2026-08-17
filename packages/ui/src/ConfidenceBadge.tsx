import type { Confidence } from '@balise/schemas';

const COLORS: Record<Confidence, string> = {
  high: '#3E7A5E',
  medium: '#C4761A',
  low: '#C4761A',
};

const BACKGROUNDS: Record<Confidence, string> = {
  high: 'rgba(62,122,94,.08)',
  medium: 'rgba(196,118,26,.08)',
  low: 'rgba(196,118,26,.08)',
};

const BORDERS: Record<Confidence, string> = {
  high: 'rgba(62,122,94,.4)',
  medium: 'rgba(196,118,26,.4)',
  low: 'rgba(196,118,26,.4)',
};

export interface ConfidenceBadgeProps {
  confidence: Confidence;
  label: string;
  /** Bare coloured text, for table rows. */
  bare?: boolean;
}

export function ConfidenceBadge({ confidence, label, bare = false }: ConfidenceBadgeProps) {
  if (bare) {
    return (
      <span
        style={{
          fontFamily: "'Martian Mono Variable', 'Martian Mono', monospace",
          fontWeight: 500,
          fontSize: 9,
          letterSpacing: '.06em',
          color: COLORS[confidence],
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 8px',
        border: `1px solid ${BORDERS[confidence]}`,
        background: BACKGROUNDS[confidence],
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          background: COLORS[confidence],
          borderRadius: '50%',
        }}
      />
      <span
        style={{
          fontFamily: "'Martian Mono Variable', 'Martian Mono', monospace",
          fontWeight: 500,
          fontSize: 9,
          letterSpacing: '.06em',
          color: COLORS[confidence],
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </span>
  );
}
