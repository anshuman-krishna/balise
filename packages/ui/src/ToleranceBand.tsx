import { useId } from 'react';
import type { Confidence, DeltaClassification } from '@balise/schemas';
import {
  BAND_COLORS,
  BAND_LAYOUTS,
  medianDashArray,
  resolveBandState,
  tickValues,
  xPosition,
  type BandSize,
  type BandState,
} from './geometry.js';

export interface ToleranceBandModel {
  name: string;
  version: string;
  value: number;
  isReference: boolean;
}

export interface ToleranceBandProps {
  size: BandSize;
  register?: 'screen' | 'print';
  scaleMin: number;
  scaleMax: number;
  /** the reported value, from the reference model. */
  median: number;
  bandLow: number;
  bandHigh: number;
  noiseLow?: number;
  noiseHigh?: number;
  models?: readonly ToleranceBandModel[];
  /** rule 1: no figure without its reference model version. required. */
  referenceModel: { id: string; version: string };
  confidence: Confidence;
  state?: BandState;
  /** rule 2: breach from a delta renders only when it cleared the floor. */
  deltaClassification?: DeltaClassification;
  budget?: number;
  budgetLabel?: string;
  /** for the accessible text equivalent, e.g. "gCO₂e / visit". */
  unitLabel: string;
  formatTick?: (value: number) => string;
  /** optional horizontal stretch; vertical geometry is fixed per size. */
  width?: number;
}

const MONO = "'Martian Mono Variable', 'Martian Mono', monospace";

/**
 * the signature component. one geometry, rendered at different budgets of
 * space and ink. enforces the four product rules in code; see geometry.ts.
 */
