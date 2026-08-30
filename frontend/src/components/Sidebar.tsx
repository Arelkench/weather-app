import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { label: 'Forecast', icon: '📈', active: true },
  { label: 'About', icon: 'ℹ️', active: false },
] as const;

const THEME_BUTTONS = [
  { value: 'light' as const, icon: '☀️', label: 'Light' },
  { value: 'dark' as const, icon: '🌙', label: 'Dark' },
] as const;

const styles = {
  nav: {
    width: 200,
    flexShrink: 0,
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px 0',
  },
  logoSection: { padding: '0 20px 24px', borderBottom: '1px solid var(--border)' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  navList: { listStyle: 'none' as const, padding: '16px 12px', flex: 1 },
  themeSection: { padding: '16px 20px', borderTop: '1px solid var(--border)' },
  themeButtons: { display: 'flex', gap: 8, marginBottom: 12 },
  hint: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 },
};

function navItemStyle(active: boolean) {
  return {
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
    textAlign: 'left' as const,
  };
}

function themeButtonStyle(active: boolean) {
  return {
    flex: 1,
    padding: '5px 0',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 6,
    background: active ? 'var(--accent)' : 'none',
    color: active ? '#FFF' : 'var(--text-secondary)',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  };
}

export function Sidebar() {
  const { theme, setTheme } = useTheme();

  function handleThemeToggle(value: 'light' | 'dark') {
    setTheme(theme === value ? 'system' : value);
  }

  return (
    <nav aria-label="Main navigation" style={styles.nav}>
      <div style={styles.logoSection}>
        <div style={styles.logoRow}>
          <span style={{ fontSize: 28 }} aria-hidden="true">🌤</span>
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>OutThere</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>Activity Forecast</p>
          </div>
        </div>
      </div>

      <ul style={styles.navList} role="list">
        {NAV_ITEMS.map(({ label, icon, active }) => (
          <li key={label}>
            <button aria-current={active ? 'page' : undefined} style={navItemStyle(active)}>
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          </li>
        ))}
      </ul>

      <div style={styles.themeSection}>
        <div style={styles.themeButtons}>
          {THEME_BUTTONS.map(({ value, icon, label }) => (
            <button
              key={value}
              aria-pressed={theme === value}
              aria-label={`Switch to ${value} mode`}
              onClick={() => handleThemeToggle(value)}
              style={themeButtonStyle(theme === value)}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <p style={styles.hint}>Scores show how suitable the weather is for each activity.</p>
      </div>
    </nav>
  );
}
