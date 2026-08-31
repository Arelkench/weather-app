import { describe, it, expect } from 'vitest';
import type { HourlySlice } from '../types';
import {
  precipIndoorScore,
  thermalDiscomfortScore,
  windIndoorScore,
  cloudIndoorScore,
  scoreIndoor,
} from '.';

function makeSlice(overrides: Partial<HourlySlice> = {}): HourlySlice {
  return {
    temperature:          new Array(24).fill(20),
    apparentTemperature:  new Array(24).fill(20),
    precipitation:        new Array(24).fill(0),
    windspeed:            new Array(24).fill(5),
    cloudcover:           new Array(24).fill(25),
    snowfall:             new Array(24).fill(0),
    visibility:           new Array(24).fill(10000),
    waveHeight:           new Array(24).fill(0),
    wavePeriod:           new Array(24).fill(0),
    hasMarine:            false,
    ...overrides,
  };
}

// ── Component: precipIndoorScore ──────────────────────────────────────────────

describe('precipIndoorScore', () => {
  it('scores very low with no rain (rain should not motivate going inside)', () => {
    expect(precipIndoorScore(0)).toBeLessThan(10);
  });

  it('gives a moderate score for light rain (1.5 mm/h)', () => {
    const s = precipIndoorScore(1.5);
    expect(s).toBeGreaterThan(10);
    expect(s).toBeLessThan(80);
  });

  it('gives a high score for heavy rain (8 mm/h)', () => {
    expect(precipIndoorScore(8)).toBeGreaterThan(85);
  });

  it('increases monotonically with precipitation', () => {
    expect(precipIndoorScore(1)).toBeGreaterThan(precipIndoorScore(0));
    expect(precipIndoorScore(3)).toBeGreaterThan(precipIndoorScore(1));
    expect(precipIndoorScore(8)).toBeGreaterThan(precipIndoorScore(3));
  });
});

// ── Component: thermalDiscomfortScore ─────────────────────────────────────────

describe('thermalDiscomfortScore', () => {
  it('scores low at comfortable apparent temperature (20°C)', () => {
    expect(thermalDiscomfortScore(20)).toBe(10);
  });

  it('scores high when very cold (below 0°C)', () => {
    expect(thermalDiscomfortScore(-10)).toBeGreaterThan(60);
  });

  it('scores high when very hot (above 38°C)', () => {
    expect(thermalDiscomfortScore(40)).toBeGreaterThan(85);
  });

  it('very cold is more discomforting than slightly cold', () => {
    expect(thermalDiscomfortScore(-10)).toBeGreaterThan(thermalDiscomfortScore(5));
  });

  it('very hot is more discomforting than warm', () => {
    expect(thermalDiscomfortScore(40)).toBeGreaterThan(thermalDiscomfortScore(28));
  });
});

// ── Component: windIndoorScore ────────────────────────────────────────────────

describe('windIndoorScore', () => {
  it('scores low in calm conditions (10 km/h)', () => {
    expect(windIndoorScore(10)).toBeLessThan(15);
  });

  it('scores high in strong wind (70 km/h)', () => {
    expect(windIndoorScore(70)).toBeGreaterThan(80);
  });

  it('increases as wind speed increases', () => {
    expect(windIndoorScore(30)).toBeGreaterThan(windIndoorScore(10));
    expect(windIndoorScore(70)).toBeGreaterThan(windIndoorScore(30));
  });
});

// ── Component: cloudIndoorScore ───────────────────────────────────────────────

describe('cloudIndoorScore', () => {
  it('scores low with clear skies (10%)', () => {
    expect(cloudIndoorScore(10)).toBeLessThan(15);
  });

  it('never exceeds 55 even when fully overcast', () => {
    expect(cloudIndoorScore(100)).toBeLessThanOrEqual(55);
  });
});

// ── scoreIndoor: floor and evaluation window ──────────────────────────────────

