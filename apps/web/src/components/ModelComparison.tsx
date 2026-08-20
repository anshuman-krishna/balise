// horizontal bars, one per model, the reference model marked. all bars share
// one scale so disagreement between models is visible, never reconciled.
//
// a model that publishes an uncertainty of its own gets a band. one that does
// not gets a line, because an invented width would read as a stated one.
//
// a model outside the shared gCO2e band is still drawn here, dashed and
// labelled. what METHODOLOGY.md 10.1 governs is which models share an axis for
// the headline figure, never which are shown.

export interface ModelOutputRow {
  name: string;
  value: number;
  /** the model's own stated uncertainty. null when it publishes none. */
  low: number | null;
  high: number | null;
  isReference: boolean;
  /** false for a model reported beside the band rather than in it. */
  inBand: boolean;
  /** short reason, rendered under the name. */
  note?: string;
}

const MONO = "'Martian Mono Variable', 'Martian Mono', monospace";

const ROW_HEIGHT = 34;
const PLOT_LEFT = 132;
const PLOT_RIGHT = 318;
const VALUE_X = 396;

export function ModelComparison({
  models,
  scaleMin,
  scaleMax,
  format = (value) => value.toFixed(2),
}: {
  models: readonly ModelOutputRow[];
  scaleMin: number;
  scaleMax: number;
  format?: (value: number) => string;
}) {
  const height = models.length * ROW_HEIGHT + 4;
  const span = scaleMax - scaleMin;
  const x = (value: number) => PLOT_LEFT + (span === 0 ? 0 : (value - scaleMin) / span) * (PLOT_RIGHT - PLOT_LEFT);

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
        const ink = model.isReference ? '#2B3FD9' : model.inBand ? '#15181B' : '#5A6169';
        const hasOwnBand = model.low !== null && model.high !== null;

        return (
          <g key={model.name}>
            <text x={0} y={y} fontFamily={MONO} fontSize="9.5" fill={ink}>
              {model.name}
            </text>
            {model.note === undefined ? null : (
              <text x={0} y={y + 10} fontFamily={MONO} fontSize="7.5" fill="#5A6169" opacity=".85">
                {model.note}
              </text>
            )}

            {hasOwnBand ? (
              <rect
                x={x(model.low!)}
                y={y - 4}
                width={Math.max(0, x(model.high!) - x(model.low!))}
                height={8}
                fill={color}
                opacity={model.isReference ? 0.2 : 0.16}
              />
            ) : null}

            <line
              x1={x(model.value)}
              y1={y - 7}
              x2={x(model.value)}
              y2={y + 7}
              stroke={color}
              strokeWidth="2"
              strokeDasharray={model.inBand ? undefined : '3 2'}
            />
            <text x={VALUE_X} y={y + 3} textAnchor="end" fontFamily={MONO} fontSize="10" fill={ink}>
              {format(model.value)}
              {model.isReference ? ' ◆' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
