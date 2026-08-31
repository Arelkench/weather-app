const styles = {
  page: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '40px 48px',
  },
  inner: {
    maxWidth: 720,
  },
  h1: {
    fontSize: 24,
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  h2: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: 36,
    marginBottom: 10,
  },
  h3: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginTop: 24,
    marginBottom: 8,
  },
  p: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: 12,
  },
  code: {
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
    fontSize: 12,
    lineHeight: 1.75,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 18px',
    display: 'block',
    color: 'var(--text-primary)',
    whiteSpace: 'pre' as const,
    overflowX: 'auto' as const,
    marginBottom: 16,
  },
  ul: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  li: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    marginBottom: 4,
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none' as const,
  },
  callout: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderLeft: '3px solid var(--accent)',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 16,
  },
  calloutText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
    margin: 0,
  },
  mockImage: {
    width: '100%',
    borderRadius: 10,
    border: '1px solid var(--border)',
    marginBottom: 16,
    display: 'block',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid var(--border)',
    margin: '36px 0',
  },
};

export function AboutPage() {
  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <h1 style={styles.h1}>About this project</h1>

        <p style={styles.p}>
          I started my work on this project with an Excalidraw system design first: to grasp the
          scope, requirements, and possible extensions.
        </p>
        <p style={styles.p}>
          You can find it by this link, or by looking at{' '}
          <code style={{ fontFamily: 'monospace', fontSize: 13 }}>docs/design</code> Excalidraw file:
        </p>
        <p style={styles.p}>
          <a
            href="https://excalidraw.com/#json=rEt0BLHOsLRmoUkpAVXhZ,Vu8jIZBAqxC_OYc1n6ni7A"
            target="_blank"
            rel="noreferrer"
            style={styles.link}
          >
            https://excalidraw.com/#json=rEt0BLHOsLRmoUkpAVXhZ,Vu8jIZBAqxC_OYc1n6ni7A
          </a>
        </p>

        <p style={styles.p}>
          After gathering everything, I created a mock UI with help of AI, and went into Claude plan
          mode.
        </p>

        <h2 style={styles.h2}>Mock design</h2>
        {/* Place mock-ui.png in the public/ folder to show the image here */}
        <img src="/mock-ui.png" alt="Mock UI design" style={styles.mockImage} />

        <hr style={styles.divider} />

        <h2 style={styles.h2}>Development Phases</h2>
        <ul style={styles.ul}>
          {[
            'Phase 1 — Scaffolding, API/UI handshake',
            'Phase 2 — Open-Meteo integration',
            'Phase 3 — Scoring engine',
            'Phase 4 — UI',
            'Phase 5 — Readme, cleanup',
          ].map((phase) => (
            <li key={phase} style={styles.li}>{phase}</li>
          ))}
        </ul>

        <p style={styles.p}>
          I went refactoring after this stage, as I was satisfied with frontend view but saw a lot of
          flaws in code logic.
        </p>
        <p style={styles.p}>
          Once I was good with how the files and the structure looked like, I went deeper into the
          scoring logic. I left it for the end, as the API calls and returned properties were clear
          from the start, and weren't changed. The scoring logic changed. I tried to rely on external
          resources as much as possible, since they were based on actual researches, and had
          established metrics.
        </p>

        <hr style={styles.divider} />

        <h2 style={styles.h2}>Reasoning behind different activities score evaluation</h2>

        <h3 style={styles.h3}>Outdoor / Indoor sightseeing</h3>
        <p style={styles.p}>
          Everything is based on Holiday Climate Index. While activities may look like they are
          inverting each other in terms of score, that was not true, both were evaluated slightly
          differently. Test version looks pretty much the same as the last version of it.
        </p>

        <p style={{ ...styles.p, marginBottom: 4 }}>Test variant:</p>
        <code style={styles.code}>{`Rain        40%
Temperature 30%
Wind        15%
Cloud       15%`}</code>

        <p style={{ ...styles.p, marginBottom: 4 }}>Last variant:</p>
        <code style={styles.code}>{`Precipitation      45%
Thermal discomfort 25%
Wind               20%
Cloud              10%`}</code>

        <h3 style={styles.h3}>Surfing</h3>
        <p style={styles.p}>
          This one is the hardest to objectively evaluate. I wish there was a wind direction in
          metrics as well, as it would greatly improve scoring. It would be much better if we were
          able to check forecast for specific beaches + group of learners rather than any city.
          Surfing score evaluation is based on the Global Surf Index.
        </p>

        <p style={{ ...styles.p, marginBottom: 4 }}>Test variant:</p>
        <code style={styles.code}>{`SURF QUALITY  ·  06:00–20:00

 ├── wave height    30%  (0.8–1.5 m ideal; >4 m → 10 "dangerous")
 ├── wave period    25%  (longer always better; 15 s+ → 100)
 ├── wind           25%  (<10 km/h ideal)
 ├── precipitation  10%  (3 mm+ → heavy penalty)
 └── temperature    10%  (22°C+ → 100; cold → 30)

Flat weighted average, no hierarchy. All five factors sit at the same
level — no hierarchy between wave quality and comfort.`}</code>

        <p style={{ ...styles.p, marginBottom: 4 }}>Latest variant:</p>
        <code style={styles.code}>{`SURF QUALITY  ·  06:00–12:00

 ├── wave suitability                           55%
 │    ├── wave height  35%  (0.7–1.5 m ideal; >4 m → 20, skill-based)
 │    ├── wind         35%  (speed only — direction not available)
 │    └── wave period  20%  (12–16 s peak; very long stays high at 80)
 │
 └── comfort modifiers                          10%
      ├── temperature   5%  (wetsuit assumed; cold floor at 50)
      └── precipitation 5%  (heavy rain still → 30 minimum)`}</code>

        <h3 style={styles.h3}>Skiing</h3>
        <p style={styles.p}>
          Skiing score evaluation is based on the Ski Utility Index (i.e. SUI).
        </p>

        <div style={styles.callout}>
          <p style={styles.calloutText}>
            <strong>IMPORTANT:</strong> The SUI authors explicitly say that their four variables
            don't fully capture snow reliability, and snow depth is a separate concern. Better to
            leave it for future. It would break currently faithful evaluation.
            <br /><br />
            Also added check for warm weather and no snowing, because in SKI its considered norm and
            good as it thinks of resorts-only areas, in practice it resulted in Bali being scored as
            50–70.
          </p>
        </div>

        <p style={{ ...styles.p, marginBottom: 4 }}>Test variant:</p>
        <code style={styles.code}>{`SKIING  ·  10:00–15:00

 ├── fresh snow (24 h)  35%  (>15 cm → 100)
 ├── temperature        25%  (-5 to -15°C ideal)
 ├── wind               20%  (<25 km/h; >50 → 10)
 └── visibility         20%  (>5000 m ideal)`}</code>

        <p style={{ ...styles.p, marginBottom: 4 }}>Latest variant:</p>
        <code style={styles.code}>{`SKIING UTILITY INDEX  ·  10:00–15:00

 ├── snowfall duration  30.3%  (cubic poly; 1–2 h ideal; 5+ h → 0)
 ├── wind speed         27.9%  (20 m/s+ → 0; lift operations risk)
 ├── temperature        22.2%  (GEV curve; 0°C peak; valid -12 to +10°C)
 └── cloud cover        19.4%  (0–25% ideal for ~90% of respondents)

viability guard
 └── peak temp > 3°C and no snowfall → score = 0
     (prevents model rating non-ski locations)`}</code>

        <hr style={styles.divider} />

        <h2 style={styles.h2}>Things I left undone but would be worth improving</h2>
        <ol style={{ ...styles.ul, listStyleType: 'decimal' }}>
          {[
            'WeatherCode in DayForecast, type, and rating in activity type better be handled via frontend instead of being returned from the API.',
            'There are still inconsistencies in callbacks and types across the codebase.',
            "UX is not intuitive enough in my opinion — it's not clear from the start which score is being shown by default.",
            'Duplicate description text in full info block about activity.',
          ].map((item) => (
            <li key={item} style={styles.li}>{item}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
