import type { TempUnit } from '../types';

export function toF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

export function displayTemp(c: number, unit: TempUnit): string {
  return unit === 'F' ? `${toF(c)}°F` : `${Math.round(c)}°C`;
}

export function scoreColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#EAB308';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

export function activityColor(activity: string): string {
  const map: Record<string, string> = {
    surfing: '#3B82F6',
    skiing: '#8B5CF6',
    outdoor: '#10B981',
    indoor: '#F59E0B',
  };

  return map[activity] ?? '#6B7280';
}

export function activityIcon(activity: string): string {
  const map: Record<string, string> = {
    surfing: '🏄',
    skiing: '⛷️',
    outdoor: '🔭',
    indoor: '🏛️',
  };

  return map[activity] ?? '🌤';
}

export function activityLabel(activity: string): string {
  const map: Record<string, string> = {
    surfing: 'Surfing',
    skiing: 'Skiing',
    outdoor: 'Outdoor sightseeing',
    indoor: 'Indoor sightseeing',
  };

  return map[activity] ?? activity;
}

export function wmoIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '🌨️';
  return '⛈️';
}

export function formatDay(dateStr: string, index: number): { day: string; date: string } {
  const d = new Date(dateStr + 'T12:00:00Z');

  if (index === 0) {
    return {day: 'Today', date: d.toLocaleDateString('en', {month: 'short', day: 'numeric'})};
  }

  return {
    day: d.toLocaleDateString('en', { weekday: 'short' }),
    date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
  };
}
