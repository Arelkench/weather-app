export type ActivityType = 'surfing' | 'skiing' | 'outdoor' | 'indoor';
export type TempUnit = 'C' | 'F';

export interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
}

export interface ScoreFactor {
  name: string;
  score: number;
}

export interface HourlyScore {
  hour: number;
  score: number;
}

export interface ActivityScore {
  activity: ActivityType;
  score: number;
  rating: string;
  description: string;
  bestTime: string;
  breakdown: ScoreFactor[];
  hourly: HourlyScore[];
}

export interface DayForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  activities: ActivityScore[];
}

export interface ForecastData {
  forecast: {
    location: LocationInfo;
    days: DayForecast[];
  };
}
