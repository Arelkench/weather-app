import type { HourlySlice, ScorerOutput } from './types';
import { lerp, weighted, toRating, bestWindow } from './types';

function waveHeightScore(h: number): number {
  if (h < 0.3) return 5;                      // flat
  if (h < 0.8) return lerp(h, 0.3, 0.8, 20, 60);
  if (h < 1.5) return lerp(h, 0.8, 1.5, 60, 100); // sweet spot
  if (h < 2.5) return lerp(h, 1.5, 2.5, 100, 65);
  if (h < 4.0) return lerp(h, 2.5, 4.0, 65, 20); // getting big
  return 10;                                    // dangerous
}

function wavePeriodScore(p: number): number {
  if (p <= 0) return 0;
  if (p < 6) return lerp(p, 0, 6, 10, 35);
  if (p < 10) return lerp(p, 6, 10, 35, 80);
  if (p < 15) return lerp(p, 10, 15, 80, 100);
  return 100;
}

function windScore(w: number): number {
  if (w < 10) return 100;
  if (w < 25) return lerp(w, 10, 25, 100, 65);
  if (w < 50) return lerp(w, 25, 50, 65, 20);
  return 10;
}

function precipScore(p: number): number {
  if (p <= 0) return 100;
  if (p < 3) return lerp(p, 0, 3, 100, 40);
  return 20;
}

function tempScore(t: number): number {
  if (t >= 22) return 100;
  if (t >= 15) return lerp(t, 15, 22, 70, 100);
  if (t >= 8) return lerp(t, 8, 15, 40, 70);
  return 30;
}

function hourScore(slice: HourlySlice, h: number): number {
  if (!slice.hasMarine) return 0;
  return weighted([
    [waveHeightScore(slice.waveHeight[h]), 0.30],
    [wavePeriodScore(slice.wavePeriod[h]), 0.25],
    [windScore(slice.windspeed[h]),        0.25],
    [precipScore(slice.precipitation[h]),  0.10],
    [tempScore(slice.temperature[h]),      0.10],
  ]);
}

export function scoreSurfing(slice: HourlySlice): ScorerOutput {
  if (!slice.hasMarine) {
    return {
      score: 0,
      rating: 'Poor',
      description: 'No coastal wave data — surfing requires ocean access.',
      bestTime: 'N/A',
      breakdown: [],
      hourly: Array.from({ length: 24 }, (_, h) => ({ hour: h, score: 0 })),
    };
  }

  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, score: hourScore(slice, h) }));

  // Daily aggregates — use daytime hours 6-20 for breakdown factors
  const dayHours = hourly.slice(6, 21).map((h) => h.score);
  const score = Math.round(dayHours.reduce((a, b) => a + b, 0) / dayHours.length);

  // Breakdown: average of each factor over daylight hours
  const avg = (fn: (h: number) => number) =>
    Math.round([...Array(15)].reduce((s, _, i) => s + fn(i + 6), 0) / 15);

  const breakdown = [
    { name: 'Wave quality', score: avg((h) => waveHeightScore(slice.waveHeight[h])) },
    { name: 'Wave period',  score: avg((h) => wavePeriodScore(slice.wavePeriod[h])) },
    { name: 'Wind',         score: avg((h) => windScore(slice.windspeed[h])) },
    { name: 'Precipitation', score: avg((h) => precipScore(slice.precipitation[h])) },
    { name: 'Temperature',  score: avg((h) => tempScore(slice.temperature[h])) },
  ];

  const rating = toRating(score);
  const peakWave = Math.max(...slice.waveHeight.slice(5, 12));
  const description =
    score >= 80 ? `Great waves${peakWave > 1 ? ` up to ${peakWave.toFixed(1)} m` : ''} with light winds.` :
    score >= 60 ? 'Decent conditions, worth paddling out.' :
    score >= 40 ? 'Small or choppy — manageable for beginners.' :
    'Poor surf conditions today.';

  return { score, rating, description, bestTime: bestWindow(hourly.map((h) => h.score), 5, 18), breakdown, hourly };
}
