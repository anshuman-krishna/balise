// horizontal bars, one per model, each with the model's own stated
// uncertainty extent, the reference model marked. all bars share one scale so
// disagreement between models is visible, never reconciled.

export interface ModelOutputRow {
  name: string;
  value: number;
  low: number;
  high: number;
  isReference: boolean;
}

const MONO = "'Martian Mono Variable', 'Martian Mono', monospace";

const ROW_HEIGHT = 26;
const PLOT_LEFT = 96;
const PLOT_RIGHT = 320;
const VALUE_X = 380;

export function ModelComparison({
  models,
  scaleMin,
  scaleMax,
}: {
  models: readonly ModelOutputRow[];
  scaleMin: number;
  scaleMax: number;
}) {
  const height = models.length * ROW_HEIGHT + 4;
  const x = (value: number) =>
    PLOT_LEFT + ((value - scaleMin) / (scaleMax - scaleMin)) * (PLOT_RIGHT - PLOT_LEFT);

  return (
    <svg
      viewBox={`0 0 400 ${height}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label={`${models.length} model outputs side by side`}
    >
      {models.map((model, index) => {
        const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
        const color = model.isReference ? '#2B3FD9' : '#5A6169';
        return (
          <g key={model.name}>
            <text x={0} y={y + 3} fontFamily={MONO} fontSize="9.5" fill={model.isReference ? '#2B3FD9' : '#15181B'}>
              {model.name}
            </text>
            <rect
              x={x(model.low)}
              y={y - 4}
              width={Math.max(0, x(model.high) - x(model.low))}
              height={8}
              fill={color}
              opacity={model.isReference ? 0.2 : 0.16}
            />
            <line x1={x(model.value)} y1={y - 7} x2={x(model.value)} y2={y + 7} stroke={color} strokeWidth="2" />
            <text
              x={VALUE_X}
              y={y + 3}
              textAnchor="end"
              fontFamily={MONO}
              fontSize="10"
              fill={model.isReference ? '#2B3FD9' : '#15181B'}
            >
              {model.value.toFixed(2)}
              {model.isReference ? ' ◆' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
