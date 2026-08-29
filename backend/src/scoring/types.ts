/** 24 hourly values for a single calendar day */
export interface HourlySlice {
  temperature: number[];   // °C
  precipitation: number[]; // mm
  windspeed: number[];     // km/h
  cloudcover: number[];    // %
  snowfall: number[];      // cm
  visibility: number[];    // m
  waveHeight: number[];    // m  (all zeros when no marine data)
  wavePeriod: number[];    // s
  hasMarine: boolean;
}

export interface ScoreFactor {
  name: string;
  score: number;
}

export interface ScorerOutput {
  score: number;
  rating: string;
  description: string;
  bestTime: string;
  breakdown: ScoreFactor[];
  hourly: Array<{ hour: number; score: number }>;
}

export function toRating(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/** Linear interpolation clamped to [0,100] */
export function lerp(val: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const t = Math.max(0, Math.min(1, (val - inMin) / (inMax - inMin)));
  return Math.round(outMin + t * (outMax - outMin));
}

/** Weighted average of [value, weight] pairs — weights need not sum to 1 */
export function weighted(factors: Array<[number, number]>): number {
  const totalWeight = factors.reduce((s, [, w]) => s + w, 0);
  const sum = factors.reduce((s, [v, w]) => s + v * w, 0);
  return Math.round(sum / totalWeight);
}

/** Find the best 4-hour window between startHour and endHour (inclusive) */
export function bestWindow(hourlyScores: number[], startHour = 5, endHour = 21): string {
  let best = -1;
  let bestStart = startHour;
  for (let h = startHour; h <= endHour - 3; h++) {
    const avg = (hourlyScores[h] + hourlyScores[h + 1] + hourlyScores[h + 2] + hourlyScores[h + 3]) / 4;
    if (avg > best) { best = avg; bestStart = h; }
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(bestStart)}:00–${pad(bestStart + 4)}:00`;
}
