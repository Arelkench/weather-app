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

## Evidence vs assumptions

The scoring models are evidence-informed rather than presented as universal scientific truth. The outdoor sightseeing model is based on the structure and weighting of the Holiday Climate Index for Urban Tourism (HCI:Urban). The indoor sightseeing model is intentionally a project-specific interpretation: it estimates motivation to choose indoor activities from outdoor weather inconvenience.

Where published research does not directly define a threshold applicable to Open-Meteo's hourly data, we make an explicit implementation assumption rather than implying scientific validation. The scoring is intended to produce an understandable, comparable 0–100 suitability score, not to claim that a particular weather condition objectively makes an activity good or bad.

All assumptions are documented with comments inside the relevant scoring file (`backend/src/scoring/`).

## Scoring methodology

All scores are 0–100. Each scorer returns a daily score, rating, one-line description, best 4-hour window, hourly scores, and factor breakdown. Daily scores are averaged over the activity's realistic operating window — not all 24 hours.

### Surfing (06:00–12:00)

Evidence-informed adaptation of the Global Surf Index (Reguero et al., 2015) and Hutt et al. (2001) skill-level wave-height ranges.

| Factor | Weight | Source |
|---|---|---|
| Wave height | 35% | Hutt et al. (2001) — appropriate range varies by surfer skill |
| Wind speed | 35% | Global Surf Index; Surfline methodology |
| Wave period | 20% | Surfline wave-energy research |
| Air temperature | 5% | Project assumption — small comfort modifier only |
| Precipitation | 5% | Project assumption — rain ≠ bad surf |

Fallback: no marine data (inland location) → score 0 with explanation.

### Skiing (10:00–15:00)

Based on the Skiing Utility Index (SUI) from Kapetanakis et al. (2022), which surveyed 111 skiers at a Greek ski resort and fitted empirical utility curves for each variable.

| Factor | Weight | Source |
|---|---|---|
| Snowfall duration | 30.3% | Kapetanakis et al. (2022) — 3rd-degree polynomial |
| Wind | 27.9% | Kapetanakis et al. (2022) |
| Temperature | 22.2% | Kapetanakis et al. (2022) — GEV distribution |
| Cloud cover | 19.4% | Kapetanakis et al. (2022) |

Guard: if peak ski-window temperature > 3 °C and no snowfall at all, skiing is physically implausible (no snow-covered slopes) → score 0.

### Outdoor sightseeing (09:00–19:00)

Follows the structure and component weights of the Holiday Climate Index for Urban Tourism (HCI:Urban, Dubois et al.).

| Factor | Weight | Source |
|---|---|---|
| Thermal comfort | 40% | HCI:Urban weight — largest single tourist-comfort factor |
| Precipitation | 30% | HCI:Urban weight |
| Sun / Clouds | 20% | HCI:Urban aesthetics component |
| Wind | 10% | HCI:Urban weight |

Project approximation: `apparent_temperature` (Open-Meteo) is used as a proxy for HCI's thermal comfort component (which uses Physiological Equivalent Temperature). Exact °C thresholds are adapted to apparent temperature rather than the published HCI rating tables.

### Indoor sightseeing (09:00–19:00)

No universal indoor-tourism index exists in the literature. This model is a project-derived measure of motivation to choose indoor activities based on outdoor weather inconvenience.

| Factor | Weight | Rationale |
|---|---|---|
| Rain impact | 45% | Project assumption — rain is the primary driver of indoor motivation |
| Thermal discomfort | 25% | Project assumption — cold and extreme heat both motivate shelter |
| Wind impact | 20% | Project assumption — strong wind reduces outdoor appeal |
| Cloud cover | 10% | Project assumption — weakest driver; overcast ≠ compels going inside |

Floor: daily score is floored at 30 because museums and galleries are worthwhile regardless of weather. The floor is applied to each hourly total, not to individual breakdown components.

### Running tests

```bash
cd backend && npm test
```

39 boundary tests covering component functions and the evaluation-window constraint for both sightseeing models.

## Things I'd do with more time

- Wind direction for surfing (offshore vs onshore matters more than speed)
- Snow depth / base layer data for skiing (Open-Meteo has it in the climate API)
- Location disambiguation — geocoding currently takes the first result; a dropdown to pick between multiple matches would help
- Error boundary + retry UI
