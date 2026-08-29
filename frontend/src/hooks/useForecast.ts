import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '../lib/gql';
import { FORECAST_QUERY } from '../queries/forecast';
import type { ForecastData } from '../types';

export function useForecast(location: string | null) {
  return useQuery<ForecastData>({
    queryKey: ['forecast', location],
    queryFn: () => gqlClient.request<ForecastData>(FORECAST_QUERY, { location }),
    enabled: !!location,
    staleTime: 5 * 60 * 1000,
  });
}
