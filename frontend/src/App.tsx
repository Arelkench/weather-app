import { useState } from 'react';
import { useForecast } from './hooks/useForecast';
import { useForecastState } from './hooks/useForecastState';
import { SearchBar } from './components/SearchBar';
import { Sidebar } from './components/Sidebar';
import { ForecastContent } from './components/ForecastContent';
import { DetailPanel } from './components/DetailPanel';
import { AboutPage } from './pages/AboutPage';

type Page = 'forecast' | 'about';

const styles = {
  root: { display: 'flex', height: '100vh', overflow: 'hidden' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', background: 'var(--bg)' },
  header: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid var(--border)' },
  unitToggle: { display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 },
};

function unitButtonStyle(active: boolean) {
  return {
    padding: '6px 14px',
    border: 'none',
    background: active ? 'var(--accent)' : 'none',
    color: active ? '#FFF' : 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 600 as const,
    cursor: 'pointer',
  };
}

export default function App() {
  const [page, setPage] = useState<Page>('forecast');
  const [location, setLocation] = useState<string | null>(null);
  const { data, isLoading, error } = useForecast(location);
  const { selectedDay, setSelectedDay, selectedActivity, detailOpen, setDetailOpen, unit, setUnit, handleActivitySelect } = useForecastState(data);

  const activeActivity = data?.forecast?.days[selectedDay]?.activities.find((a) => a.name === selectedActivity);

  return (
    <div style={styles.root}>
      <Sidebar page={page} onNav={setPage} />

      <main id="main-content" style={styles.main}>
        <header style={styles.header}>
          <div style={{ flex: 1 }}>
            <SearchBar onSearch={setLocation} currentLocation={location} />
          </div>

          <div role="group" aria-label="Temperature unit" style={styles.unitToggle}>
            {(['C', 'F'] as const).map((u) => (
              <button key={u} aria-pressed={unit === u} onClick={() => setUnit(u)} style={unitButtonStyle(unit === u)}>
                °{u}
              </button>
            ))}
          </div>
        </header>

        {page === 'about' ? <AboutPage /> : (
          <ForecastContent
            location={location}
            isLoading={isLoading}
            error={error as Error | null}
            data={data}
            selectedDay={selectedDay}
            selectedActivity={selectedActivity}
            unit={unit}
            onSelectDay={setSelectedDay}
            onSelectActivity={handleActivitySelect}
          />
        )}
      </main>

      {detailOpen && activeActivity && (
        <DetailPanel activity={activeActivity} onClose={() => setDetailOpen(false)} />
      )}
    </div>
  );
}
