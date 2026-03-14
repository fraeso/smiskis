// ============================================================
// TYPE DEFINITIONS
// These will match your WebSocket payload exactly
// ============================================================

export type RiskLevel = 'critical' | 'high' | 'moderate' | 'low';

export type SensorReading = {
  sensorId: string;
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  readings: {
    temperature: number;      // °C
    humidity: number;         // %
    vocLevel: number;         // ppb
    airQualityIndex: number;  // AQI (0–500)
  };
  riskLevel: RiskLevel;
  timestamp: string;          // ISO 8601
};

export type Alert = {
  id: string;
  title: string;
  description: string;
  callToAction: string;
  severity: RiskLevel;
  locations: string[];
  time: string;
  timestamp: string;
};

// ============================================================
// HELPER
// ============================================================

const ts = (minutesAgo: number): string => {
  const d = new Date(Date.now() - minutesAgo * 60 * 1000);
  return d.toISOString();
};

// ============================================================
// SENSOR DATA
// Structured to mirror a WebSocket message payload
// ============================================================

export const sensors: SensorReading[] = [
  {
    sensorId: 'AERO-001',
    location: {
      name: 'Dandenong Ranges',
      address: 'Mount Dandenong Tourist Rd, Olinda VIC 3788',
      lat: -37.9,
      lng: 145.3,
    },
    readings: { temperature: 38.2, humidity: 22, vocLevel: 620, airQualityIndex: 178 },
    riskLevel: 'critical',
    timestamp: ts(2),
  },
  {
    sensorId: 'AERO-002',
    location: {
      name: 'Kinglake National Park',
      address: 'Kinglake-Healesville Rd, Kinglake VIC 3763',
      lat: -37.5,
      lng: 145.35,
    },
    readings: { temperature: 36.8, humidity: 25, vocLevel: 580, airQualityIndex: 162 },
    riskLevel: 'critical',
    timestamp: ts(1),
  },
  {
    sensorId: 'AERO-003',
    location: {
      name: 'Wilsons Promontory',
      address: 'Tidal River, Wilsons Promontory VIC 3960',
      lat: -39.05,
      lng: 146.38,
    },
    readings: { temperature: 35.1, humidity: 28, vocLevel: 504, airQualityIndex: 145 },
    riskLevel: 'critical',
    timestamp: ts(3),
  },
  {
    sensorId: 'AERO-004',
    location: {
      name: 'Marysville State Forest',
      address: 'Marysville-Woods Point Rd, Marysville VIC 3779',
      lat: -37.52,
      lng: 145.75,
    },
    readings: { temperature: 37.4, humidity: 20, vocLevel: 610, airQualityIndex: 171 },
    riskLevel: 'critical',
    timestamp: ts(0),
  },
  {
    sensorId: 'AERO-005',
    location: {
      name: 'Ballarat',
      address: 'Buninyong Rd, Buninyong VIC 3357',
      lat: -37.56,
      lng: 143.85,
    },
    readings: { temperature: 31.2, humidity: 38, vocLevel: 320, airQualityIndex: 94 },
    riskLevel: 'moderate',
    timestamp: ts(5),
  },
  {
    sensorId: 'AERO-006',
    location: {
      name: 'Bendigo',
      address: 'Calder Hwy, Bendigo VIC 3550',
      lat: -36.76,
      lng: 144.28,
    },
    readings: { temperature: 30.8, humidity: 40, vocLevel: 290, airQualityIndex: 88 },
    riskLevel: 'moderate',
    timestamp: ts(4),
  },
  {
    sensorId: 'AERO-007',
    location: {
      name: 'Geelong',
      address: 'Princes Hwy, Corio VIC 3214',
      lat: -38.14,
      lng: 144.36,
    },
    readings: { temperature: 29.5, humidity: 42, vocLevel: 270, airQualityIndex: 82 },
    riskLevel: 'high',
    timestamp: ts(6),
  },
  {
    sensorId: 'AERO-008',
    location: {
      name: 'Wodonga',
      address: 'Lincoln Causeway, Wodonga VIC 3690',
      lat: -36.12,
      lng: 146.88,
    },
    readings: { temperature: 32.1, humidity: 35, vocLevel: 310, airQualityIndex: 91 },
    riskLevel: 'high',
    timestamp: ts(3),
  },
  {
    sensorId: 'AERO-009',
    location: {
      name: 'Warrnambool',
      address: 'Princes Hwy, Warrnambool VIC 3280',
      lat: -38.38,
      lng: 142.49,
    },
    readings: { temperature: 28.9, humidity: 44, vocLevel: 250, airQualityIndex: 76 },
    riskLevel: 'high',
    timestamp: ts(7),
  },
  {
    sensorId: 'AERO-010',
    location: {
      name: 'Sale',
      address: 'Princess Hwy, Sale VIC 3850',
      lat: -38.1,
      lng: 147.07,
    },
    readings: { temperature: 30.2, humidity: 39, vocLevel: 280, airQualityIndex: 85 },
    riskLevel: 'high',
    timestamp: ts(5),
  },
  {
    sensorId: 'AERO-011',
    location: {
      name: 'Shepparton',
      address: 'Goulburn Valley Hwy, Shepparton VIC 3630',
      lat: -36.38,
      lng: 145.4,
    },
    readings: { temperature: 27.3, humidity: 52, vocLevel: 120, airQualityIndex: 38 },
    riskLevel: 'low',
    timestamp: ts(10),
  },
  {
    sensorId: 'AERO-012',
    location: {
      name: 'Mildura',
      address: 'Sturt Hwy, Mildura VIC 3500',
      lat: -34.19,
      lng: 142.15,
    },
    readings: { temperature: 26.8, humidity: 55, vocLevel: 100, airQualityIndex: 32 },
    riskLevel: 'low',
    timestamp: ts(12),
  },

  // Dense cluster — Dandenong Ranges (critical zone)
  { sensorId: 'AERO-013', location: { name: 'Dandenong Ranges North', address: 'Monbulk Rd, Kallista VIC 3791', lat: -37.87, lng: 145.32 }, readings: { temperature: 37.8, humidity: 21, vocLevel: 608, airQualityIndex: 175 }, riskLevel: 'critical', timestamp: ts(1) },
  { sensorId: 'AERO-014', location: { name: 'Dandenong Ranges East', address: 'Ridge Rd, Montrose VIC 3765', lat: -37.83, lng: 145.36 }, readings: { temperature: 38.5, humidity: 19, vocLevel: 635, airQualityIndex: 182 }, riskLevel: 'critical', timestamp: ts(2) },
  { sensorId: 'AERO-015', location: { name: 'Ferntree Gully', address: 'Burwood Hwy, Ferntree Gully VIC 3156', lat: -37.88, lng: 145.29 }, readings: { temperature: 37.1, humidity: 23, vocLevel: 598, airQualityIndex: 170 }, riskLevel: 'critical', timestamp: ts(3) },
  { sensorId: 'AERO-016', location: { name: 'Upwey', address: 'Main St, Upwey VIC 3158', lat: -37.91, lng: 145.33 }, readings: { temperature: 36.9, humidity: 24, vocLevel: 572, airQualityIndex: 165 }, riskLevel: 'critical', timestamp: ts(1) },
  { sensorId: 'AERO-017', location: { name: 'Belgrave', address: 'Main Rd, Belgrave VIC 3160', lat: -37.93, lng: 145.35 }, readings: { temperature: 37.6, humidity: 22, vocLevel: 590, airQualityIndex: 168 }, riskLevel: 'critical', timestamp: ts(2) },
  { sensorId: 'AERO-018', location: { name: 'The Basin', address: 'Canterbury Rd, The Basin VIC 3154', lat: -37.86, lng: 145.27 }, readings: { temperature: 38.0, humidity: 20, vocLevel: 615, airQualityIndex: 177 }, riskLevel: 'critical', timestamp: ts(0) },
  { sensorId: 'AERO-019', location: { name: 'Silvan', address: 'Silvan Rd, Silvan VIC 3795', lat: -37.84, lng: 145.4 }, readings: { temperature: 37.3, humidity: 21, vocLevel: 601, airQualityIndex: 172 }, riskLevel: 'critical', timestamp: ts(3) },
  { sensorId: 'AERO-020', location: { name: 'Olinda', address: 'Mt Dandenong Tourist Rd, Olinda VIC 3788', lat: -37.86, lng: 145.37 }, readings: { temperature: 38.3, humidity: 20, vocLevel: 628, airQualityIndex: 180 }, riskLevel: 'critical', timestamp: ts(1) },

  // Dense cluster — Kinglake (critical zone)
  { sensorId: 'AERO-021', location: { name: 'Kinglake West', address: 'Whittlesea-Kinglake Rd, Kinglake West VIC 3757', lat: -37.52, lng: 145.22 }, readings: { temperature: 36.5, humidity: 26, vocLevel: 565, airQualityIndex: 158 }, riskLevel: 'critical', timestamp: ts(2) },
  { sensorId: 'AERO-022', location: { name: 'Kinglake Central', address: 'Melba Hwy, Kinglake VIC 3763', lat: -37.49, lng: 145.33 }, readings: { temperature: 37.2, humidity: 24, vocLevel: 588, airQualityIndex: 164 }, riskLevel: 'critical', timestamp: ts(1) },
  { sensorId: 'AERO-023', location: { name: 'Toolangi', address: 'Healesville-Kinglake Rd, Toolangi VIC 3777', lat: -37.54, lng: 145.47 }, readings: { temperature: 36.1, humidity: 27, vocLevel: 555, airQualityIndex: 155 }, riskLevel: 'critical', timestamp: ts(3) },
  { sensorId: 'AERO-024', location: { name: 'Yea Ranges', address: 'Melba Hwy, Yea VIC 3717', lat: -37.44, lng: 145.42 }, readings: { temperature: 35.8, humidity: 28, vocLevel: 542, airQualityIndex: 150 }, riskLevel: 'critical', timestamp: ts(4) },
  { sensorId: 'AERO-025', location: { name: 'Flowerdale', address: 'Strath Creek Rd, Flowerdale VIC 3658', lat: -37.38, lng: 145.32 }, readings: { temperature: 35.4, humidity: 29, vocLevel: 530, airQualityIndex: 148 }, riskLevel: 'critical', timestamp: ts(2) },

  // Dense cluster — Marysville (critical zone)
  { sensorId: 'AERO-026', location: { name: 'Buxton', address: 'Maroondah Hwy, Buxton VIC 3711', lat: -37.42, lng: 145.71 }, readings: { temperature: 36.8, humidity: 22, vocLevel: 598, airQualityIndex: 168 }, riskLevel: 'critical', timestamp: ts(1) },
  { sensorId: 'AERO-027', location: { name: 'Narbethong', address: 'Maroondah Hwy, Narbethong VIC 3778', lat: -37.55, lng: 145.68 }, readings: { temperature: 37.1, humidity: 21, vocLevel: 604, airQualityIndex: 170 }, riskLevel: 'critical', timestamp: ts(2) },
  { sensorId: 'AERO-028', location: { name: 'Cambarville', address: 'Woods Point Rd, Cambarville VIC 3779', lat: -37.58, lng: 145.82 }, readings: { temperature: 36.5, humidity: 23, vocLevel: 578, airQualityIndex: 163 }, riskLevel: 'critical', timestamp: ts(3) },
  { sensorId: 'AERO-029', location: { name: 'Taggerty', address: 'Maroondah Hwy, Taggerty VIC 3714', lat: -37.35, lng: 145.72 }, readings: { temperature: 36.2, humidity: 24, vocLevel: 560, airQualityIndex: 158 }, riskLevel: 'critical', timestamp: ts(2) },
];

