// Dispersion plot: individual run dots, median rule, median ± MAD box, the
// noise field around the baseline median, and the delta called out. Used
// where the question is not "how much" but "is it real".

export interface DispersionPlotProps {
  baselineRuns: readonly number[];
  candidateRuns: readonly number[];
  baselineMedian: number;
  candidateMedian: number;
  mad: number;
  noise: number;
  scaleMin: number;
  scaleMax: number;
  noiseLabel: string;
  deltaLabel: string;
  baselineRowLabel: string;
  candidateRowLabel: string;
  /** True when the delta cleared the noise floor; controls the breach colour. */
  significant: boolean;
}

const MONO = "'Martian Mono Variable', 'Martian Mono', monospace";
const SANS = "'Public Sans Variable', 'Public Sans', sans-serif";

const WIDTH = 460;
const HEIGHT = 128;
const PLOT_LEFT = 91;
const PLOT_RIGHT = 430;
const BASELINE_Y = 42;
const CANDIDATE_Y = 76;
const AXIS_Y = 98;

export function DispersionPlot(props: DispersionPlotProps) {
  const {
    baselineRuns,
    candidateRuns,
    baselineMedian,
    candidateMedian,
    mad,
    noise,
    scaleMin,
    scaleMax,
    noiseLabel,
    deltaLabel,
    baselineRowLabel,
    candidateRowLabel,
    significant,
  } = props;

  const x = (value: number) =>
    PLOT_LEFT + ((value - scaleMin) / (scaleMax - scaleMin)) * (PLOT_RIGHT - PLOT_LEFT);

  const candidateColor = significant ? '#B3312C' : '#2B3FD9';
  const noiseX1 = x(baselineMedian - noise);
  const noiseX2 = x(baselineMedian + noise);
  const ticks = [scaleMin, scaleMin + (scaleMax - scaleMin) / 3, scaleMin + (2 * (scaleMax - scaleMin)) / 3, scaleMax];

  const row = (runs: readonly number[], median: number, y: number, color: string) => (
    <>
      <line x1={PLOT_LEFT} y1={y} x2={PLOT_RIGHT} y2={y} stroke="#5A6169" strokeOpacity=".18" />
      <rect x={x(median - mad)} y={y - 7} width={Math.max(0, x(median + mad) - x(median - mad))} height={14} fill={color} opacity=".16" />
      <line x1={x(median)} y1={y - 11} x2={x(median)} y2={y + 11} stroke={color} strokeWidth="2" />
      <g fill="#15181B" opacity=".55">
        {runs.map((run, index) => (
          <circle key={index} cx={x(run)} cy={y} r="2.4" />
        ))}
      </g>
    </>
  );

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label={deltaLabel}
    >
      <rect x={noiseX1} y={10} width={Math.max(0, noiseX2 - noiseX1)} height={76} fill="#5A6169" opacity=".1" />
      <text x={(noiseX1 + noiseX2) / 2} y={22} textAnchor="middle" fill="#5A6169" fontFamily={MONO} fontSize="7.5">
        {noiseLabel}
      </text>

      <text x={PLOT_LEFT - 6} y={BASELINE_Y + 3} textAnchor="end" fill="#5A6169" fontFamily={SANS} fontSize="9.5">
        {baselineRowLabel}
      </text>
      {row(baselineRuns, baselineMedian, BASELINE_Y, '#2B3FD9')}

      <text x={PLOT_LEFT - 6} y={CANDIDATE_Y + 3} textAnchor="end" fill="#15181B" fontFamily={SANS} fontSize="9.5">
        {candidateRowLabel}
      </text>
      {row(candidateRuns, candidateMedian, CANDIDATE_Y, candidateColor)}

      <line
        x1={x(baselineMedian)}
        y1={BASELINE_Y + 11}
        x2={x(candidateMedian)}
        y2={CANDIDATE_Y - 11}
        stroke="#5A6169"
        strokeDasharray="2 2"
        strokeOpacity=".6"
      />
      <text
        x={(x(baselineMedian) + x(candidateMedian)) / 2}
        y={(BASELINE_Y + CANDIDATE_Y) / 2 + 3}
        textAnchor="middle"
        fill={significant ? '#B3312C' : '#5A6169'}
        fontFamily={MONO}
        fontSize="8"
      >
        {deltaLabel}
      </text>

      <line x1={PLOT_LEFT} y1={AXIS_Y} x2={PLOT_RIGHT} y2={AXIS_Y} stroke="#5A6169" strokeOpacity=".4" />
      <g stroke="#5A6169" strokeOpacity=".4">
        {ticks.map((tick) => (
          <line key={tick} x1={x(tick)} y1={AXIS_Y} x2={x(tick)} y2={AXIS_Y + 4} />
        ))}
      </g>
      <g fill="#5A6169" fontFamily={MONO} fontSize="8" textAnchor="middle">
        {ticks.map((tick) => (
          <text key={tick} x={x(tick)} y={AXIS_Y + 16}>
            {Math.round(tick)}
          </text>
        ))}
      </g>
    </svg>
  );
}
