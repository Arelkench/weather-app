import type { HourlySlice, ScorerOutput } from './types';
import { weighted, bestWindow } from './types';

/**
 * Skiing Utility Index (SUI)
 *
 * Based primarily on:
 * Kapetanakis et al. (2022),
 * "Weather Preferences for Ski Tourism: An Empirical Study
 * on the Largest Ski Resort in Greece"
 *
 * DOI: 10.3390/atmos13101569
 *
 * The study surveyed 111 skiers and derived empirical utility
 * functions + weights for four weather variables:
 *
 *   Snowfall duration  30.3%
 *   Wind               27.9%
 *   Temperature        22.2%
 *   Cloud cover        19.4%
 *
 * The original SUI is a DAILY index. We adapt it to Open-Meteo's
 * hourly forecast by:
 *
 *   1. evaluating the relevant skiing period (10:00–15:00)
 *   2. deriving snowfall duration from hourly snowfall
 *   3. calculating the weather utility for each hour
 *   4. aggregating the relevant hourly conditions into a daily score
 *
 * Source:
 * https://doi.org/10.3390/atmos13101569
 */

const SKI_START_HOUR = 10;
const SKI_END_HOUR = 15;

/**
 * Maximum apparent temperature during the ski window that still allows skiing
 * when there is no snowfall at all.
 *
 * WHY 3°C:
 * Above this threshold without any snowfall, snow-covered slopes are physically
 * implausible (melting/icy/absent). The SUI research model assumes an existing
 * ski-resort base layer, so we guard the entry point rather than letting the
 * polynomial produce a high snowfall-utility score for a tropical beach.
 */
const MAX_VIABLE_TEMP_NO_SNOW_CELSIUS = 3;

/**
 * Snowfall utility.
 *
 * WHY:
 * The research found snowfall duration to be the MOST IMPORTANT
 * weather variable for skiers (30.3% weight).
 *
 * Importantly, the research does NOT say "more snow = better".
 * Skiers preferred approximately 1–2 HOURS of snowfall per day.
 * Longer snowfall progressively became less desirable because
 * heavy/prolonged snowfall reduces visibility and makes skiing
 * more difficult.
 *
 * The paper fitted a 3rd-degree polynomial:
 *
 *   U = 98.05 + 6.39S - 9.03S² + 0.81S³
 *
 * for S <= 5 hours.
 *
 * We use that published function directly and clamp the result
 * to [0, 100].
 *
 * Source:
 * Kapetanakis et al. (2022), Section 4.3.2
 * DOI: 10.3390/atmos13101569
 */
function snowfallDurationScore(hours: number): number {
  if (hours <= 0) {
    // The research shows that some skiers actually considered
    // zero snowfall unacceptable, but zero snowfall is not
    // automatically a bad ski day. We therefore evaluate it
    // using the empirical function rather than assigning 0.
    return 98;
  }

  if (hours >= 5) {
    // The published utility function is only defined up to 5h.
    // At/above 5h the empirical utility is effectively very low.
    return 0;
  }

  const score =
      98.05 +
      6.39 * hours -
      9.03 * hours ** 2 +
      0.81 * hours ** 3;

  return Math.max(0, Math.min(100, score));
}

/**
 * Temperature utility.
 *
 * WHY:
 * The study found ~0°C to be the most preferred skiing temperature.
 *
 * Observed boundaries:
 *   -12°C → unacceptable cold
 *    0°C  → most preferred
 *   +10°C → unacceptable hot
 *
 * The paper fitted a Generalized Extreme Value distribution rather
 * than a simple linear function.
 *
 * We use the published parameters below.
 *
 * Source:
 * Kapetanakis et al. (2022), Section 4.3.1, Equation 22
 * DOI: 10.3390/atmos13101569
 */