// ============================================================
// NETWORK SUMMARY — derived from sensors array
// ============================================================

export const networkStats = {
  critical: sensors.filter(s => s.riskLevel === 'critical').length,
  high: sensors.filter(s => s.riskLevel === 'high').length,
  moderate: sensors.filter(s => s.riskLevel === 'moderate').length,
  low: sensors.filter(s => s.riskLevel === 'low').length,
};

// ============================================================
// ENVIRONMENTAL AVERAGES — derived from sensors array
// ============================================================

export const environmentalStats = {
  avgTemp: parseFloat(
    (sensors.reduce((sum, s) => sum + s.readings.temperature, 0) / sensors.length).toFixed(1)
  ),
  avgHumidity: parseFloat(
    (sensors.reduce((sum, s) => sum + s.readings.humidity, 0) / sensors.length).toFixed(1)
  ),
  maxVOC: Math.max(...sensors.map(s => s.readings.vocLevel)),
  maxRisk: Math.max(...sensors.map(s => s.readings.airQualityIndex)),
};

// ============================================================
// ALERTS
// ============================================================

export const activeAlert: Alert = {
  id: 'ALERT-001',
  title: 'High Fire Risk Detected — Authorities Notified',
  description:
    '4 sensors reporting possible ignition conditions: Dandenong Ranges, Kinglake National Park, Wilsons Promontory, Marysville State Forest. Emergency services have been alerted.',
  callToAction: 'Call Triple Zero (000) if affected',
  severity: 'critical',
  locations: ['Dandenong Ranges', 'Kinglake NP', 'Wilsons Promontory', 'Marysville SF'],
  time: 'Just now',
  timestamp: ts(0),
};

