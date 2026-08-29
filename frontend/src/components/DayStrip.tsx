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

export function DayStrip({ days, selectedDay, selectedActivity, unit, onSelectDay }: Props) {
  return (
    <div
      role="tablist"
      aria-label="7-day forecast"
      style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        padding: '4px 0 8px',
      }}
    >
      {days.map((day, i) => {
        const { day: dayName, date } = formatDay(day.date, i);
        const activity = day.activities.find((a) => a.activity === selectedActivity);
        const score = activity?.score ?? 0;
        const isSelected = i === selectedDay;

        return (
          <button
            key={day.date}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${dayName} ${date}: activity score ${score}`}
            onClick={() => onSelectDay(i)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              background: isSelected ? 'var(--bg-secondary)' : 'var(--bg-card)',
              cursor: 'pointer',
              minWidth: 96,
              transition: 'border-color 0.15s, background 0.15s',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{dayName}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{date}</span>
            <ScoreCircle score={score} size={64} strokeWidth={5} />
            <span style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true">{wmoIcon(day.weatherCode)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {displayTemp(day.tempMax, unit)} / {displayTemp(day.tempMin, unit)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
