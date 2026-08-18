import type { DeltaClassification } from '@balise/schemas';
import {
  BAND_COLORS,
  envelopePolygon,
  TREND_LAYOUT,
  trendDomain,
  xPosition,
  type TrendPoint,
} from './geometry.js';

export interface TrendDeploy {
  index: number;
  label: string;
  /**
   * how the kernel classified the delta this deploy introduced. absent when
   * no delta was measured against it. only 'regression' draws in breach:
   * product rule 2, enforced here rather than by the caller.
   */
  classification?: DeltaClassification;
}

export interface ToleranceTrendProps {
  points: readonly TrendPoint[];
  deploys: readonly TrendDeploy[];
  /** horizontal rules, drawn only where they fall inside the domain. */
  gridValues: readonly number[];
  budget?: number;
  budgetLabel?: string;
  startLabel: string;
  endLabel: string;
  /** for the accessible text equivalent, e.g. "KB transferred". */
  unitLabel: string;
}

const MONO = "'Martian Mono Variable', 'Martian Mono', monospace";

/**
 * the band over time: a median line inside its dispersion envelope, with
 * deploy markers on the axis and one optional budget rule. the envelope is
 * the point. a bare line would imply a precision the runs do not have.
 */
export function ToleranceTrend(props: ToleranceTrendProps) {
  const { points, deploys, gridValues, budget, budgetLabel, startLabel, endLabel, unitLabel } = props;
  if (points.length < 2) {
    return null;
  }

  const layout = TREND_LAYOUT;
  const domain = trendDomain(points, budget);
  const x = (index: number) =>
    layout.plotLeft + (index / (points.length - 1)) * (layout.plotRight - layout.plotLeft);
  // svg y grows downward, so the plot floor is the range minimum
  const y = (value: number) =>
    xPosition(
      {
        domainMin: domain.min,
        domainMax: domain.max,
        rangeMin: layout.plotBottom,
        rangeMax: layout.plotTop,
      },
      value,
    );

  const grid = gridValues.filter((value) => value >= domain.min && value <= domain.max);
  const medianLine = points.map((point, index) => `${x(index)},${y(point.median)}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label={`${points.length} samples of ${unitLabel}, ${startLabel} to ${endLabel}, drawn with the run dispersion envelope`}
    >
      <g stroke={BAND_COLORS.axis} strokeOpacity=".14">
        {grid.map((value) => (
          <line key={value} x1={layout.plotLeft} y1={y(value)} x2={layout.plotRight} y2={y(value)} />
        ))}
      </g>
      <g fill="#8B939B" fontFamily={MONO} fontSize="7.5">
        {grid.map((value) => (
          <text key={value} x={0} y={y(value) + 3}>
            {value}
          </text>
        ))}
      </g>

      <polygon opacity=".15" fill={BAND_COLORS.band} points={envelopePolygon(points, x, y)} />

      {budget !== undefined ? (
        <>
          <line
            x1={layout.plotLeft}
            y1={y(budget)}
            x2={layout.plotRight}
            y2={y(budget)}
            stroke={BAND_COLORS.bandBreach}
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity=".75"
          />
          {budgetLabel !== undefined ? (
            <text
              x={layout.plotRight}
              y={y(budget) - 4}
              textAnchor="end"
              fill={BAND_COLORS.bandBreach}
              fontFamily={MONO}
              fontSize="7.5"
            >
              {budgetLabel}
            </text>
          ) : null}
        </>
      ) : null}

      <polyline fill="none" stroke={BAND_COLORS.median} strokeWidth="1.6" points={medianLine} />

      {deploys.map((deploy) => {
        const point = points[deploy.index];
        if (point === undefined || deploy.classification === undefined) {
          return null;
        }
        const cx = x(deploy.index);
        return deploy.classification === 'regression' ? (
          <circle key={deploy.label} cx={cx} cy={y(point.median)} r="3.4" fill={BAND_COLORS.bandBreach} />
        ) : (
          <circle
            key={deploy.label}
            cx={cx}
            cy={y(point.median)}
            r="2.6"
            fill="#F3F4F1"
            stroke={BAND_COLORS.median}
            strokeWidth="1.4"
          />
        );
      })}

      <line
        x1={layout.plotLeft}
        y1={layout.axisY}
        x2={layout.plotRight}
        y2={layout.axisY}
        stroke={BAND_COLORS.axis}
        strokeOpacity=".4"
      />
      {deploys.map((deploy) => {
        const cx = x(deploy.index);
        const isRegression = deploy.classification === 'regression';
        const color = isRegression ? BAND_COLORS.bandBreach : BAND_COLORS.axis;
        return (
          <g key={deploy.label}>
            <path
              d={isRegression ? `M${cx} ${layout.axisY} l3.8 -7 h-7.6 z` : `M${cx} ${layout.axisY} l3.4 -6 h-6.8 z`}
              fill={color}
            />
            <text x={cx} y={layout.axisY + 12} textAnchor="middle" fill={color} fontFamily={MONO} fontSize="7.5">
              {deploy.label}
            </text>
          </g>
        );
      })}

      <g fill="#8B939B" fontFamily={MONO} fontSize="7.5">
        <text x={layout.plotLeft} y={layout.labelY}>
          {startLabel}
        </text>
        <text x={layout.plotRight} y={layout.labelY} textAnchor="end">
          {endLabel}
        </text>
      </g>
    </svg>
  );
}
