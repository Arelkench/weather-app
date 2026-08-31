import type { HourlySlice, ScorerOutput } from '../types';
import { lerp, weighted, toRating, bestWindow } from '../types';

/**
 * Indoor Sightseeing Motivation
 *
 * This score represents motivation to choose indoor activities based on
 * outdoor weather inconvenience. It is a project-derived model.
 *
 * No equivalent published universal indoor-tourism index was identified.
 * The model is informed by outdoor tourism literature (notably HCI:Urban)
 * in the inverse direction: conditions that suppress the outdoor sightseeing
 * score increase indoor motivation. This gives the two scores a clear logical
 * relationship.
 *
 * Sources consulted:
 * HCI:Urban methodology: https://www.mdpi.com/2225-1154/11/3/48
 * Open-Meteo fields: https://open-meteo.com/en/docs
 *
 * IMPORTANT:
 * The weights and thresholds below are PROJECT ASSUMPTIONS, not published
 * research values. They are documented here so the reasoning is explicit:
 *
 *   Rain impact         45%  (rain is the primary reason tourists shift
 *                             to indoor plans — consistent with rain being
 *                             the top-cited disruptive factor in tourism
 *                             weather studies)
 *   Thermal discomfort  25%  (cold and extreme heat both motivate
 *                             seeking shelter indoors)
 *   Wind impact         20%  (strong wind is uncomfortable and can be
 *                             dangerous outdoors)
 *   Cloud cover         10%  (weakest driver — overcast ≠ reason to stay
 *                             inside; included for completeness)
 *
 * Floor: each hourly total is floored at 30. This ensures that even on
 * a beautiful day, indoor activities are never rated "bad." Museums and
 * galleries are worthwhile regardless of weather.
 *
 * Evaluation window: 09:00–19:00 (consistent with outdoor scorer).
 * Hourly scores cover all 24 hours for the UI; the daily score uses only
 * the sightseeing window.
 */

const SIGHT_START_HOUR = 9;
const SIGHT_END_HOUR = 19;

/**
 * Rain motivation.
 *
 * WHY:
 * Rain is the strongest driver of indoor motivation. It directly prevents
 * many outdoor activities and is the factor most frequently cited by
 * tourists as a reason to change outdoor plans.
 *
 * A no-rain hour scores very low (5) — it should NOT motivate going inside.
 * The score rises steeply and non-linearly with meaningful rainfall.
 *
 * Uses hourly precipitation amount (mm/h), not probability.
 *
 * Project assumption: the mm/h breakpoints are calibrated to Open-Meteo's
 * hourly precipitation field.
 */
export function precipIndoorScore(mm: number): number {
  if (mm <= 0) return 5;
  if (mm < 2) return lerp(mm, 0, 2, 5, 60);
  if (mm < 5) return lerp(mm, 2, 5, 60, 85);
  return 95;
}

/**
 * Thermal discomfort score.
 *
 * WHY:
 * This is the conceptual inverse of the outdoor `thermalComfortScore`.
 * Comfortable temperatures produce a very low indoor motivation score.
 * Cold and extreme heat both increase motivation to seek indoor shelter.
 *
 * Project approximation:
 * Uses Open-Meteo's `apparent_temperature` (same field as the outdoor
 * scorer) which already accounts for humidity and wind chill, making it
 * a better proxy for felt discomfort than raw air temperature.
 *
 * Project assumption: the exact thresholds below are adapted to the
 * apparent_temperature field. They are not derived from a published
 * thermal discomfort index.
 */
export function thermalDiscomfortScore(apparentTemp: number): number {
  if (apparentTemp < 0) return 80;
  if (apparentTemp < 10) return lerp(apparentTemp, 0, 10, 60, 25);
  if (apparentTemp < 15) return lerp(apparentTemp, 10, 15, 25, 10);
  if (apparentTemp <= 25) return 10;
  if (apparentTemp <= 32) return lerp(apparentTemp, 25, 32, 10, 50);
  if (apparentTemp <= 38) return lerp(apparentTemp, 32, 38, 50, 85);
  return 90;
}

