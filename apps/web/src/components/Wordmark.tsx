// The wordmark: a survey staff. A vertical rule with three horizontal marks
// of decreasing width, the second in the measured colour. No image assets.

export function Wordmark({ size = 16, onDark = true }: { size?: number; onDark?: boolean }) {
  const stroke = onDark ? '#F3F4F1' : '#15181B';
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <line x1="3" y1="1.5" x2="3" y2="14.5" stroke={stroke} strokeWidth="1.6" />
      <line x1="3" y1="3.5" x2="13" y2="3.5" stroke={stroke} strokeWidth="1.4" />
      <line x1="3" y1="7.5" x2="11" y2="7.5" stroke="#2B3FD9" strokeWidth="1.4" />
      <line x1="3" y1="11.5" x2="9" y2="11.5" stroke={stroke} strokeWidth="1.4" />
    </svg>
  );
}