export const allAlerts: Alert[] = [
  {
    id: 'ALERT-001',
    title: 'High Fire Risk Detected',
    description: '4 sensors reporting possible ignition conditions across Dandenong Ranges and surrounds.',
    severity: 'critical',
    locations: ['Dandenong Ranges', 'Kinglake NP', 'Wilsons Promontory', 'Marysville SF'],
    time: 'Just now',
    timestamp: ts(0),
    callToAction: 'Call Triple Zero (000) if affected',
  },
  {
    id: 'ALERT-002',
    title: 'Elevated VOC Levels',
    description: 'VOC readings above 400ppb detected at Ballarat and Geelong stations.',
    severity: 'high',
    locations: ['Ballarat', 'Geelong'],
    time: '23 min ago',
    timestamp: ts(23),
    callToAction: '',
  },
  {
    id: 'ALERT-003',
    title: 'Wind Speed Increase',
    description: 'Sustained winds above 45km/h increasing fire spread risk in northeast corridor.',
    severity: 'high',
    locations: ['Wodonga', 'Sale'],
    time: '1 hr ago',
    timestamp: ts(60),
    callToAction: '',
  },
  {
    id: 'ALERT-004',
    title: 'Humidity Drop Detected',
    description: 'Relative humidity fell below 20% across 3 monitoring zones.',
    severity: 'high',
    locations: ['Marysville SF', 'Kinglake NP'],
    time: '2 hr ago',
    timestamp: ts(120),
    callToAction: '',
  },
  {
    id: 'ALERT-005',
    title: 'All Clear — Shepparton',
    description: 'Risk levels returned to normal at Shepparton station after earlier elevated reading.',
    severity: 'low',
    locations: ['Shepparton'],
    time: '3 hr ago',
    timestamp: ts(180),
    callToAction: '',
  },
  {
    id: 'ALERT-006',
    title: 'Routine Check Complete',
    description: 'All 12 sensors reporting healthy signal strength and calibration status.',
    severity: 'low',
    locations: ['All Stations'],
    time: '6 hr ago',
    timestamp: ts(360),
    callToAction: '',
  },
];