function tempScore(t: number): number {
  const C = 0.34;
  const LOC = 1.45;
  const SIGMA = 4.6;

  // The empirical function is explicitly valid only between
  // -12°C and +10°C.
  if (t <= -12 || t >= 10) return 0;

  const gamma = 1 - C * ((t - LOC) / SIGMA);

  // Numerical safety outside the valid mathematical domain.
  if (gamma <= 0) return 0;

  const score =
      (1174.06 / C) *
      Math.exp(-Math.pow(gamma, 1 / C)) *
      Math.pow(gamma, 1 / C - 1);

  return Math.max(0, Math.min(100, score));
}

/**
 * Wind utility.
 *
 * WHY:
 * Wind is the second most important variable in the study (27.9%).
 *
 * The research found:
 *   0–3.3 m/s → ideal
 *
 * and the empirical utility approaches zero around:
 *   20 m/s
 *
 * Wind matters because it affects skier stability, perceived comfort,
 * visibility from blowing snow, and potentially lift operations.
 *
 * IMPORTANT:
 * Open-Meteo gives wind speed in km/h in this model, while the
 * research uses m/s, so we convert km/h → m/s first.
 *
 * Source:
 * Kapetanakis et al. (2022), Section 4.3.4, Equation 25
 * DOI: 10.3390/atmos13101569
 */
function windScore(windKmh: number): number {
  const windMs = windKmh / 3.6;

  if (windMs >= 20) return 0;

  // Published empirical polynomial:
  //
  // U = 104.37 - 6.78W - 0.19W² + 0.01W³
  //
  // where W is wind speed in m/s.
  const score =
      104.37 -
      6.78 * windMs -
      0.19 * windMs ** 2 +
      0.01 * windMs ** 3;

  return Math.max(0, Math.min(100, score));
}

/**
 * Cloud-cover utility.
 *
 * WHY:
 * The study specifically measured CLOUD COVER rather than
 * visibility. It found:
 *
 *   0–25% → ideal for ~90% of respondents
 *   50%   → considerably less desirable
 *   75%   → mostly unacceptable
 *   100%  → ~99% considered unacceptable
 *
 * The researchers fitted a second-degree polynomial:
 *
 *   U = 99.44 - 0.24C - 0.02C²
 *
 * where C is cloud cover in percent.
 *
 * Source:
 * Kapetanakis et al. (2022), Section 4.3.3, Equation 24
 * DOI: 10.3390/atmos13101569
 */
function cloudScore(cloudCover: number): number {
  const score =
      99.44 -
      0.24 * cloudCover -
      0.02 * cloudCover ** 2;

  return Math.max(0, Math.min(100, score));
}

/**
 * Count hours with meaningful snowfall during the skiing period.
 *
 * WHY:
 * The research variable is "snowfall duration" rather than
 * snowfall quantity.
 *
 * Open-Meteo exposes snowfall as an hourly measurement, so the
 * closest available representation is the number of skiing-period
 * hours with measurable snowfall.
 *
 * This is an adaptation of the research methodology to the API,
 * not a claim that the original study used Open-Meteo.
 */
function snowfallDuration(
    snowfall: number[],
): number {
  return snowfall
      .slice(SKI_START_HOUR, SKI_END_HOUR)
      .filter((cm) => cm > 0)
      .length;
}

/**
 * Convert the SUI numerical score into the classification used
 * by the original paper.
 *
 * Source:
 * Kapetanakis et al. (2022), Table 2
 * DOI: 10.3390/atmos13101569
 */
function skiingRating(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very good';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Acceptable';
  if (score >= 30) return 'Unfavorable';
  if (score >= 20) return 'Very unfavorable';
  return 'Extremely unfavorable';
}

/**
 * Calculate the Skiing Utility Index for one day.
 */