export function ToleranceBand(props: ToleranceBandProps) {
  const {
    size,
    register = 'screen',
    scaleMin,
    scaleMax,
    median,
    bandLow,
    bandHigh,
    noiseLow,
    noiseHigh,
    models,
    referenceModel,
    confidence,
    state: requestedState = 'normal',
    deltaClassification,
    budget,
    budgetLabel,
    unitLabel,
    formatTick = (value) => String(value),
  } = props;

  const patternId = useId();
  const layout = BAND_LAYOUTS[size];
  const effectiveWidth = props.width ?? layout.width;
  const stretch = effectiveWidth / layout.width;
  const plotLeft = layout.plotLeft * stretch;
  const plotRight = layout.plotRight * stretch;
  const scale = {
    domainMin: scaleMin,
    domainMax: scaleMax,
    rangeMin: plotLeft,
    rangeMax: plotRight,
  };

  const state = resolveBandState(requestedState, deltaClassification);
  const isPrint = register === 'print';

  const bandX1 = xPosition(scale, bandLow);
  const bandX2 = xPosition(scale, bandHigh);
  const medianX = xPosition(scale, median);
  const hasNoise = noiseLow !== undefined && noiseHigh !== undefined;
  const noiseX1 = hasNoise ? xPosition(scale, noiseLow) : 0;
  const noiseX2 = hasNoise ? xPosition(scale, noiseHigh) : 0;

  const bandFill =
    state === 'breach'
      ? BAND_COLORS.bandBreach
      : state === 'caution'
        ? BAND_COLORS.noiseCaution
        : BAND_COLORS.band;
  const medianColor =
    state === 'breach'
      ? BAND_COLORS.medianBreach
      : state === 'caution'
        ? BAND_COLORS.noiseCaution
        : BAND_COLORS.median;
  const noiseFill = confidence === 'low' ? BAND_COLORS.noiseCaution : BAND_COLORS.noise;
  const dash = medianDashArray(confidence, size);

  const label =
    `${median} ${unitLabel}, band ${bandLow} to ${bandHigh}` +
    (models && models.length > 0 ? ` across ${models.length} models` : '') +
    `, reference ${referenceModel.id}@${referenceModel.version}, confidence ${confidence}`;

  const ticks = layout.showAxisLabels ? tickValues(scaleMin, scaleMax, layout.tickCount) : [];

  return (
    <svg
      viewBox={`0 0 ${effectiveWidth} ${layout.height}`}
      width={effectiveWidth}
      height={layout.height}
      style={{ display: 'block', maxWidth: '100%' }}
      role="img"
      aria-label={label}
    >
      {isPrint ? (
        <defs>
          <pattern
            id={`${patternId}-hatch`}
            width="5"
            height="5"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="5" stroke={BAND_COLORS.ink} strokeWidth=".7" strokeOpacity=".38" />
          </pattern>
          <pattern id={`${patternId}-dot`} width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".6" fill={BAND_COLORS.ink} fillOpacity=".3" />
          </pattern>
        </defs>
      ) : null}

      {hasNoise ? (
        <rect
          x={noiseX1}
          y={layout.noiseY}
          width={Math.max(0, noiseX2 - noiseX1)}
          height={layout.noiseHeight}
          fill={isPrint ? `url(#${patternId}-dot)` : noiseFill}
          opacity={isPrint ? 1 : confidence === 'low' ? 0.1 : 0.11}
        />
      ) : null}

      <rect
        x={bandX1}
        y={layout.bandY}
        width={Math.max(0, bandX2 - bandX1)}
        height={layout.bandHeight}
        fill={isPrint ? `url(#${patternId}-hatch)` : bandFill}
        opacity={isPrint ? 1 : state === 'breach' ? 0.16 : size === 'compact' ? 0.2 : 0.14}
      />
      {isPrint ? (
        <rect
          x={bandX1}
          y={layout.bandY}
          width={Math.max(0, bandX2 - bandX1)}
          height={layout.bandHeight}
          fill="none"
          stroke={BAND_COLORS.ink}
          strokeWidth=".7"
        />
      ) : (
        <>
          <line x1={bandX1} y1={layout.bandY} x2={bandX1} y2={layout.bandY + layout.bandHeight} stroke={bandFill} strokeOpacity=".45" />
          <line x1={bandX2} y1={layout.bandY} x2={bandX2} y2={layout.bandY + layout.bandHeight} stroke={bandFill} strokeOpacity=".45" />
        </>
      )}

      {layout.showModelTicks && models
        ? models.map((model) => {
            const x = xPosition(scale, model.value);
            return (
              <line
                key={`${model.name}@${model.version}`}
                x1={x}
                y1={layout.bandY}
                x2={x}
                y2={layout.bandY - 6}
                stroke={isPrint ? BAND_COLORS.ink : bandFill}
                strokeOpacity={isPrint ? 1 : 0.7}
                strokeWidth={isPrint ? 0.7 : 1}
              />
            );
          })
        : null}

      <line
        x1={medianX}
        y1={layout.medianTop}
        x2={medianX}
        y2={layout.medianBottom}
        stroke={isPrint ? BAND_COLORS.ink : medianColor}
        strokeWidth={isPrint ? 2 : layout.medianWidth}
        strokeDasharray={dash}
      />
      {layout.showMedianTriangle && !isPrint ? (
        <path d={`M${medianX} ${layout.medianBottom} l5 8 h-10 z`} fill={medianColor} />
      ) : null}

      <line
        x1={plotLeft}
        y1={layout.axisY}
        x2={plotRight}
        y2={layout.axisY}
        stroke={isPrint ? BAND_COLORS.ink : BAND_COLORS.axis}
        strokeOpacity={isPrint ? 1 : size === 'canonical' ? 0.4 : 0.25}
        strokeWidth={isPrint ? 0.7 : 1}
      />

      {layout.showAxisLabels ? (
        <>
          <g stroke={isPrint ? BAND_COLORS.ink : BAND_COLORS.axis} strokeOpacity={isPrint ? 1 : 0.4} strokeWidth={isPrint ? 0.7 : 1}>
            {ticks.map((tick) => {
              const x = xPosition(scale, tick);
              return <line key={tick} x1={x} y1={layout.axisY} x2={x} y2={layout.axisY + layout.tickLength} />;
            })}
          </g>
          <g
            fill={isPrint ? BAND_COLORS.ink : BAND_COLORS.axis}
            fontFamily={MONO}
            fontSize="8"
            textAnchor="middle"
          >
            {ticks.map((tick) => (
              <text key={tick} x={xPosition(scale, tick)} y={layout.labelY}>
                {formatTick(tick)}
              </text>
            ))}
          </g>
        </>
      ) : null}

      {budget !== undefined ? (
        <>
          <line
            x1={xPosition(scale, budget)}
            y1={layout.noiseY - (size === 'canonical' ? 4 : 1)}
            x2={xPosition(scale, budget)}
            y2={layout.noiseY + layout.noiseHeight + (size === 'canonical' ? 4 : 1)}
            stroke={BAND_COLORS.bandBreach}
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity=".75"
          />
          {layout.showAxisLabels && budgetLabel ? (
            <text
              x={xPosition(scale, budget)}
              y={layout.noiseY - 6}
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
    </svg>
  );
}
