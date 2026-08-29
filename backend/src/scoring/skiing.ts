import type { HourlySlice, ScorerOutput } from './types';
import { lerp, weighted, toRating, bestWindow } from './types';

function snowScore(cm: number): number {
  // Daily snowfall for the day (we use the max hourly value * 24 as proxy,
  // but here we receive hourly snowfall in cm — use as-is per hour)
  if (cm <= 0) return 20;          // base layer assumed; no fresh snow
  if (cm < 1) return lerp(cm, 0, 1, 20, 60);
  if (cm < 3) return lerp(cm, 1, 3, 60, 90);
  return 100;                      // heavy snowfall = powder day
}

function tempScore(t: number): number {
  if (t > 2) return 15;            // above freezing = wet/icy
  if (t > -2) return lerp(t, -2, 2, 45, 15);
  if (t > -10) return lerp(t, -10, -2, 100, 45); // sweet spot around -5 to -10
  if (t > -20) return lerp(t, -20, -10, 65, 100);
  return 50;                       // very cold but still skiable
}

function windScore(w: number): number {
  if (w < 20) return 100;
  if (w < 40) return lerp(w, 20, 40, 100, 55);
  if (w < 60) return lerp(w, 40, 60, 55, 20);
  return 10;                       // lift-closing winds
}

function visibilityScore(v: number): number {
  if (v > 10000) return 100;
  if (v > 3000) return lerp(v, 3000, 10000, 65, 100);
  if (v > 1000) return lerp(v, 1000, 3000, 25, 65);
  return 10;                       // whiteout
}

function hourScore(slice: HourlySlice, h: number): number {
  return weighted([
    [snowScore(slice.snowfall[h]),     0.35],
    [tempScore(slice.temperature[h]),  0.25],
    [windScore(slice.windspeed[h]),    0.20],
    [visibilityScore(slice.visibility[h]), 0.20],
  ]);
}

export function scoreSkiing(slice: HourlySlice): ScorerOutput {
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, score: hourScore(slice, h) }));
  const dayHours = hourly.slice(8, 18).map((h) => h.score);
  const score = Math.round(dayHours.reduce((a, b) => a + b, 0) / dayHours.length);

  const avg = (fn: (h: number) => number) =>
    Math.round([...Array(10)].reduce((s, _, i) => s + fn(i + 8), 0) / 10);

  const breakdown = [
    { name: 'Snow conditions', score: avg((h) => snowScore(slice.snowfall[h])) },
    { name: 'Temperature',     score: avg((h) => tempScore(slice.temperature[h])) },
    { name: 'Wind',            score: avg((h) => windScore(slice.windspeed[h])) },
    { name: 'Visibility',      score: avg((h) => visibilityScore(slice.visibility[h])) },
  ];

  const rating = toRating(score);
  const hasFreshSnow = slice.snowfall.some((s) => s > 0.5);
  const description =
    score >= 80 ? (hasFreshSnow ? 'Powder day — fresh snow and good conditions.' : 'Excellent conditions on the mountain.') :
    score >= 60 ? 'Good skiing with decent conditions.' :
    score >= 40 ? 'Fair — worth going but expect some challenges.' :
    'Poor conditions. Check lift status before heading out.';

  return { score, rating, description, bestTime: bestWindow(hourly.map((h) => h.score), 8, 17), breakdown, hourly };
}
