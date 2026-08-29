import type { HourlySlice, ScorerOutput } from './types';
import { lerp, weighted, toRating, bestWindow } from './types';

function tempScore(t: number): number {
  if (t < 0) return 10;
  if (t < 10) return lerp(t, 0, 10, 10, 55);
  if (t < 18) return lerp(t, 10, 18, 55, 95);
  if (t < 25) return lerp(t, 18, 25, 95, 100); // ideal band
  if (t < 32) return lerp(t, 25, 32, 100, 50);
  return 20;                                     // very hot
}

function precipScore(p: number): number {
  if (p <= 0) return 100;
  if (p < 1) return lerp(p, 0, 1, 100, 60);
  if (p < 3) return lerp(p, 1, 3, 60, 20);
  return 5;
}

function cloudScore(c: number): number {
  if (c < 20) return 90;       // bright sun — slightly less than partly cloudy for glare/heat
  if (c < 45) return 100;      // partly cloudy — most scenic
  if (c < 70) return lerp(c, 45, 70, 100, 60);
  if (c < 90) return lerp(c, 70, 90, 60, 25);
  return 15;
}

function windScore(w: number): number {
  if (w < 10) return 100;
  if (w < 25) return lerp(w, 10, 25, 100, 70);
  if (w < 50) return lerp(w, 25, 50, 70, 25);
  return 10;
}

function hourScore(slice: HourlySlice, h: number): number {
  return weighted([
    [tempScore(slice.temperature[h]),    0.30],
    [precipScore(slice.precipitation[h]), 0.30],
    [cloudScore(slice.cloudcover[h]),    0.20],
    [windScore(slice.windspeed[h]),      0.20],
  ]);
}

export function scoreOutdoor(slice: HourlySlice): ScorerOutput {
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, score: hourScore(slice, h) }));
  const dayHours = hourly.slice(9, 19).map((h) => h.score);
  const score = Math.round(dayHours.reduce((a, b) => a + b, 0) / dayHours.length);

  const avg = (fn: (h: number) => number) =>
    Math.round([...Array(10)].reduce((s, _, i) => s + fn(i + 9), 0) / 10);

  const breakdown = [
    { name: 'Temperature',   score: avg((h) => tempScore(slice.temperature[h])) },
    { name: 'Sun / Clouds',  score: avg((h) => cloudScore(slice.cloudcover[h])) },
    { name: 'Wind',          score: avg((h) => windScore(slice.windspeed[h])) },
    { name: 'Precipitation', score: avg((h) => precipScore(slice.precipitation[h])) },
  ];

  const rating = toRating(score);
  const description =
    score >= 80 ? 'Pleasant and mostly sunny — a great day to explore.' :
    score >= 60 ? 'Good conditions for sightseeing with minor caveats.' :
    score >= 40 ? 'Okay day — dress for the weather and plan accordingly.' :
    'Challenging outdoor conditions. Plan for shorter outings.';

  return { score, rating, description, bestTime: bestWindow(hourly.map((h) => h.score), 9, 19), breakdown, hourly };
}
