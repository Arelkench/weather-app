import { useState, useEffect } from 'react';
import type { ActivityType, TempUnit, ForecastData } from '../types';

export interface ForecastState {
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  selectedActivity: ActivityType;
  detailOpen: boolean;
  setDetailOpen: (open: boolean) => void;
  unit: TempUnit;
  setUnit: (unit: TempUnit) => void;
  handleActivitySelect: (activity: ActivityType) => void;
}

export function useForecastState(data: ForecastData | undefined): ForecastState {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('surfing');
  const [detailOpen, setDetailOpen] = useState(true);
  const [unit, setUnit] = useState<TempUnit>('C');

  useEffect(() => {
    if (data) {
      setSelectedDay(0);
      setDetailOpen(true);
    }
  }, [data]);

  function handleActivitySelect(activity: ActivityType) {
    setSelectedActivity(activity);
    setDetailOpen(true);
  }

  return { selectedDay, setSelectedDay, selectedActivity, detailOpen, setDetailOpen, unit, setUnit, handleActivitySelect };
}
