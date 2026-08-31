import { useQuery } from '@tanstack/react-query';

export interface LocationSuggestion {
  display: string; // "City, Region, Country" shown in list
  searchValue: string; // value passed to onSearch (city + country)
}

export function useLocationSuggestions(query: string) {
  return useQuery<LocationSuggestion[]>({
    queryKey: ['location-suggestions', query],
    queryFn: async () => {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
      );

      if (!res.ok) {
        return [];
      }

      const data = (await res.json()) as {
        results?: { name: string; country: string; admin1?: string; country_code?: string }[];
      };

      if (!data.results) {
        return [];
      }

      return data.results.map((r) => ({
        display: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
        searchValue: [r.name, r.country].filter(Boolean).join(', '),
      }));
    },
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000,
    placeholderData: [],
  });
}
