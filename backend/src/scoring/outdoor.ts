import type { HourlySlice, ScorerOutput } from './types';
import { lerp, weighted, toRating, bestWindow } from './types';

/**
 * Outdoor Sightseeing Suitability
 *
 * Based on the structure of the Holiday Climate Index for Urban Tourism
 * (HCI:Urban), which weights four components into a 0–100 index:
 *
 *   Thermal comfort    40%   (largest factor — daytime tourist comfort)
 *   Precipitation      30%
 *   Aesthetics / cloud 20%
 *   Wind               10%
 *
 * Sources:
 * Dubois et al. (2016), "A Climate Change Vulnerability and Adaptation
 * Assessment for Tourism"
 * https://www.mdpi.com/2225-1154/11/3/48
 *
 * HCI:Urban vs TCI comparison:
 * https://www.mdpi.com/2073-4433/11/4/412
 *
 * IMPORTANT:
 * The scoring curves below are PROJECT ADAPTATIONS to Open-Meteo's hourly
 * data. They follow the HCI:Urban component structure and weight rationale,
 * but the exact °C / mm / % thresholds are NOT the verbatim HCI tables.
 * Where the research does not provide a directly usable threshold, this is
 * explicitly labelled as a project assumption.
 *
 * Evaluation window: 09:00–19:00 (10 hours)
 * Consistent with HCI:Urban's focus on daytime tourist activity.
 * Hourly scores are computed for all 24 hours (the UI needs them), but
 * the daily suitability score is averaged only over the sightseeing window.
 */

const SIGHT_START_HOUR = 9;
const SIGHT_END_HOUR = 19;

/**
 * Thermal comfort score.
 *
 * WHY:
 * HCI:Urban assigns thermal comfort the highest weight (40%) because it is
 * the factor tourists most frequently cite as a reason to change plans or
 * feel uncomfortable outdoors.
 *
 * Project approximation:
 * Open-Meteo's `apparent_temperature` field is used as a practical proxy
 * for HCI:Urban's thermal comfort component. It combines air temperature,
 * relative humidity, wind speed and solar radiation into a single perceived-
 * temperature value, making it closer to the Physiological Equivalent
 * Temperature (PET) scale that HCI:Urban uses than raw air temperature.
 *
 * Source (apparent_temperature definition):
 * https://open-meteo.com/en/docs
 *
 * The thresholds below are adapted from HCI comfort rating categories:
 *
 *   < 0°C  → Very cold    (HCI: "Unfavorable")
 *   0–10°C → Cold         (HCI: "Unfavorable" to "Acceptable")
 *  10–18°C → Cool         (HCI: "Acceptable" to "Good")
 *  18–24°C → Comfortable  (HCI: "Ideal")
 *  24–30°C → Warm         (HCI: "Good" declining)
 *  30–36°C → Hot          (HCI: "Unfavorable")
 *   > 36°C → Very hot     (HCI: "Extremely unfavorable")
 *
 * Project assumption: the exact °C values are adapted to apparent
 * temperature rather than the PET scale used in the published HCI tables.
 */
export function thermalComfortScore(apparentTemp: number): number {
  if (apparentTemp < 0) return 10;
  if (apparentTemp < 10) return lerp(apparentTemp, 0, 10, 10, 40);
  if (apparentTemp < 18) return lerp(apparentTemp, 10, 18, 40, 85);
  if (apparentTemp <= 24) return 100;
  if (apparentTemp <= 30) return lerp(apparentTemp, 24, 30, 100, 70);
  if (apparentTemp <= 36) return lerp(apparentTemp, 30, 36, 70, 20);
  return 10;
}

/**
 * Precipitation score.
 *
 * WHY:
 * Precipitation is HCI:Urban's second-largest component (30%).
 * Rain directly prevents or significantly degrades outdoor sightseeing and
 * is consistently the top complaint among tourists in survey studies.
 *
 * This function uses hourly precipitation AMOUNT (mm/h), not probability.
 *
 * Project assumption: the mm/h thresholds are adapted to Open-Meteo's
 * hourly precipitation field. HCI:Urban formulations sometimes use daily
 * totals — the shape of the curve is the same, but the per-hour thresholds
 * are a project-level adaptation.
 */
