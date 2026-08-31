import type { ForecastData, ActivityType, TempUnit } from '../types';
import { DayStrip } from './DayStrip';
import { ActivityCard } from './ActivityCard';
import { wmoIcon, displayTemp } from '../utils/weather';

interface Props {
  location: string | null;
  isLoading: boolean;
  error: Error | null;
  data: ForecastData | undefined;
  selectedDay: number;
  selectedActivity: ActivityType;
  unit: TempUnit;
  onSelectDay: (day: number) => void;
  onSelectActivity: (activity: ActivityType) => void;
}

const styles = {
  scrollable: { flex: 1, overflowY: 'auto' as const, padding: '24px' },
  centered: { textAlign: 'center' as const, marginTop: '15vh', color: 'var(--text-secondary)' },
  bigIcon: { fontSize: 48, marginBottom: 16 },
  locationName: { fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 },
  locationMeta: { display: 'flex', alignItems: 'center', gap: 6 },
  weatherInfo: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    marginLeft: 12, fontSize: 13, color: 'var(--text-secondary)',
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  disclaimer: {
    marginTop: 24, padding: '12px 16px', background: 'var(--bg-secondary)',
    borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
  },
};

function friendlyError(error: Error): { heading: string; detail: string } {
  const msg = error.message ?? '';
  const jsonStart = msg.indexOf(': {"');
  try {
    if (jsonStart !== -1) {
      const gqlMsg: string | undefined = JSON.parse(msg.slice(jsonStart + 2))?.response?.errors?.[0]?.message;
      if (gqlMsg) {
        if (/location not found/i.test(gqlMsg)) return { heading: 'Location not found', detail: 'Check the spelling or try a different city.' };
        return { heading: 'Something went wrong', detail: gqlMsg };
      }
    }
  } catch { /* fall through */ }
  if (/location not found/i.test(msg)) return { heading: 'Location not found', detail: 'Check the spelling or try a different city.' };
  return { heading: 'Something went wrong', detail: 'Try again in a moment.' };
}

export function ForecastContent({ location, isLoading, error, data, selectedDay, selectedActivity, unit, onSelectDay, onSelectActivity }: Props) {
  const forecast = data?.forecast;
  const day = forecast?.days[selectedDay];

  return (
    <div style={styles.scrollable}>
      {!location && !isLoading && (
        <div style={styles.centered}>
          <p style={styles.bigIcon} aria-hidden="true">🌤</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Activity Forecast</h1>
          <p style={{ fontSize: 15, marginBottom: 28 }}>Search a city to see 7-day scores for four activities.</p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            {[
              { icon: '🏄', label: 'Surfing' },
              { icon: '⛷️', label: 'Skiing' },
              { icon: '🚶', label: 'Outdoor' },
              { icon: '🏛️', label: 'Indoor' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 32 }} aria-hidden="true">{icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div role="status" aria-live="polite" aria-busy="true" style={styles.centered}>
          <p style={styles.bigIcon} aria-hidden="true">⏳</p>
          <p style={{ fontSize: 16 }}>Loading forecast for <strong>{location}</strong>…</p>
        </div>
      )}

      {error && !isLoading && (() => {
        const { heading, detail } = friendlyError(error);
        return (
          <div role="alert" style={styles.centered}>
            <p style={styles.bigIcon} aria-hidden="true">🔍</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{heading}</p>
            <p style={{ fontSize: 14 }}>{detail}</p>
          </div>
        );
      })()}

      {forecast && day && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h1 style={styles.locationName}>{forecast.location.name}</h1>
            <div style={styles.locationMeta}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>7-day forecast</span>
              <span style={styles.weatherInfo}>
                <span aria-hidden="true">{wmoIcon(day.weatherCode)}</span>
                {displayTemp(day.tempMax, unit)} / {displayTemp(day.tempMin, unit)}
              </span>
            </div>
          </div>

          <section aria-label="Day selector" style={{ marginBottom: 28 }}>
            <DayStrip
              days={forecast.days}
              selectedDay={selectedDay}
              selectedActivity={selectedActivity}
              unit={unit}
              onSelectDay={onSelectDay}
            />
          </section>

          <section aria-label="Activity forecasts">
            <div style={styles.activityGrid}>
              {day.activities.map((activity) => (
                <ActivityCard
                  key={activity.activity}
                  activity={activity}
                  isSelected={activity.activity === selectedActivity}
                  onSelect={onSelectActivity}
                />
              ))}
            </div>
          </section>

          <p style={styles.disclaimer}>
            ℹ️ Scores are calculated using activity-specific models and optimal time windows. Forecasts are for guidance only — local conditions can vary. Always check local advisories.
          </p>
        </>
      )}
    </div>
  );
}
