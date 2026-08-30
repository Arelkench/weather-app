import { useState, useEffect } from 'react';
import { useForecast } from './hooks/useForecast';
import { SearchBar } from './components/SearchBar';
import { DayStrip } from './components/DayStrip';
import { ActivityCard } from './components/ActivityCard';
import { DetailPanel } from './components/DetailPanel';
import type { ActivityType, TempUnit } from './types';
import { wmoIcon, displayTemp } from './utils/weather';

type Theme = 'light' | 'dark' | 'system';

export default function App() {
  const [location, setLocation] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('surfing');
  const [detailOpen, setDetailOpen] = useState(false);
  const [unit, setUnit] = useState<TempUnit>('C');
  const [theme, setTheme] = useState<Theme>('system');

  const { data, isLoading, error } = useForecast(location);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Reset day selection when new location loads
  useEffect(() => {
    if (data) setSelectedDay(0);
  }, [data]);

  const forecast = data?.forecast;
  const day = forecast?.days[selectedDay];
  const activeActivity = day?.activities.find((a) => a.activity === selectedActivity);

  function handleActivitySelect(activity: ActivityType) {
    setSelectedActivity(activity);
    setDetailOpen(true);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <nav
        aria-label="Main navigation"
        style={{
          width: 200,
          flexShrink: 0,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }} aria-hidden="true">🌤</span>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>OutThere</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>Activity Forecast</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <ul style={{ listStyle: 'none', padding: '16px 12px', flex: 1 }} role="list">
          {[
            { label: 'Forecast', icon: '📈', active: true },
            { label: 'About', icon: 'ℹ️', active: false },
          ].map(({ label, icon, active }) => (
            <li key={label}>
              <button
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: 8,
                  background: active ? 'var(--accent)' : 'none',
                  color: active ? '#FFF' : 'var(--text-secondary)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  marginBottom: 2,
                  textAlign: 'left',
                }}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Theme toggle */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                aria-pressed={theme === t}
                aria-label={`Switch to ${t} mode`}
                onClick={() => setTheme(theme === t ? 'system' : t)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  border: `1px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 6,
                  background: theme === t ? 'var(--accent)' : 'none',
                  color: theme === t ? '#FFF' : 'var(--text-secondary)',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                <span aria-hidden="true">{t === 'light' ? '☀️' : '🌙'}</span>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Scores show how suitable the weather is for each activity.
          </p>
        </div>
      </nav>

      {/* Main content */}
      <main
        id="main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <SearchBar onSearch={setLocation} currentLocation={location} />
          </div>

          {/* Unit toggle */}
          <div
            role="group"
            aria-label="Temperature unit"
            style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}
          >
            {(['C', 'F'] as const).map((u) => (
              <button
                key={u}
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  background: unit === u ? 'var(--accent)' : 'none',
                  color: unit === u ? '#FFF' : 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                °{u}
              </button>
            ))}
          </div>
        </header>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Empty state */}
          {!location && !isLoading && (
            <div style={{ textAlign: 'center', marginTop: '15vh', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🌤</p>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Activity Forecast
              </h1>
              <p style={{ fontSize: 15 }}>Search a city to see 7-day activity scores for surfing, skiing, and sightseeing.</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              style={{ textAlign: 'center', marginTop: '15vh', color: 'var(--text-secondary)' }}
            >
              <p style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">⏳</p>
              <p style={{ fontSize: 16 }}>Loading forecast for <strong>{location}</strong>…</p>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <div
              role="alert"
              style={{
                marginTop: '15vh',
                textAlign: 'center',
                color: 'var(--text-secondary)',
              }}
            >
              <p style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🔍</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Location not found
              </p>
              <p style={{ fontSize: 14 }}>
                {error instanceof Error ? error.message : 'Try a different city name.'}
              </p>
            </div>
          )}

          {/* Forecast */}
          {forecast && day && (
            <>
              {/* Location header */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {forecast.location.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>7-day forecast</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginLeft: 12,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span aria-hidden="true">{wmoIcon(day.weatherCode)}</span>
                    {displayTemp(day.tempMax, unit)} / {displayTemp(day.tempMin, unit)}
                  </span>
                </div>
              </div>

              {/* Day strip */}
              <section aria-label="Day selector" style={{ marginBottom: 28 }}>
                <DayStrip
                  days={forecast.days}
                  selectedDay={selectedDay}
                  selectedActivity={selectedActivity}
                  unit={unit}
                  onSelectDay={(i) => { setSelectedDay(i); }}
                />
              </section>

              {/* Activity grid */}
              <section aria-label="Activity forecasts">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {day.activities.map((activity) => (
                    <ActivityCard
                      key={activity.activity}
                      activity={activity}
                      isSelected={activity.activity === selectedActivity}
                      onSelect={handleActivitySelect}
                    />
                  ))}
                </div>
              </section>

              {/* Disclaimer */}
              <p
                style={{
                  marginTop: 24,
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                ℹ️ Scores are calculated using activity-specific models and optimal time windows. Forecasts are for guidance only — local conditions can vary. Always check local advisories.
              </p>
            </>
          )}
        </div>
      </main>

      {/* Detail panel */}
      {detailOpen && activeActivity && (
        <DetailPanel
          activity={activeActivity}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}
