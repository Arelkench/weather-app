import type { Activity, ActivityType } from '../types';
import { ScoreCircle } from './ScoreCircle';
import { activityColor, activityIcon, activityLabel, scoreColor } from '../utils/weather';

interface Props {
  activity: Activity;
  isSelected: boolean;
  onSelect: (activity: ActivityType) => void;
}

const styles = {
  header: { display: 'flex', alignItems: 'center', gap: 10 },
  scoreRow: { display: 'flex', alignItems: 'center', gap: 14 },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  },
  breakdownList: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  breakdownRow: { display: 'flex', alignItems: 'center', gap: 10 },
  breakdownName: { fontSize: 12, color: 'var(--text-secondary)', width: 110, flexShrink: 0 },
  breakdownTrack: { flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  breakdownScore: { fontSize: 12, color: 'var(--text-secondary)', width: 24, textAlign: 'right' as const },
};

function cardStyle(isSelected: boolean, color: string) {
  return {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
    padding: 20,
    background: 'var(--bg-card)',
    border: `2px solid ${isSelected ? color : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'border-color 0.15s',
    boxShadow: isSelected ? `0 0 0 3px ${color}22` : 'none',
  };
}

function barFillStyle(color: string, score: number) {
  return { width: `${score}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' };
}

export function ActivityCard({ activity, isSelected, onSelect }: Props) {
  const color = activityColor(activity.name);

  return (
    <button
      aria-pressed={isSelected}
      aria-label={`${activityLabel(activity.name)}: score ${activity.score}, ${activity.rating}. ${activity.description}`}
      onClick={() => onSelect(activity.name)}
      style={cardStyle(isSelected, color)}
    >
      <div style={styles.header}>
        <span style={{ fontSize: 22 }} aria-hidden="true">{activityIcon(activity.name)}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
          {activityLabel(activity.name)}
        </span>
      </div>

      <div style={styles.scoreRow}>
        <ScoreCircle score={activity.score} size={72} strokeWidth={6} unavailable={activity.breakdown.length === 0} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: scoreColor(activity.score) }}>{activity.rating}</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
            {activity.description}
          </p>
        </div>
      </div>

      {activity.bestTime !== 'N/A' && (
        <div>
          <p style={{ ...styles.sectionLabel, marginBottom: 2 }}>Best time</p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{activity.bestTime}</p>
        </div>
      )}

      {activity.breakdown.length > 0 && <div>
        <p style={{ ...styles.sectionLabel, marginBottom: 8 }}>Breakdown</p>
        <div style={styles.breakdownList}>
          {activity.breakdown.map((f) => (
            <div key={f.name} style={styles.breakdownRow}>
              <span style={styles.breakdownName}>{f.name}</span>
              <div
                role="meter"
                aria-label={`${f.name}: ${f.score} out of 100`}
                aria-valuenow={f.score}
                aria-valuemin={0}
                aria-valuemax={100}
                style={styles.breakdownTrack}
              >
                <div style={barFillStyle(color, f.score)} />
              </div>
              <span style={styles.breakdownScore}>{f.score}</span>
            </div>
          ))}
        </div>
      </div>}
    </button>
  );
}
