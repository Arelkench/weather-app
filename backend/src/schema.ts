export const typeDefs = `#graphql
  type Query {
    forecast(location: String!): ForecastResult
  }

  type ForecastResult {
    location: LocationInfo!
    days: [DayForecast!]!
  }

  type LocationInfo {
    name: String!
    lat: Float!
    lon: Float!
  }

  type DayForecast {
    date: String!
    weatherCode: Int!
    tempMax: Float!
    tempMin: Float!
    activities: [ActivityScore!]!
  }

  type ActivityScore {
    activity: String!
    score: Int!
    rating: String!
    description: String!
    bestTime: String!
    breakdown: [ScoreFactor!]!
    hourly: [HourlyScore!]!
  }

  type ScoreFactor {
    name: String!
    score: Int!
  }

  type HourlyScore {
    hour: Int!
    score: Int!
  }
`;
