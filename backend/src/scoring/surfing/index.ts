import type { HourlySlice, ScorerOutput } from '../types';
import { lerp, weighted, bestWindow } from '../types';

/**
 * Surfing suitability model
 *
 * This is an evidence-informed adaptation rather than a universal
 * "good surf" formula.
 *
 * Primary sources:
 *
 * 1. Reguero et al. (2015)
 *    "Surfing wave climate variability"
 *    Global Surf Index (GSI)
 *    https://doi.org/10.1016/j.gloplacha.2014.06.006
 *
 * 2. Hutt, Black & Mead (2001)
 *    "Classification of Surf Breaks in Relation to Surfing Skill"
 *    Journal of Coastal Research, 66–81
 *    https://doi.org/10.2307/25736206
 *
 * 3. Barlow et al. (2014)
 *    "The effect of wave conditions and surfer ability on performance..."
 *    https://doi.org/10.1519/JSC.0000000000000491
 *
 * 4. Surfline's current rating methodology
 *    https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors
 *
 * IMPORTANT:
 *
 * There is no universal surf-quality curve because surf quality depends
 * heavily on the individual break, swell direction, bathymetry, tide,
 * surfer skill and board.
 *
 * Therefore:
 *
 * - wave height/period + wind form the core of the score
 * - temperature/precipitation are only comfort modifiers
 * - thresholds below are explicitly an adaptation for a generic
 *   recreational surfer, not universal physical laws
 *
 * A production system should have spot-specific configurations.
 */

const SURF_START_HOUR = 6;
const SURF_END_HOUR = 12;

/**
 * Wave-height suitability.
 *
 * WHY:
 *
 * Wave height is one of the fundamental variables used to characterize
 * surfability. Hutt et al. (2001) demonstrated that the wave height a
 * surfer can successfully ride depends strongly on surfer skill.
 *
 * Their approximate ranges:
 *
 *   Beginner:      0.70–1.00 m
 *   Learner:       0.65–1.50 m
 *   Intermediate:  0.60–2.50 m
 *   Advanced:      0.55–4.00 m
 *   Expert:        0.50 m+
 *
 * Source:
 * https://doi.org/10.2307/25736206
 *
 * We therefore do NOT assume that 1.5 m is universally "perfect".
 *
 * For this product we assume a generic recreational surfer and make
 * roughly 0.7–1.5 m the most accessible range, while still allowing
 * larger waves to score reasonably for more capable surfers.
 */
function waveHeightScore(h: number): number {
  if (h < 0.3) return 10;

  if (h < 0.5) {
    return lerp(h, 0.3, 0.5, 10, 30);
  }

  if (h < 0.7) {
    return lerp(h, 0.5, 0.7, 30, 70);
  }

  if (h <= 1.5) {
    return 100;
  }

  /*
   * 1.5–2.5 m is still within the range identified by Hutt et al.
   * for intermediate surfers, so we don't punish it heavily.
   */
  if (h <= 2.5) {
    return lerp(h, 1.5, 2.5, 100, 75);
  }

  /*
   * 2.5–4 m moves into advanced/expert territory.
   *
   * This isn't "bad surf"; it is simply less universally suitable
   * for a generic recreational surfer.
   */
  if (h <= 4.0) {
    return lerp(h, 2.5, 4.0, 75, 35);
  }

  /*
   * Hutt et al. shows that expert surfers can handle waves >4 m,
   * so this is deliberately not treated as "dangerous = 10".
   *
   * We cap the generic recreational score rather than making a
   * safety claim we cannot support.
   */
  return 20;
}

/**
 * Wave-period suitability.
 *
 * WHY:
 *
 * Wave period is physically important because it affects swell energy.
 * Surfline explicitly describes wave energy as a function of swell
 * height and period, with wave height having the larger influence.
 *
 * Research on recreational surfers also found wave period significantly
 * associated with surfing performance.
 *
 * Sources:
 * https://support.surfline.com/hc/en-us/articles/20352744481947-Wave-Energy
 * https://doi.org/10.1519/JSC.0000000000000491
 *
 * IMPORTANT:
 *
 * We do NOT use "longer period = always better".
 *
 * Very short-period waves tend to represent weaker/local wind sea.
 * Moderate-to-long swell periods generally produce more organized
 * surf, but very long periods can also produce powerful conditions.
 *
 * This is therefore a broad suitability curve, not a claim of a
 * universal optimum.
 */