export function precipScore(mm: number): number {
  if (mm <= 0) return 100;
  if (mm < 1) return lerp(mm, 0, 1, 100, 60);
  if (mm < 3) return lerp(mm, 1, 3, 60, 20);
  return 5;
}

/**
 * Cloud cover / aesthetics score.
 *
 * WHY:
 * HCI:Urban includes an "aesthetics" component (20%) that captures the
 * effect of sunshine and cloud cover on scenic enjoyment and overall
 * outdoor experience quality.
 *
 * The curve is deliberately non-linear: a moderate amount of cloud
 * (20–45%) is often more scenic and comfortable than fully clear skies,
 * which bring glare and peak afternoon heat. This is consistent with
 * HCI aesthetics interpretation and common tourist survey findings.
 *
 * Project assumption: the exact cloud-cover % thresholds are a project
 * adaptation. HCI:Urban's aesthetics component primarily uses sunshine-
 * hours (not hourly cloud cover percentage), so this is an approximation.
 */
export function cloudScore(cloudPct: number): number {
  if (cloudPct < 20) return 90;     // very sunny — slight glare/heat penalty
  if (cloudPct < 45) return 100;    // partly cloudy — most scenic
  if (cloudPct < 70) return lerp(cloudPct, 45, 70, 100, 60);
  if (cloudPct < 90) return lerp(cloudPct, 70, 90, 60, 25);
  return 15;                        // fully overcast
}

/**
 * Wind score.
 *
 * WHY:
 * HCI:Urban assigns wind the smallest weight (10%), reflecting that
 * moderate wind is rarely the primary reason tourists change their plans.
 *
 * Strong wind still reduces outdoor comfort meaningfully (especially
 * combined with cold or rain), so a non-linear penalty is applied above
 * 25 km/h.
 *
 * Project assumption: km/h thresholds are adapted to Open-Meteo's
 * windspeed_10m field.
 */
export function windScore(windKmh: number): number {
  if (windKmh < 10) return 100;
  if (windKmh < 25) return lerp(windKmh, 10, 25, 100, 70);
  if (windKmh < 50) return lerp(windKmh, 25, 50, 70, 25);
  return 10;
}

function hourScore(slice: HourlySlice, h: number): number {
  return weighted([
    [thermalComfortScore(slice.apparentTemperature[h]), 0.40],
    [precipScore(slice.precipitation[h]),               0.30],
    [cloudScore(slice.cloudcover[h]),                   0.20],
    [windScore(slice.windspeed[h]),                     0.10],
  ]);
}

export function scoreOutdoor(slice: HourlySlice): ScorerOutput {
  const hourly = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    score: hourScore(slice, h),
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
    { name: 'Thermal comfort', score: avg((h) => thermalComfortScore(slice.apparentTemperature[h])) },
    { name: 'Precipitation',   score: avg((h) => precipScore(slice.precipitation[h])) },
    { name: 'Sun / Clouds',    score: avg((h) => cloudScore(slice.cloudcover[h])) },
    { name: 'Wind',            score: avg((h) => windScore(slice.windspeed[h])) },
  ];

  const rating = toRating(score);

  const description =
    score >= 80
      ? 'Pleasant conditions with comfortable temperatures and little rain — a great day to explore.'
      : score >= 60
        ? 'Good conditions for sightseeing — some weather limitations but generally comfortable.'
        : score >= 40
          ? 'Mixed outdoor conditions. Dress for the weather and plan for shorter outings.'
          : 'Difficult outdoor conditions today. Indoor alternatives may be more comfortable.';

  return {
    score,
    rating,
    description,
    bestTime: bestWindow(hourly.map((h) => h.score), SIGHT_START_HOUR, SIGHT_END_HOUR - 1),
    breakdown,
    hourly,
  };
}
