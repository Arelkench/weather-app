import type { ActivityScore, ActivityType } from '../types';
import { ScoreCircle } from './ScoreCircle';
import { activityColor, activityIcon, activityLabel, scoreColor } from '../utils/weather';

interface Props {
  activity: ActivityScore;
  isSelected: boolean;
  onSelect: (activity: ActivityType) => void;
}

export function ActivityCard({ activity, isSelected, onSelect }: Props) {
  const color = activityColor(activity.activity);

  return (
    <button
      aria-pressed={isSelected}
      aria-label={`${activityLabel(activity.activity)}: score ${activity.score}, ${activity.rating}. ${activity.description}`}
      onClick={() => onSelect(activity.activity)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 20,
        background: 'var(--bg-card)',
        border: `2px solid ${isSelected ? color : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s',
        boxShadow: isSelected ? `0 0 0 3px ${color}22` : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }} aria-hidden="true">{activityIcon(activity.activity)}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          {activityLabel(activity.activity)}
        </span>
      </div>

      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ScoreCircle score={activity.score} size={72} strokeWidth={6} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: scoreColor(activity.score) }}>
            {activity.rating}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
            {activity.description}
          </p>
        </div>
      </div>

      {/* Best time */}
      {activity.bestTime !== 'N/A' && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            Best time
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{activity.bestTime}</p>
        </div>
      )}

      {/* Breakdown */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Breakdown
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {activity.breakdown.map((f) => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 110, flexShrink: 0 }}>{f.name}</span>
              <div
                role="meter"
                aria-label={`${f.name}: ${f.score} out of 100`}
                aria-valuenow={f.score}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  flex: 1,
                  height: 4,
                  background: 'var(--border)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${f.score}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 24, textAlign: 'right' }}>
                {f.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
