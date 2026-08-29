# OutThere — Activity Forecast

A 7-day activity forecast service that scores how good each day will be for **surfing**, **skiing**, **outdoor sightseeing**, and **indoor sightseeing** for any city or town.

## How to run

**Requirements:** Node 18+

```bash
# Backend (GraphQL on :4000)
cd backend && npm install && npm run dev

# Frontend (React on :3000) — in a second terminal
cd frontend && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Vite dev server proxies `/graphql` to the backend, so no CORS configuration is needed.

## Stack

- **Backend:** Node.js · TypeScript · Apollo Server 3 · Express
- **Frontend:** Vite · React 18 · TypeScript · TanStack Query · graphql-request · Radix UI
- **Data:** [Open-Meteo](https://open-meteo.com/) (free, no API key)

## What I built

Search any city → get 7 days of activity scores (0–100) powered by real forecast data. Each activity shows a rating, one-line description, best 4-hour window, and a factor breakdown. Clicking a card opens a detail panel with an hourly score chart. Supports °C/°F toggle and light/dark mode.

TanStack Query caches results by location string — switching between recently searched cities is instant (5-minute stale time). Recent searches surface in the search dropdown from the query cache itself, no extra state needed.

## Scoring assumptions

All scores are 0–100. I worked out the factor weights and thresholds by talking through what actually matters for each activity with Claude, then sanity-checking the outputs against known good/bad days.

### Surfing
Factors (weighted average over daylight hours):

| Factor | Weight | Reasoning |
|---|---|---|
| Wave height | 30% | Sweet spot 0.8–2.5 m; <0.3 m = flat, >4 m = dangerous |
| Wave period | 25% | Longer period = cleaner, more powerful waves; >15 s = 100 |
| Wind speed | 25% | <10 km/h = perfect; offshore/onshore direction not available from Open-Meteo free tier, so wind speed only |
| Precipitation | 10% | Rain affects comfort and visibility, not wave quality |
| Air temperature | 10% | Comfort/wetsuit choice proxy |

Fallback: if the marine API returns no wave data (inland location), surfing score = 0 with an explanatory description.

### Skiing
| Factor | Weight | Reasoning |
|---|---|---|
| Fresh snowfall | 35% | Hourly snowfall in cm; 0 = 20 (base layer assumed), >3 cm/h = 100 |
| Temperature | 25% | –5 to –10 °C is the sweet spot; above 0 °C = wet/icy (15 pts); below –20 °C = uncomfortably cold |
| Wind | 20% | >60 km/h = lift-closing conditions |
| Visibility | 20% | <1000 m = whiteout/dangerous |

### Outdoor sightseeing
| Factor | Weight | Reasoning |
|---|---|---|
| Temperature | 30% | Bell curve peaking at 18–25 °C; <0 °C or >35 °C = near-zero |
| Precipitation | 30% | Any rain drops the score sharply; heavy rain = near-zero |
| Cloud cover | 20% | 20–45% (partly cloudy) = ideal; fully overcast = 15 |
| Wind | 20% | <10 km/h = perfect; walking in gale-force wind is unpleasant |

### Indoor sightseeing
Scores "motivation to be indoors" — bad outdoor conditions push you inside, but a beautiful day can still be 30 (museums exist). Floored at 30, capped at 85.

| Factor | Weight | Reasoning |
|---|---|---|
| Precipitation | 40% | Rain is the strongest indoor motivator |
| Temperature extreme | 30% | <5 °C or >30 °C makes outside uncomfortable |
| Wind | 15% | High wind adds motivation |
| Cloud cover | 15% | Overcast adds marginal motivation |

**Best time** for each activity is the 4-hour window with the highest average hourly score, searched within activity-appropriate hours (e.g. surfing: 05:00–18:00, skiing: 08:00–17:00).

## Things I'd do with more time

- Wind direction for surfing (offshore vs onshore matters more than speed)
- Snow depth / base layer data for skiing (Open-Meteo has it in the climate API)
- Location disambiguation — geocoding currently takes the first result; a dropdown to pick between multiple matches would help
- Error boundary + retry UI
- Unit tests for the scoring functions (they're pure functions, easy to test)
