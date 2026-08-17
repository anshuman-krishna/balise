// trend with envelope: median line over time inside a dispersion envelope,
// deploy markers on the axis, one budget rule. data-driven; the geometry
// grammar comes from the design prototype (band rendering 1b).

export interface TrendPoint {
  median: number;
  low: number;
  high: number;
}

export interface TrendDeploy {
  index: number;
  label: string;
  kind: 'normal' | 'regression' | 'no-sig';
}

export interface TrendChartProps {
  points: readonly TrendPoint[];
  deploys: readonly TrendDeploy[];
  gridValues: readonly number[];
  budget?: number;
  budgetLabel?: string;
  startLabel: string;
  endLabel: string;
}

const MONO = "'Martian Mono Variable', 'Martian Mono', monospace";

const WIDTH = 460;
const HEIGHT = 152;
const PLOT_LEFT = 30;
const PLOT_RIGHT = 430;
const PLOT_TOP = 26;
const PLOT_BOTTOM = 112;
const AXIS_Y = 126;

export function TrendChart(props: TrendChartProps) {
  const { points, deploys, gridValues, budget, budgetLabel, startLabel, endLabel } = props;
  if (points.length < 2) {
    return null;
  }

  const lows = points.map((p) => p.low);
  const highs = points.map((p) => p.high);
  const domainMin = Math.min(...lows, ...(budget !== undefined ? [budget] : []));
  const domainMax = Math.max(...highs, ...(budget !== undefined ? [budget] : []));
  const pad = (domainMax - domainMin) * 0.06 || 1;
  const min = domainMin - pad;
  const max = domainMax + pad;

  const x = (index: number) => PLOT_LEFT + (index / (points.length - 1)) * (PLOT_RIGHT - PLOT_LEFT);
  const y = (value: number) =>
    PLOT_BOTTOM - ((value - min) / (max - min)) * (PLOT_BOTTOM - PLOT_TOP);

  const envelope = [
    ...points.map((p, i) => `${x(i)},${y(p.high)}`),
    ...[...points].reverse().map((p, i) => `${x(points.length - 1 - i)},${y(p.low)}`),
  ].join(' ');

  const medianLine = points.map((p, i) => `${x(i)},${y(p.median)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label={`Trend over ${points.length} samples, ${startLabel} to ${endLabel}`}
    >
      <g stroke="#5A6169" strokeOpacity=".14">
        {gridValues
          .filter((value) => value >= min && value <= max)
          .map((value) => (
            <line key={value} x1={PLOT_LEFT} y1={y(value)} x2={PLOT_RIGHT} y2={y(value)} />
          ))}
      </g>
      <g fill="#8B939B" fontFamily={MONO} fontSize="7.5">
        {gridValues
          .filter((value) => value >= min && value <= max)
          .map((value) => (
            <text key={value} x={0} y={y(value) + 3}>
              {value}
            </text>
          ))}
      </g>

      <polygon opacity=".15" fill="#2B3FD9" points={envelope} />

      {budget !== undefined ? (
        <>
          <line
            x1={PLOT_LEFT}
            y1={y(budget)}
            x2={PLOT_RIGHT}
            y2={y(budget)}
            stroke="#B3312C"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity=".75"
          />
          {budgetLabel !== undefined ? (
            <text
              x={PLOT_RIGHT}
              y={y(budget) - 4}
              textAnchor="end"
              fill="#B3312C"
              fontFamily={MONO}
              fontSize="7.5"
            >
              {budgetLabel}
            </text>
          ) : null}
        </>
      ) : null}

      <polyline fill="none" stroke="#2B3FD9" strokeWidth="1.6" points={medianLine} />

      {deploys.map((deploy) => {
        const point = points[deploy.index];
        if (point === undefined) return null;
        const cx = x(deploy.index);
        if (deploy.kind === 'regression') {
          return <circle key={deploy.label} cx={cx} cy={y(point.median)} r="3.4" fill="#B3312C" />;
        }
        if (deploy.kind === 'no-sig') {
          return (
            <circle
              key={deploy.label}
              cx={cx}
              cy={y(point.median)}
              r="2.6"
              fill="#F3F4F1"
              stroke="#2B3FD9"
              strokeWidth="1.4"
            />
          );
        }
        return null;
      })}

      <line x1={PLOT_LEFT} y1={AXIS_Y} x2={PLOT_RIGHT} y2={AXIS_Y} stroke="#5A6169" strokeOpacity=".4" />
      {deploys.map((deploy) => {
        const cx = x(deploy.index);
        const isRegression = deploy.kind === 'regression';
        return (
          <g key={deploy.label}>
            <path
              d={
                isRegression
                  ? `M${cx} ${AXIS_Y} l3.8 -7 h-7.6 z`
                  : `M${cx} ${AXIS_Y} l3.4 -6 h-6.8 z`
              }
              fill={isRegression ? '#B3312C' : '#5A6169'}
            />
            <text
              x={cx}
              y={AXIS_Y + 12}
              textAnchor="middle"
              fill={isRegression ? '#B3312C' : '#5A6169'}
              fontFamily={MONO}
              fontSize="7.5"
            >
              {deploy.label}
            </text>
          </g>
        );
      })}
      <g fill="#8B939B" fontFamily={MONO} fontSize="7.5">
        <text x={PLOT_LEFT} y={HEIGHT - 2}>
          {startLabel}
        </text>
        <text x={PLOT_RIGHT} y={HEIGHT - 2} textAnchor="end">
          {endLabel}
        </text>
      </g>
    </svg>
  );
}
