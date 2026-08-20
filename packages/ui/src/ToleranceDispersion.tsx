import type { DeltaClassification } from '@balise/schemas';
import {
  BAND_COLORS,
  DISPERSION_LAYOUT,
  resolveBandState,
  tickValues,
  xPosition,
  type LinearScale,
} from './geometry.js';

export interface ToleranceDispersionProps {
  baselineRuns: readonly number[];
  candidateRuns: readonly number[];
  baselineMedian: number;
  candidateMedian: number;
  /**
   * each side's own dispersion. two run sets do not share one mad, and drawing
   * the same box on both would report a spread neither of them measured.
   */
  baselineMad: number;
  candidateMad: number;
  /**
   * the computed noise floor, drawn as a field around the baseline median.
   * null where the history has not established one: a scenario with no floor
   * draws no field rather than a field of nothing.
   */
  noise: number | null;
  scaleMin: number;
  scaleMax: number;
  noiseLabel: string;
  deltaLabel: string;
  baselineRowLabel: string;
  candidateRowLabel: string;
  /**
   * the kernel's verdict on this pair. the candidate row draws in breach
   * only for 'regression': product rule 2, enforced here so no caller can
   * colour a sub-floor delta as a change.
   */
  deltaClassification: DeltaClassification;
  formatTick?: (value: number) => string;
}

const MONO = "'Martian Mono Variable', 'Martian Mono', monospace";
const SANS = "'Public Sans Variable', 'Public Sans', sans-serif";

/**
 * where the question is not "how much" but "is it real": every run drawn as
 * a dot, the median and its mad box, and the noise field the delta has to
 * clear before it counts.
 */
export function ToleranceDispersion(props: ToleranceDispersionProps) {
  const {
    baselineRuns,
    candidateRuns,
    baselineMedian,
    candidateMedian,
    baselineMad,
    candidateMad,
    noise,
    scaleMin,
    scaleMax,
    noiseLabel,
    deltaLabel,
    baselineRowLabel,
    candidateRowLabel,
    deltaClassification,
    formatTick = (value) => String(Math.round(value)),
  } = props;

  const layout = DISPERSION_LAYOUT;
  const scale: LinearScale = {
    domainMin: scaleMin,
    domainMax: scaleMax,
    rangeMin: layout.plotLeft,
    rangeMax: layout.plotRight,
  };
  const x = (value: number) => xPosition(scale, value);

  const significant = resolveBandState('breach', deltaClassification) === 'breach';
  const candidateColor = significant ? BAND_COLORS.bandBreach : BAND_COLORS.median;
  const noiseX1 = noise === null ? 0 : x(baselineMedian - noise);
  const noiseX2 = noise === null ? 0 : x(baselineMedian + noise);
  const ticks = tickValues(scaleMin, scaleMax, layout.tickCount);

  const row = (runs: readonly number[], median: number, mad: number, y: number, color: string) => (
    <>
      <line x1={layout.plotLeft} y1={y} x2={layout.plotRight} y2={y} stroke={BAND_COLORS.axis} strokeOpacity=".18" />
      <rect
        x={x(median - mad)}
        y={y - layout.rowHalfHeight}
        width={Math.max(0, x(median + mad) - x(median - mad))}
        height={layout.rowHalfHeight * 2}
        fill={color}
        opacity=".16"
      />
      <line
        x1={x(median)}
        y1={y - layout.medianHalfHeight}
        x2={x(median)}
        y2={y + layout.medianHalfHeight}
        stroke={color}
        strokeWidth="2"
      />
      <g fill={BAND_COLORS.ink} opacity=".55">
        {runs.map((run, index) => (
          <circle key={index} cx={x(run)} cy={y} r={layout.runRadius} />
        ))}
      </g>
    </>
  );

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label={`${baselineRowLabel} against ${candidateRowLabel}: ${deltaLabel}, noise floor ${noiseLabel}`}
    >
      {noise === null ? null : (
        <>
          <rect
            x={noiseX1}
            y={layout.noiseY}
            width={Math.max(0, noiseX2 - noiseX1)}
            height={layout.noiseHeight}
            fill={BAND_COLORS.noise}
            opacity=".1"
          />
          <text
            x={(noiseX1 + noiseX2) / 2}
            y={layout.noiseY + 12}
            textAnchor="middle"
            fill={BAND_COLORS.noise}
            fontFamily={MONO}
            fontSize="7.5"
          >
            {noiseLabel}
          </text>
        </>
      )}

      <text
        x={layout.plotLeft - 6}
        y={layout.baselineY + 3}
        textAnchor="end"
        fill={BAND_COLORS.noise}
        fontFamily={SANS}
        fontSize="9.5"
      >
        {baselineRowLabel}
      </text>
      {row(baselineRuns, baselineMedian, baselineMad, layout.baselineY, BAND_COLORS.median)}

      <text
        x={layout.plotLeft - 6}
        y={layout.candidateY + 3}
        textAnchor="end"
        fill={BAND_COLORS.ink}
        fontFamily={SANS}
        fontSize="9.5"
      >
        {candidateRowLabel}
      </text>
      {row(candidateRuns, candidateMedian, candidateMad, layout.candidateY, candidateColor)}

      <line
        x1={x(baselineMedian)}
        y1={layout.baselineY + layout.medianHalfHeight}
        x2={x(candidateMedian)}
        y2={layout.candidateY - layout.medianHalfHeight}
        stroke={BAND_COLORS.axis}
        strokeDasharray="2 2"
        strokeOpacity=".6"
      />
      <text
        x={(x(baselineMedian) + x(candidateMedian)) / 2}
        y={(layout.baselineY + layout.candidateY) / 2 + 3}
        textAnchor="middle"
        fill={significant ? BAND_COLORS.bandBreach : BAND_COLORS.noise}
        fontFamily={MONO}
        fontSize="8"
      >
        {deltaLabel}
      </text>

      <line
        x1={layout.plotLeft}
        y1={layout.axisY}
        x2={layout.plotRight}
        y2={layout.axisY}
        stroke={BAND_COLORS.axis}
        strokeOpacity=".4"
      />
      <g stroke={BAND_COLORS.axis} strokeOpacity=".4">
        {ticks.map((tick) => (
          <line key={tick} x1={x(tick)} y1={layout.axisY} x2={x(tick)} y2={layout.axisY + 4} />
        ))}
      </g>
      <g fill={BAND_COLORS.noise} fontFamily={MONO} fontSize="8" textAnchor="middle">
        {ticks.map((tick) => (
          <text key={tick} x={x(tick)} y={layout.axisY + 16}>
            {formatTick(tick)}
          </text>
        ))}
      </g>
    </svg>
  );
}
