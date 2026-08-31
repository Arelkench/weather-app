import { describe, it, expect } from 'vitest';
import type { HourlySlice } from '../types';
import {
  thermalComfortScore,
  precipScore,
  cloudScore,
  windScore,
  scoreOutdoor,
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

// ── Component: thermalComfortScore ────────────────────────────────────────────

describe('thermalComfortScore', () => {
  it('scores 100 in the comfortable ideal band (21°C)', () => {
    expect(thermalComfortScore(21)).toBe(100);
  });

  it('scores 10 when very cold (below 0°C)', () => {
    expect(thermalComfortScore(-5)).toBe(10);
  });

  it('scores 10 when very hot (above 36°C)', () => {
    expect(thermalComfortScore(38)).toBe(10);
  });

  it('rises from 10→100 as temp goes from 0°C to 18°C', () => {
    const at5  = thermalComfortScore(5);
    const at15 = thermalComfortScore(15);
    expect(at5).toBeGreaterThan(10);
    expect(at15).toBeGreaterThan(at5);
    expect(at15).toBeLessThan(100);
  });

  it('declines from 100 as apparent temperature exceeds 24°C', () => {
    expect(thermalComfortScore(27)).toBeLessThan(100);
    expect(thermalComfortScore(33)).toBeLessThan(thermalComfortScore(27));
  });
});

// ── Component: precipScore ────────────────────────────────────────────────────

describe('precipScore', () => {
  it('scores 100 with no precipitation', () => {
    expect(precipScore(0)).toBe(100);
  });

  it('scores low with heavy precipitation (4 mm/h)', () => {
    expect(precipScore(4)).toBeLessThan(20);
  });

  it('decreases monotonically from 0 to 4 mm', () => {
    expect(precipScore(0.5)).toBeLessThan(precipScore(0));
    expect(precipScore(2)).toBeLessThan(precipScore(0.5));
    expect(precipScore(4)).toBeLessThan(precipScore(2));
  });
});

// ── Component: cloudScore ─────────────────────────────────────────────────────

describe('cloudScore', () => {
  it('scores well (but not 100) with very low cloud cover (10%)', () => {
    const s = cloudScore(10);
    expect(s).toBeGreaterThan(80);
    expect(s).toBeLessThan(100);
  });

  it('scores 100 with partly cloudy skies (30%)', () => {
    expect(cloudScore(30)).toBe(100);
  });

  it('scores low when overcast (95%)', () => {
    expect(cloudScore(95)).toBeLessThan(25);
  });

  it('declines after the partly-cloudy peak', () => {
    expect(cloudScore(80)).toBeLessThan(cloudScore(30));
  });
});

// ── Component: windScore ──────────────────────────────────────────────────────

describe('windScore', () => {
  it('scores 100 in calm conditions (5 km/h)', () => {
    expect(windScore(5)).toBe(100);
  });

  it('scores low in strong wind (55 km/h)', () => {
    expect(windScore(55)).toBeLessThan(20);
  });

  it('decreases as wind speed increases', () => {
    expect(windScore(30)).toBeLessThan(windScore(10));
    expect(windScore(55)).toBeLessThan(windScore(30));
  });
});

// ── scoreOutdoor: evaluation window ──────────────────────────────────────────

describe('scoreOutdoor evaluation window', () => {
  it('uses only 09:00–19:00 for the daily score', () => {
    // Terrible conditions (cold apparent temp + heavy rain) ONLY in 09:00–19:00.
    // Hours outside the window stay comfortable.
    const apparentTemp = new Array(24).fill(20);
    const precip       = new Array(24).fill(0);
    for (let h = 9; h < 19; h++) {
      apparentTemp[h] = -5;  // very cold: thermalComfortScore → 10
      precip[h]       = 5;   // heavy rain: precipScore → 5
    }
    const badWindowSlice = makeSlice({ apparentTemperature: apparentTemp, precipitation: precip });

    // Window conditions dominate → low score (cold + rain → ~36)
    expect(scoreOutdoor(badWindowSlice).score).toBeLessThan(40);
    // Default slice: 20°C apparent, no rain, partly cloudy, calm → should be high
    expect(scoreOutdoor(makeSlice()).score).toBeGreaterThan(70);
  });

  it('bestTime is within the 09:00–19:00 window', () => {
    const result = scoreOutdoor(makeSlice());
    // bestWindow returns "HH:00–HH:00"; start hour must be ≥ 9 and end ≤ 19
    const startHour = parseInt(result.bestTime.split(':')[0], 10);
    expect(startHour).toBeGreaterThanOrEqual(9);
    expect(startHour + 4).toBeLessThanOrEqual(19);
  });
});
