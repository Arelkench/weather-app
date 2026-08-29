import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '../lib/gql';
import { FORECAST_QUERY } from '../queries/forecast';

export function useForecast(location: string | null) {
  return useQuery({
    queryKey: ['forecast', location],
    queryFn: () => gqlClient.request(FORECAST_QUERY, { location }),
    enabled: !!location,
    staleTime: 5 * 60 * 1000,
  });
}
