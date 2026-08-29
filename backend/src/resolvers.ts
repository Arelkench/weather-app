const STUB_ACTIVITIES = ['surfing', 'skiing', 'outdoor', 'indoor'].map((activity) => ({
  activity,
  score: 75,
  rating: 'Good',
  description: `Stub description for ${activity}.`,
  bestTime: '09:00–13:00',
  breakdown: [
    { name: 'Temperature', score: 75 },
    { name: 'Wind', score: 80 },
    { name: 'Precipitation', score: 90 },
  ],
  hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, score: 70 })),
}));

function buildStubDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      weatherCode: 1,
      tempMax: 20 + i,
      tempMin: 12 + i,
      activities: STUB_ACTIVITIES,
    };
  });
}

export const resolvers = {
  Query: {
    forecast: (_: unknown, { location }: { location: string }) => {
      if (!location.trim()) {
        throw new Error('Location cannot be empty');
      }
      return {
        location: { name: location, lat: 43.3, lon: -1.98 },
        days: buildStubDays(),
      };
    },
  },
};
