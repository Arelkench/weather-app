import type { HourlySlice } from './scoring/types';

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation: number[];
  windspeed_10m: number[];
  cloudcover: number[];
  snowfall: number[];
  visibility: number[];
}

interface MarineHourly {
  time: string[];
  wave_height: (number | null)[];
  wave_period: (number | null)[];
}

export interface DayRawData {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  hourly: HourlySlice;
}

async function fetchWeather(lat: number, lon: number): Promise<{ daily: unknown; hourly: OpenMeteoHourly }> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'weathercode,temperature_2m_max,temperature_2m_min',
    hourly: 'temperature_2m,apparent_temperature,precipitation,windspeed_10m,cloudcover,snowfall,visibility',
    timezone: 'auto',
    forecast_days: '7',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Failed to fetch weather forecast');
  return res.json() as Promise<{ daily: unknown; hourly: OpenMeteoHourly }>;
}

async function fetchMarine(lat: number, lon: number): Promise<MarineHourly | null> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: 'wave_height,wave_period',
    forecast_days: '7',
  });
  try {
    const res = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { hourly?: MarineHourly };
    return data.hourly ?? null;
  } catch {
    return null;
  }
}

function nullsToZero(arr: (number | null)[]): number[] {
  return arr.map((v) => v ?? 0);
}

function slice24(arr: number[], dayIndex: number): number[] {
  return arr.slice(dayIndex * 24, dayIndex * 24 + 24);
}

export async function fetchForecastData(lat: number, lon: number): Promise<DayRawData[]> {
  const [weather, marine] = await Promise.all([
    fetchWeather(lat, lon),
    fetchMarine(lat, lon),
  ]);

  const daily = weather.daily as {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };

  const hasMarine = marine !== null &&
    marine.wave_height.some((v) => v !== null && v > 0);

  return daily.time.map((date, i) => ({
    date,
    weatherCode: daily.weathercode[i],
    tempMax: Math.round(daily.temperature_2m_max[i]),
    tempMin: Math.round(daily.temperature_2m_min[i]),
    hourly: {
      temperature: slice24(weather.hourly.temperature_2m, i),
      apparentTemperature: slice24(weather.hourly.apparent_temperature, i),
      precipitation: slice24(weather.hourly.precipitation, i),
      windspeed: slice24(weather.hourly.windspeed_10m, i),
      cloudcover: slice24(weather.hourly.cloudcover, i),
      snowfall: slice24(weather.hourly.snowfall, i),
      visibility: slice24(weather.hourly.visibility, i),
      waveHeight: marine ? slice24(nullsToZero(marine.wave_height), i) : new Array(24).fill(0),
      wavePeriod: marine ? slice24(nullsToZero(marine.wave_period), i) : new Array(24).fill(0),
      hasMarine,
    },
  }));
}