function wavePeriodScore(period: number): number {
  if (period <= 0) return 0;

  if (period < 5) {
    return lerp(period, 0, 5, 0, 30);
  }

  if (period < 8) {
    return lerp(period, 5, 8, 30, 70);
  }

  if (period < 12) {
    return lerp(period, 8, 12, 70, 100);
  }

  if (period < 16) {
    return lerp(period, 12, 16, 100, 85);
  }

  /*
   * Long-period swell is not inherently bad, but it can bring
   * considerably more energy to the break.
   */
  return 80;
}

/**
 * Wind suitability.
 *
 * WHY:
 *
 * Wind is one of the core variables in the Global Surf Index.
 *
 * Surfline's automated surf rating also explicitly uses surf height
 * and wind conditions as its basic rating inputs.
 *
 * For most beach breaks, light offshore/cross-offshore wind tends to
 * produce cleaner wave faces, while stronger onshore wind produces
 * chop. However, wind DIRECTION is actually more important than speed.
 *
 * Since the current scorer only has wind speed, we cannot distinguish
 * offshore from onshore wind.
 *
 * Therefore this function measures only the "light wind" component.
 *
 * Sources:
 * https://doi.org/10.1016/j.gloplacha.2014.06.006
 * https://support.surfline.com/hc/en-us/articles/36277684017819-Surf-Ratings-Colors
 */
function windScore(windKmh: number): number {
  if (windKmh <= 10) return 100;

  if (windKmh <= 20) {
    return lerp(windKmh, 10, 20, 100, 80);
  }

  if (windKmh <= 30) {
    return lerp(windKmh, 20, 30, 80, 50);
  }

  if (windKmh <= 40) {
    return lerp(windKmh, 30, 40, 50, 20);
  }

  return 10;
}

/**
 * Air-temperature comfort modifier.
 *
 * WHY:
 *
 * Temperature is NOT a primary surf-quality variable.
 *
 * The Global Surf Index uses sea-surface temperature as a thermal
 * suitability variable, rather than air temperature.
 *
 * We only have air temperature in the current weather model, so this
 * is deliberately treated as a small comfort factor.
 *
 * A surfer wearing an appropriate wetsuit can have excellent surf
 * despite cold air temperatures.
 *
 * Therefore this function should NEVER dominate the surf score.
 */
function tempScore(t: number): number {
  if (t >= 18 && t <= 26) return 100;

  if (t >= 12 && t < 18) {
    return lerp(t, 12, 18, 60, 100);
  }

  if (t > 26 && t <= 32) {
    return lerp(t, 26, 32, 100, 70);
  }

  if (t < 12) return 50;

  return 60;
}

/**
 * Precipitation comfort modifier.
 *
 * WHY:
 *
 * Precipitation is not one of the core variables in the Global Surf
 * Index and does not determine whether a wave is surfable.
 *
 * We therefore give it a very small influence.
 *
 * Rain can reduce comfort/visibility, but:
 *
 *   rain + good swell + clean wind = still potentially excellent surf
 *
 * This is deliberately NOT:
 *
 *   rain = bad surfing
 */
function precipScore(mm: number): number {
  if (mm <= 0) return 100;

  if (mm <= 1) {
    return lerp(mm, 0, 1, 100, 90);
  }

  if (mm <= 3) {
    return lerp(mm, 1, 3, 90, 70);
  }

  if (mm <= 8) {
    return lerp(mm, 3, 8, 70, 45);
  }

  return 30;
}

/**
 * Calculate hourly surf suitability.
 *
 * WHY THESE WEIGHTS?
 *
 * There is no peer-reviewed universal set of percentages that can
 * legitimately be applied to every surf break.
 *
 * Surfline's automated rating is primarily based on surf height and
 * wind, while the Global Surf Index is explicitly multivariable.
 *
 * Therefore these weights are PROJECT ASSUMPTIONS, not research facts.
 *
 * We intentionally make:
 *
 *   Wave height     35%
 *   Wind            35%
 *   Wave period     20%
 *   Air temperature 5%
 *   Precipitation   5%
 *
 * The important research-backed decision is that wave/wind dominate.
 * The exact percentages should eventually become spot-specific or
 * learned from historical observations.
 */