/**
 * Wind motivation.
 *
 * WHY:
 * Strong wind makes outdoor activities uncomfortable and sometimes unsafe,
 * increasing motivation to stay indoors. Low-to-moderate wind has no
 * meaningful effect on the indoor/outdoor choice.
 *
 * Project assumption: thresholds are broadly consistent with Beaufort scale
 * comfort classifications but are adapted to Open-Meteo's windspeed_10m
 * field (km/h).
 */
export function windIndoorScore(windKmh: number): number {
  if (windKmh < 20) return 10;
  if (windKmh < 40) return lerp(windKmh, 20, 40, 10, 55);
  if (windKmh < 60) return lerp(windKmh, 40, 60, 55, 80);
  return 90;
}

/**
 * Cloud cover motivation.
 *
 * WHY:
 * Cloud cover is the weakest driver of indoor motivation (10% weight).
 * An overcast sky does not, by itself, compel tourists to go inside —
 * it is mainly a mild indicator that outdoor scenery is less appealing.
 *
 * The curve is deliberately flat at the high end.
 *
 * Project assumption: the contribution of cloud cover to indoor motivation
 * is a project-level judgment call. No direct equivalent is found in the
 * published tourism weather literature.
 */
export function cloudIndoorScore(cloudPct: number): number {
  if (cloudPct < 30) return 10;
  if (cloudPct < 70) return lerp(cloudPct, 30, 70, 10, 40);
  return 55;
}

function rawHourScore(slice: HourlySlice, h: number): number {
  return weighted([
    [precipIndoorScore(slice.precipitation[h]),             0.45],
    [thermalDiscomfortScore(slice.apparentTemperature[h]),  0.25],
    [windIndoorScore(slice.windspeed[h]),                   0.20],
    [cloudIndoorScore(slice.cloudcover[h]),                 0.10],
  ]);
}

export function scoreIndoor(slice: HourlySlice): ScorerOutput {
  /*
   * The floor (30) is applied to each hourly total, NOT to individual
   * components. Breakdown values therefore show the raw component score,
   * keeping the breakdown consistent with the actual conditions.
   *
   * The floor exists because indoor attractions remain worthwhile even when
   * all outdoor conditions are excellent.
   */
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    score: Math.max(30, rawHourScore(slice, h)),
  }));

  const sightingHours = SIGHT_END_HOUR - SIGHT_START_HOUR;

  const score = Math.round(
    hourly
      .slice(SIGHT_START_HOUR, SIGHT_END_HOUR)
      .reduce((sum, h) => sum + h.score, 0) / sightingHours,
  );

  const avg = (fn: (h: number) => number): number =>
    Math.round(
      [...Array(sightingHours)].reduce((s, _, i) => s + fn(i + SIGHT_START_HOUR), 0) / sightingHours,
    );

  const breakdown = [
    { name: 'Rain impact',        score: avg((h) => precipIndoorScore(slice.precipitation[h])) },
    { name: 'Thermal discomfort', score: avg((h) => thermalDiscomfortScore(slice.apparentTemperature[h])) },
    { name: 'Wind impact',        score: avg((h) => windIndoorScore(slice.windspeed[h])) },
    { name: 'Cloud cover',        score: avg((h) => cloudIndoorScore(slice.cloudcover[h])) },
  ];

  const rating = toRating(score);

  const hasRain = slice.precipitation
    .slice(SIGHT_START_HOUR, SIGHT_END_HOUR)
    .some((p) => p > 1);

  const description =
    score >= 70 && hasRain
      ? 'Heavy rain makes indoor museums and galleries a particularly good choice today.'
      : score >= 70
        ? 'Extreme outdoor conditions make indoor venues a much more comfortable alternative.'
        : score >= 55
          ? 'A good day for indoor activities — outdoor conditions have their limitations.'
          : score >= 40
            ? 'Indoor and outdoor are both viable — check the specific conditions before deciding.'
            : 'A beautiful day outside — save the galleries for when the weather turns.';

  return {
    score,
    rating,
    description,
    bestTime: bestWindow(hourly.map((h) => h.score), SIGHT_START_HOUR, SIGHT_END_HOUR - 1),
    breakdown,
    hourly,
  };
}
