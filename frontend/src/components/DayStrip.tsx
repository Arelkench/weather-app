import type { DayForecast, ActivityType, TempUnit } from '../types';
import { ScoreCircle } from './ScoreCircle';
import { wmoIcon, formatDay, displayTemp } from '../utils/weather';

interface Props {
  days: DayForecast[];
  selectedDay: number;
  selectedActivity: ActivityType;
  unit: TempUnit;
  onSelectDay: (i: number) => void;
}

const styles = {
  list: { display: 'flex', gap: 10, overflowX: 'auto' as const, padding: '4px 0 8px' },
  dayLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  dateLabel: { fontSize: 11, color: 'var(--text-secondary)' },
  tempLabel: {
    fontSize: 12, color: 'var(--text-secondary)',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' as const,
  },
};

function dayButtonStyle(isSelected: boolean) {
  return {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    padding: '12px 14px',
    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
    cursor: 'pointer',
    width: 108,
    transition: 'border-color 0.15s, background 0.15s',
    flexShrink: 0,
  };
}

export function DayStrip({ days, selectedDay, selectedActivity, unit, onSelectDay }: Props) {
  return (
    <div role="tablist" aria-label="7-day forecast" style={styles.list}>
      {days.map((day, i) => {
        const { day: dayName, date } = formatDay(day.date, i);
        const activity = day.activities.find((a) => a.name === selectedActivity);
        const score = activity?.score ?? 0;
        const isSelected = i === selectedDay;

        return (
          <button
            key={day.date}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${dayName} ${date}: activity score ${score}`}
            onClick={() => onSelectDay(i)}
            style={dayButtonStyle(isSelected)}
          >
            <span style={styles.dayLabel}>{dayName}</span>
            <span style={styles.dateLabel}>{date}</span>
            <ScoreCircle score={score} size={64} strokeWidth={5} />
            <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">{wmoIcon(day.weatherCode)}</span>
            <span style={styles.tempLabel}>
              {displayTemp(day.tempMax, unit)} / {displayTemp(day.tempMin, unit)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
