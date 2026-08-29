import { geocodeLocation } from './geocoding';
import { fetchForecastData } from './openmeteo';
import { scoreSurfing } from './scoring/surfing';
import { scoreSkiing } from './scoring/skiing';
import { scoreOutdoor } from './scoring/outdoor';
import { scoreIndoor } from './scoring/indoor';
import type { HourlySlice } from './scoring/types';

function buildActivities(hourly: HourlySlice) {
  const surfing = scoreSurfing(hourly);
  const skiing = scoreSkiing(hourly);
  const outdoor = scoreOutdoor(hourly);
  const indoor = scoreIndoor(hourly);

  return [
    { activity: 'surfing', ...surfing },
    { activity: 'skiing', ...skiing },
    { activity: 'outdoor', ...outdoor },
    { activity: 'indoor', ...indoor },
  ];
}

export const resolvers = {
  Query: {
    forecast: async (_: unknown, { location }: { location: string }) => {
      const geo = await geocodeLocation(location);
      const days = await fetchForecastData(geo.lat, geo.lon);

      return {
        location: { name: `${geo.name}, ${geo.country}`, lat: geo.lat, lon: geo.lon },
        days: days.map((day) => ({
          date: day.date,
          weatherCode: day.weatherCode,
          tempMax: day.tempMax,
          tempMin: day.tempMin,
          activities: buildActivities(day.hourly),
        })),
      };
    },
  },
};
