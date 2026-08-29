import type { HourlyScore } from '../types';

interface Props {
  hourly: HourlyScore[];
  color?: string;
}

const W = 260;
const H = 90;
const PAD = { top: 8, right: 8, bottom: 20, left: 28 };
const CW = W - PAD.left - PAD.right;
const CH = H - PAD.top - PAD.bottom;

export function HourlyChart({ hourly, color = 'var(--accent)' }: Props) {
  const pts = hourly.map((h, i) => ({
    x: PAD.left + (i / (hourly.length - 1)) * CW,
    y: PAD.top + CH - (h.score / 100) * CH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Filled area under the line
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(PAD.top + CH).toFixed(1)} L${pts[0].x.toFixed(1)},${(PAD.top + CH).toFixed(1)} Z`;

  const yLabels = [0, 50, 100];
  const xLabels = [0, 6, 12, 18, 23];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Hourly activity score chart"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* y-axis reference lines */}
      {yLabels.map((v) => {
        const y = PAD.top + CH - (v / 100) * CH;
        return (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left + CW} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">{v}</text>
          </g>
        );
      })}

      {/* filled area */}
      <path d={areaPath} fill="url(#chartGrad)" />

      {/* line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* x-axis labels */}
      {xLabels.map((h) => {
        const x = PAD.left + (h / 23) * CW;
        return (
          <text key={h} x={x} y={H - 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
            {String(h).padStart(2, '0')}
          </text>
        );
      })}
    </svg>
  );
}