// ============================================================
// RISK ZONES (map polygons)
// ============================================================

export const riskZones = [
  {
    id: 'zone1',
    risk: 'critical' as RiskLevel,
    coordinates: [[145.1, -37.7], [145.5, -37.7], [145.5, -38.1], [145.1, -38.1], [145.1, -37.7]],
  },
  {
    id: 'zone2',
    risk: 'high' as RiskLevel,
    coordinates: [[145.55, -37.35], [145.95, -37.35], [145.95, -37.7], [145.55, -37.7], [145.55, -37.35]],
  },
  {
    id: 'zone3',
    risk: 'moderate' as RiskLevel,
    coordinates: [[143.6, -37.4], [144.1, -37.4], [144.1, -37.8], [143.6, -37.8], [143.6, -37.4]],
  },
  {
    id: 'zone4',
    risk: 'moderate' as RiskLevel,
    coordinates: [[144.0, -36.55], [144.6, -36.55], [144.6, -36.95], [144.0, -36.95], [144.0, -36.55]],
  },
];

// ============================================================
// WEBSOCKET INTEGRATION GUIDE
// When your backend is ready, swap dummyData for live WS data.
// ============================================================

/*
  Each WebSocket message will have the same shape as SensorReading above.

  Example usage in a screen:

  import { useState, useEffect } from 'react';
  import { sensors as initialSensors, SensorReading } from '../constants/dummyData';

  const [sensorData, setSensorData] = useState<SensorReading[]>(initialSensors);

  useEffect(() => {
    const ws = new WebSocket('wss://your-backend.com/sensors');

    ws.onmessage = (event) => {
      const update: SensorReading = JSON.parse(event.data);
      setSensorData(prev =>
        prev.map(s => s.sensorId === update.sensorId ? update : s)
      );
    };

    ws.onerror = (e) => console.error('WebSocket error:', e);
    ws.onclose = () => console.log('WebSocket closed');

    return () => ws.close();
  }, []);
*/