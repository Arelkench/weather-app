import { scoreColor } from '../utils/weather';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  unavailable?: boolean;
}

export function ScoreCircle({ score, size = 80, strokeWidth = 6, showLabel = true, unavailable = false }: Props) {
  const radius = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = unavailable ? 0 : (score / 100) * circumference;
  const color = unavailable ? 'var(--border)' : scoreColor(score);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      {/* track */}
      <circle
        cx={cx} cy={cx} r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />

      {/* progress */}
      {!unavailable && (
        <circle
          cx={cx} cy={cx} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      )}

      {showLabel && (
        <text
          x="50%" y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={unavailable ? size * 0.20 : size * 0.26}
          fontWeight="700"
          fill={unavailable ? 'var(--text-muted)' : 'var(--text-primary)'}
        >
          {unavailable ? 'N/A' : score}
        </text>
      )}
    </svg>
  );
}
