import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { endpoints } from './api';

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export type SensorReading = {
  sensorId: string;
  location: { name: string; address: string; lat: number; lng: number };
  readings: { temperature: number; humidity: number; vocLevel: number; airQualityIndex: number };
  riskLevel: RiskLevel;
  timestamp: string;
};

type SensorsContextType = {
  sensors: SensorReading[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  networkStats: { critical: number; high: number; moderate: number; low: number };
  environmentalStats: { avgTemp: number; avgHumidity: number; maxVOC: number; maxRisk: number };
  refresh: () => void;
};

const POLL_INTERVAL = 0.5 * 60 * 1000;

const SensorsContext = createContext<SensorsContextType>({
  sensors: [],
  loading: true,
  error: null,
  lastUpdated: null,
  networkStats: { critical: 0, high: 0, moderate: 0, low: 0 },
  environmentalStats: { avgTemp: 0, avgHumidity: 0, maxVOC: 0, maxRisk: 0 },
  refresh: () => { },
});

export function SensorsProvider({ children }: { children: React.ReactNode }) {
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSensors = useCallback(async () => {
    const pollTime = new Date().toLocaleTimeString();
    console.log(`[AeroSafe] Polling sensors at ${pollTime}...`);
    try {
      const res = await fetch(endpoints.sensorsLatest);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SensorReading[] = await res.json();
      setSensors(data);
      setLastUpdated(new Date());
      setError(null);
      console.log(`[AeroSafe] ✓ Received ${data.length} sensors at ${pollTime}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch sensors';
      setError(msg);
      console.warn(`[AeroSafe] ✗ Poll failed at ${pollTime}: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSensors();
    const interval = setInterval(fetchSensors, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSensors]);

  const networkStats = {
    critical: sensors.filter(s => s.riskLevel === 'critical').length,
    high: sensors.filter(s => s.riskLevel === 'high').length,
    moderate: sensors.filter(s => s.riskLevel === 'moderate').length,
    low: sensors.filter(s => s.riskLevel === 'low').length,
  };

  const environmentalStats = sensors.length > 0 ? {
    avgTemp: parseFloat((sensors.reduce((sum, s) => sum + s.readings.temperature, 0) / sensors.length).toFixed(1)),
    avgHumidity: parseFloat((sensors.reduce((sum, s) => sum + s.readings.humidity, 0) / sensors.length).toFixed(1)),
    maxVOC: Math.max(...sensors.map(s => s.readings.vocLevel)),
    maxRisk: Math.max(...sensors.map(s => s.readings.airQualityIndex)),
  } : { avgTemp: 0, avgHumidity: 0, maxVOC: 0, maxRisk: 0 };

  const value: SensorsContextType = {
    sensors,
    loading,
    error,
    lastUpdated,
    networkStats,
    environmentalStats,
    refresh: fetchSensors,
  };

  return React.createElement(SensorsContext.Provider, { value }, children);
}

export function useSensors(): SensorsContextType {
  return useContext(SensorsContext);
}
