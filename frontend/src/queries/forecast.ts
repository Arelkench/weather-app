import { gql } from 'graphql-request';

export const FORECAST_QUERY = gql`
  query Forecast($location: String!) {
    forecast(location: $location) {
      location {
        name
        lat
        lon
      }
      days {
        date
        weatherCode
        tempMax
        tempMin
        activities {
          activity
          score
          rating
          description
          bestTime
          breakdown {
            name
            score
          }
          hourly {
            hour
            score
          }
        }
      }
    }
  }
`;
