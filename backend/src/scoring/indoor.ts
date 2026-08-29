import type { HourlySlice, ScorerOutput } from './types';
import { lerp, weighted, toRating, bestWindow } from './types';

// Indoor score = how motivated you are to be inside.
// Heavy rain, temperature extremes, and strong winds push you indoors.
// A beautiful day still scores 30 (museums exist for a reason).

function rainMotivation(p: number): number {
  if (p <= 0) return 10;
  if (p < 2) return lerp(p, 0, 2, 10, 60);
  if (p < 5) return lerp(p, 2, 5, 60, 90);
  return 95;
}

function tempMotivation(t: number): number {
  // Comfort zone 12-24°C = low indoor motivation
  if (t >= 12 && t <= 24) return lerp(Math.abs(t - 18), 0, 6, 10, 30);
  if (t < 12) return lerp(t, -15, 12, 95, 10);
  // hot
  if (t > 24) return lerp(t, 24, 38, 10, 85);
  return 10;
}

function windMotivation(w: number): number {
  if (w < 20) return 10;
  if (w < 40) return lerp(w, 20, 40, 10, 55);
  if (w < 60) return lerp(w, 40, 60, 55, 80);
  return 90;
}

function cloudMotivation(c: number): number {
  if (c < 30) return 10;
  if (c < 70) return lerp(c, 30, 70, 10, 40);
  return 55;
}

function hourScore(slice: HourlySlice, h: number): number {
  const raw = weighted([
    [rainMotivation(slice.precipitation[h]),  0.40],
    [tempMotivation(slice.temperature[h]),    0.30],
    [windMotivation(slice.windspeed[h]),      0.15],
    [cloudMotivation(slice.cloudcover[h]),    0.15],
  ]);
  // Floor at 30, cap at 85
  return Math.max(30, Math.min(85, raw));
}

export function scoreIndoor(slice: HourlySlice): ScorerOutput {
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, score: hourScore(slice, h) }));
  const dayHours = hourly.slice(9, 19).map((h) => h.score);
  const score = Math.round(dayHours.reduce((a, b) => a + b, 0) / dayHours.length);

  const avg = (fn: (h: number) => number) =>
    Math.round([...Array(10)].reduce((s, _, i) => s + fn(i + 9), 0) / 10);

  const breakdown = [
    { name: 'Rain impact',   score: avg((h) => Math.max(30, Math.min(85, rainMotivation(slice.precipitation[h]))) ) },
    { name: 'Temperature',   score: avg((h) => Math.max(30, Math.min(85, tempMotivation(slice.temperature[h]))) ) },
    { name: 'Wind impact',   score: avg((h) => Math.max(30, Math.min(85, windMotivation(slice.windspeed[h]))) ) },
    { name: 'Cloud cover',   score: avg((h) => Math.max(30, Math.min(85, cloudMotivation(slice.cloudcover[h]))) ) },
  ];

  const rating = toRating(score);
  const hasRain = slice.precipitation.some((p) => p > 1);
  const description =
    score >= 70 ? (hasRain ? 'Rainy day — perfect for galleries and museums.' : 'Tough conditions outside. A great day for indoor culture.') :
    score >= 55 ? 'Good day for indoor activities — weather adds motivation.' :
    score >= 40 ? 'Okay for indoor — better options exist outside too.' :
    'Lovely day outside — save the museum for next time.';

  return { score, rating, description, bestTime: bestWindow(hourly.map((h) => h.score), 9, 19), breakdown, hourly };
}