function hourScore(slice: HourlySlice, h: number): number {
  if (!slice.hasMarine) return 0;

  return weighted([
    [waveHeightScore(slice.waveHeight[h]), 0.35],
    [windScore(slice.windspeed[h]),        0.35],
    [wavePeriodScore(slice.wavePeriod[h]), 0.20],
    [tempScore(slice.temperature[h]),      0.05],
    [precipScore(slice.precipitation[h]),  0.05],
  ]);
}

export function scoreSurfing(
    slice: HourlySlice,
): ScorerOutput {
  /*
   * A marine forecast is required.
   *
   * Open-Meteo provides wave height, direction and period through
   * its Marine Weather API.
   *
   * Source:
   * https://open-meteo.com/en/docs/marine-weather-api
   */
  if (!slice.hasMarine) {
    return {
      score: 0,
      rating: 'Extremely unfavorable',
      description:
          'No marine forecast is available for this location — surfing conditions cannot be evaluated.',
      bestTime: 'N/A',
      breakdown: [],
      hourly: Array.from(
          { length: 24 },
          (_, h) => ({ hour: h, score: 0 }),
      ),
    };
  }

  /*
   * We intentionally evaluate the morning session window rather
   * than averaging the whole day.
   *
   * WHY:
   *
   * The user-facing product assumes surfing primarily happens in
   * the morning / before midday.
   *
   * This is a PROJECT ASSUMPTION, not a universal research finding.
   *
   * In a production product this should be configurable because
   * local wind/tide patterns vary substantially by location.
   */
  const hourly = Array.from(
      { length: 24 },
      (_, h) => ({
        hour: h,
        score: Math.round(hourScore(slice, h)),
      }),
  );

  const sessionHours = hourly
      .slice(SURF_START_HOUR, SURF_END_HOUR);

  const score = Math.round(
      sessionHours.reduce(
          (sum, h) => sum + h.score,
          0,
      ) / sessionHours.length,
  );

  /*
   * Breakdown is calculated over the same morning session.
   *
   * This makes the displayed breakdown consistent with the score
   * rather than mixing morning surf quality with afternoon weather.
   */
  const avg = (
      fn: (hour: number) => number,
  ): number =>
      Math.round(
          [...Array(SURF_END_HOUR - SURF_START_HOUR)]
              .reduce(
                  (sum, _, i) =>
                      sum + fn(i + SURF_START_HOUR),
                  0,
              ) /
          (SURF_END_HOUR - SURF_START_HOUR),
      );

  const breakdown = [
    {
      name: 'Wave height',
      score: avg((h) =>
          waveHeightScore(slice.waveHeight[h]),
      ),
    },
    {
      name: 'Wind',
      score: avg((h) =>
          windScore(slice.windspeed[h]),
      ),
    },
    {
      name: 'Wave period',
      score: avg((h) =>
          wavePeriodScore(slice.wavePeriod[h]),
      ),
    },
    {
      name: 'Temperature',
      score: avg((h) =>
          tempScore(slice.temperature[h]),
      ),
    },
    {
      name: 'Precipitation',
      score: avg((h) =>
          precipScore(slice.precipitation[h]),
      ),
    },
  ];

  /*
   * We deliberately keep the rating generic.
   *
   * Unlike skiing, there is no universal research-backed mapping
   * from a 0–100 surf score to "Excellent / Good / Fair".
   *
   * The score itself is our normalized project metric.
   */
  const rating =
      score >= 85 ? 'Excellent' :
          score >= 70 ? 'Good' :
              score >= 50 ? 'Fair' :
                  'Poor';

  const peakWave = Math.max(
      ...slice.waveHeight.slice(
          SURF_START_HOUR,
          SURF_END_HOUR,
      ),
  );

  const description =
      score >= 85
          ? `Excellent surf potential with favorable wave and wind conditions${peakWave > 0 ? ` around ${peakWave.toFixed(1)} m` : ''}.`
          : score >= 70
              ? 'Good surf potential with generally favorable conditions.'
              : score >= 50
                  ? 'Fair surf potential — conditions may be worth checking locally.'
                  : 'Poor surf potential based on the available wave and wind forecast.';

  return {
    score,
    rating,
    description,
    bestTime: bestWindow(
        hourly.map((h) => h.score),
        SURF_START_HOUR,
        SURF_END_HOUR - 1,
    ),
    breakdown,
    hourly,
  };
}