describe('scoreIndoor', () => {
  it('stays near the floor (~30) on a beautiful outdoor day', () => {
    const slice = makeSlice({
      apparentTemperature: new Array(24).fill(22), // comfortable
      precipitation:       new Array(24).fill(0),  // no rain
      windspeed:           new Array(24).fill(5),  // calm
      cloudcover:          new Array(24).fill(15), // mostly sunny
    });
    expect(scoreIndoor(slice).score).toBeLessThanOrEqual(35);
  });

  it('moderate rain (2 mm/h) gives a higher score than no rain', () => {
    // 2 mm/h pushes the raw hourly above 30 (≈33) while 0 mm stays at the floor (30).
    const noRain    = scoreIndoor(makeSlice({ precipitation: new Array(24).fill(0) })).score;
    const modRain   = scoreIndoor(makeSlice({ precipitation: new Array(24).fill(2) })).score;
    expect(modRain).toBeGreaterThan(noRain);
  });

  it('heavy rain (8 mm/h) yields a score clearly above the floor', () => {
    // With 45% rain weight, 8 mm alone produces ≈48 — well above the 30 floor.
    const slice = makeSlice({ precipitation: new Array(24).fill(8) });
    expect(scoreIndoor(slice).score).toBeGreaterThan(40);
  });

  it('very cold temperature increases score compared to comfortable (when both have some rain)', () => {
    // A baseline rain level (2 mm/h) lifts both scores above the floor so the
    // thermal-discomfort contribution (25% weight) becomes visible.
    const baseRain    = new Array(24).fill(2);
    const comfortable = scoreIndoor(makeSlice({ precipitation: baseRain, apparentTemperature: new Array(24).fill(20) })).score;
    const veryCold    = scoreIndoor(makeSlice({ precipitation: baseRain, apparentTemperature: new Array(24).fill(-10) })).score;
    expect(veryCold).toBeGreaterThan(comfortable);
  });

  it('very hot temperature increases score compared to comfortable (when both have some rain)', () => {
    const baseRain    = new Array(24).fill(2);
    const comfortable = scoreIndoor(makeSlice({ precipitation: baseRain, apparentTemperature: new Array(24).fill(20) })).score;
    const veryHot     = scoreIndoor(makeSlice({ precipitation: baseRain, apparentTemperature: new Array(24).fill(38) })).score;
    expect(veryHot).toBeGreaterThan(comfortable);
  });

  it('strong wind increases score compared to calm (when both have some rain)', () => {
    // Wind has 20% weight; a baseline rain level lifts scores above the floor.
    const baseRain = new Array(24).fill(2);
    const calm     = scoreIndoor(makeSlice({ precipitation: baseRain, windspeed: new Array(24).fill(5) })).score;
    const windy    = scoreIndoor(makeSlice({ precipitation: baseRain, windspeed: new Array(24).fill(70) })).score;
    expect(windy).toBeGreaterThan(calm);
  });

  it('uses only 09:00–19:00 for the daily score', () => {
    // Terrible conditions outside the window, ideal inside it.
    const offWindowBad = new Array(24).fill(20); // heavy rain all day
    for (let h = 9; h < 19; h++) offWindowBad[h] = 0; // no rain in window
    const onWindowBad  = new Array(24).fill(0);         // no rain all day
    for (let h = 9; h < 19; h++) onWindowBad[h] = 20;  // heavy rain in window

    const goodWindowScore = scoreIndoor(makeSlice({ precipitation: offWindowBad })).score;
    const badWindowScore  = scoreIndoor(makeSlice({ precipitation: onWindowBad })).score;
    expect(badWindowScore).toBeGreaterThan(goodWindowScore);
  });

  it('bestTime is within the 09:00–19:00 window', () => {
    const result = scoreIndoor(makeSlice({ precipitation: new Array(24).fill(8) }));
    const startHour = parseInt(result.bestTime.split(':')[0], 10);
    expect(startHour).toBeGreaterThanOrEqual(9);
    expect(startHour + 4).toBeLessThanOrEqual(19);
  });
});
