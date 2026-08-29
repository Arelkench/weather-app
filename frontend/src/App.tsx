import { useState } from 'react';
import { useForecast } from './hooks/useForecast';

export default function App() {
  const [location, setLocation] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const { data, isLoading, error } = useForecast(location);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) setLocation(trimmed);
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>OutThere — Activity Forecast</h1>
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="city-input" style={{ display: 'block', marginBottom: '0.5rem' }}>
          City or town
        </label>
        <input
          id="city-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. San Sebastián, Spain"
          aria-label="Enter a city or town"
          style={{ padding: '0.5rem', width: '300px', marginRight: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Search
        </button>
      </form>

      {isLoading && (
        <p aria-live="polite" aria-busy="true" style={{ marginTop: '1rem' }}>
          Loading forecast…
        </p>
      )}
      {error && (
        <p role="alert" style={{ marginTop: '1rem', color: 'red' }}>
          {error instanceof Error ? error.message : 'Something went wrong.'}
        </p>
      )}
      {data && (
        <pre
          aria-label="Raw forecast data"
          style={{
            marginTop: '1rem',
            background: '#f4f4f4',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '600px',
            fontSize: '0.75rem',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
