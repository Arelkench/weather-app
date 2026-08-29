export interface GeoLocation {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export async function geocodeLocation(query: string): Promise<GeoLocation> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding service unavailable');

  const data = (await res.json()) as {
    results?: Array<{ name: string; country: string; latitude: number; longitude: number }>;
  };

  if (!data.results || data.results.length === 0) {
    throw new Error(`Location not found: "${query}"`);
  }

  const r = data.results[0];
  return { name: r.name, country: r.country, lat: r.latitude, lon: r.longitude };
}