export function scoreSkiing(slice: HourlySlice): ScorerOutput {
  /*
   * The SUI model assumes you are already at a ski resort with a packed
   * base layer. It was not designed to answer "can you ski here at all?"
   *
   * Guard: if the peak temperature during the skiing period is above 3°C
   * AND there is no snowfall in the entire day, skiing is physically
   * implausible (no snow-covered slopes). Return 0 with an explanation
   * rather than applying the research model, which would give a tropical
   * beach a high snowfall score (0 fresh-snow hours = 98 by the polynomial).
   */
  const peakSkiTemp = Math.max(...slice.temperature.slice(SKI_START_HOUR, SKI_END_HOUR));
  const anySnow = slice.snowfall.some((cm) => cm > 0);

  if (peakSkiTemp > MAX_VIABLE_TEMP_NO_SNOW_CELSIUS && !anySnow) {
    return {
      score: 0,
      rating: 'Extremely unfavorable',
      description: 'Temperatures are too warm and there is no snowfall — skiing is not viable here.',
      bestTime: 'N/A',
      breakdown: [],
      hourly: Array.from({ length: 24 }, (_, h) => ({ hour: h, score: 0 })),
    };
  }

  /*
   * The original research found that most respondents ski between
   * 10:00 and 15:00.
   *
   * We therefore don't give 02:00 weather the same importance as
   * conditions during the actual skiing period.
   *
   * Source:
   * Kapetanakis et al. (2022), Section 4.3.1
   */
  const skiingHours = Array.from(
      { length: SKI_END_HOUR - SKI_START_HOUR },
      (_, i) => SKI_START_HOUR + i,
  );

  /*
   * Snowfall is a DAILY variable in the research.
   *
   * We derive its duration from the hourly Open-Meteo data and
   * apply that daily utility to the skiing period.
   */
  const snowfallHours = snowfallDuration(slice.snowfall);
  const snowScore = snowfallDurationScore(snowfallHours);

  /*
   * Calculate the SUI for each relevant hour.
   *
   * Snowfall duration is intentionally repeated because it represents
   * the day's snowfall-duration utility, while temperature, wind and
   * cloud cover vary hourly.
   */
  const hourly = Array.from({ length: 24 }, (_, h) => {
    const score = weighted([
      [snowScore, 0.303],
      [windScore(slice.windspeed[h]), 0.279],
      [tempScore(slice.temperature[h]), 0.222],
      [cloudScore(slice.cloudcover[h]), 0.194],
    ]);

    return {
      hour: h,
      score: Math.round(score),
    };
  });

  /*
   * The final daily score is the mean SUI during the actual
   * skiing period (10:00–15:00), rather than the entire 24 hours.
   */
  const skiingScores = skiingHours.map((h) => hourly[h].score);

  const score = Math.round(
      skiingScores.reduce((sum, value) => sum + value, 0) /
      skiingScores.length,
  );

  /*
   * Breakdown uses the SAME research weights and the same
   * skiing-period aggregation as the total score.
   */
  const average = (
      fn: (hour: number) => number,
  ): number =>
      Math.round(
          skiingHours.reduce(
              (sum, hour) => sum + fn(hour),
              0,
          ) / skiingHours.length,
      );

  const breakdown = [
    {
      name: 'Snowfall',
      score: snowScore,
    },
    {
      name: 'Wind',
      score: average((h) =>
          windScore(slice.windspeed[h]),
      ),
    },
    {
      name: 'Temperature',
      score: average((h) =>
          tempScore(slice.temperature[h]),
      ),
    },
    {
      name: 'Cloud cover',
      score: average((h) =>
          cloudScore(slice.cloudcover[h]),
      ),
    },
  ];

  const rating = skiingRating(score);

  const description =
      score >= 80
          ? 'Excellent skiing weather with conditions close to skiers’ preferred ranges.'
          : score >= 70
              ? 'Very good skiing conditions with mostly favorable weather.'
              : score >= 60
                  ? 'Good skiing conditions with some less favorable weather.'
                  : score >= 40
                      ? 'Acceptable skiing conditions with noticeable weather limitations.'
                      : score >= 30
                          ? 'Unfavorable skiing conditions.'
                          : 'Very unfavorable skiing weather.';

  return {
    score,
    rating,
    description,
    bestTime: bestWindow(
        hourly.map((h) => h.score),
        SKI_START_HOUR,
        SKI_END_HOUR - 1,
    ),
    breakdown,
    hourly,
  };
}