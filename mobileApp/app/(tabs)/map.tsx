import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import { sensors } from '../../constants/dummy-data';
import { colors, font, spacing, radius } from '../../constants/theme';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!;
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Temperature (20-45°C) to heatmap weight (0.1-1.0)
const tempToWeight = (temp: number) => {
  const clamped = Math.min(Math.max(temp, 20), 45);
  return parseFloat(((clamped - 20) / 25).toFixed(2));
};
const aqiToBaseRadius = (aqi: number) => Math.round(8 + (Math.min(Math.max(aqi, 0), 500) / 500) * 42);

// ─── GeoJSON: polygon zones (organic, AQI-sized) ─────────────
const KM_LAT = 1 / 110.574;
const KM_LNG = 1 / (111.32 * Math.cos((37.5 * Math.PI) / 180));

const organicPolygon = (lat: number, lng: number, km: number, id: string, pts = 32): number[][] => {
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i: number) => { const x = Math.sin(seed * 9301 + i * 49297) * 233280; return x - Math.floor(x); };
  const coords = Array.from({ length: pts }, (_, i) => {
    const angle = (i / pts) * 2 * Math.PI;
    const r = km * (0.75 + rng(i) * 0.5);
    return [lng + r * Math.sin(angle) * KM_LNG, lat + r * Math.cos(angle) * KM_LAT];
  });
  coords.push(coords[0]);
  return coords;
};

const aqiToKm = (aqi: number) => 1 + (Math.min(Math.max(aqi, 0), 500) / 500) * 24;

const zoneGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: sensors.map((s) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [organicPolygon(s.location.lat, s.location.lng, aqiToKm(s.readings.airQualityIndex), s.sensorId)],
    },
    properties: { sensorId: s.sensorId, riskLevel: s.riskLevel, aqi: s.readings.airQualityIndex },
  })),
};

// ─── GeoJSON: point data (heatmap + dots) ────────────────────
const pointGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: sensors.map((s) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [s.location.lng, s.location.lat] },
    properties: {
      sensorId: s.sensorId,
      name: s.location.name,
      riskLevel: s.riskLevel,
      temperature: s.readings.temperature,
      humidity: s.readings.humidity,
      vocLevel: s.readings.vocLevel,
      aqi: s.readings.airQualityIndex,
      heatmapWeight: s.riskLevel === 'normal' ? 0 : tempToWeight(s.readings.temperature),
      heatmapRadius: Math.round(20 + (Math.min(s.readings.airQualityIndex, 500) / 500) * 100),
      zoneRadius: aqiToBaseRadius(s.readings.airQualityIndex),
    },
  })),
};

const riskColorMap: Record<string, string> = {
  critical: colors.critical,
  elevated: colors.elevated,
  normal: colors.normal,
};

type ViewMode = 'heatmap' | 'zones';
type SelectedSensor = typeof sensors[0] | null;

export default function MapScreen() {
  const [selectedSensor, setSelectedSensor] = useState<SelectedSensor>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const params = useLocalSearchParams<{ sensorId?: string; lat?: string; lng?: string }>();

  const cameraRef = React.useRef<MapboxGL.Camera>(null);

  // Fly to sensor if navigated from Sensors page
  useEffect(() => {
    if (params.sensorId && params.lat && params.lng) {
      const sensor = sensors.find(s => s.sensorId === params.sensorId);
      if (sensor) {
        setTimeout(() => {
          cameraRef.current?.setCamera({
            centerCoordinate: [parseFloat(params.lng!), parseFloat(params.lat!)],
            zoomLevel: 10,
            animationDuration: 1000,
            animationMode: 'flyTo',
          });
          setSelectedSensor(sensor);
        }, 500);
      }
    }
  }, [params.sensorId]);

  const resetCamera = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: [145.0, -37.5],
      zoomLevel: 6,
      animationDuration: 800,
      animationMode: 'flyTo',
    });
    setSelectedSensor(null);
  };

  const handleSensorPress = (e: any) => {
    const feature = e.features[0];
    if (feature?.properties) {
      const sensor = sensors.find(s => s.sensorId === feature.properties?.sensorId);
      if (sensor) setSelectedSensor(sensor);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Risk Map</Text>
          <Text style={styles.subtitle}>Regional Victoria, Australia</Text>
        </View>

        {/* Mode toggle */}
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segBtn, viewMode === 'heatmap' && styles.segBtnActive]}
            onPress={() => setViewMode('heatmap')}
          >
            <Ionicons name="flame" size={13} color={viewMode === 'heatmap' ? colors.critical : colors.textMuted} />
            <Text style={[styles.segText, viewMode === 'heatmap' && styles.segTextActive]}>Heatmap</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, viewMode === 'zones' && styles.segBtnActive]}
            onPress={() => setViewMode('zones')}
          >
            <Ionicons name="radio" size={13} color={viewMode === 'zones' ? colors.critical : colors.textMuted} />
            <Text style={[styles.segText, viewMode === 'zones' && styles.segTextActive]}>Zones</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL="mapbox://styles/mapbox/dark-v11"
          logoEnabled={false}
          attributionEnabled={false}
          onPress={() => setSelectedSensor(null)}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={6}
            centerCoordinate={[145.0, -37.5]}
            animationMode="flyTo"
            animationDuration={1500}
          />

          {/* ── HEATMAP MODE ── */}
          {viewMode === 'heatmap' && (
            <MapboxGL.ShapeSource id="heatmap-source" shape={pointGeoJSON}>
              <MapboxGL.HeatmapLayer
                id="heatmap-layer"
                sourceID="heatmap-source"
                style={{
                  heatmapWeight: ['get', 'heatmapWeight'] as any,
                  heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 4, 0.8, 8, 2.0] as any,
                  heatmapRadius: [
                    'interpolate', ['linear'], ['zoom'],
                    4, ['*', ['get', 'heatmapRadius'], 0.4],
                    6, ['get', 'heatmapRadius'],
                    9, ['*', ['get', 'heatmapRadius'], 2.5],
                  ] as any,
                  heatmapOpacity: 0.75,
                  heatmapColor: ['interpolate', ['linear'], ['heatmap-density'],
                    0,    'rgba(0,0,0,0)',
                    0.1,  'rgba(245,166,35,0.5)',
                    0.4,  'rgba(255,100,50,0.75)',
                    0.7,  'rgba(255,59,59,0.85)',
                    1.0,  'rgba(255,40,40,1)',
                  ] as any,
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* ── ZONES MODE ── */}
          {viewMode === 'zones' && (
            <MapboxGL.ShapeSource id="zones-source" shape={zoneGeoJSON}>
              <MapboxGL.FillLayer
                id="zones-fill"
                sourceID="zones-source"
                style={{
                  fillColor: ['match', ['get', 'riskLevel'],
                    'critical', colors.critical,
                    'elevated', colors.elevated,
                    colors.normal,
                  ] as any,
                  fillOpacity: ['match', ['get', 'riskLevel'],
                    'critical', 0.18,
                    'elevated', 0.12,
                    0.08,
                  ] as any,
                }}
              />
              <MapboxGL.LineLayer
                id="zones-outline"
                sourceID="zones-source"
                style={{
                  lineColor: ['match', ['get', 'riskLevel'],
                    'critical', colors.critical,
                    'elevated', colors.elevated,
                    colors.normal,
                  ] as any,
                  lineWidth: 1,
                  lineOpacity: ['match', ['get', 'riskLevel'],
                    'critical', 0.55,
                    'elevated', 0.4,
                    0.25,
                  ] as any,
                  lineDasharray: [3, 2] as any,
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* ── SENSOR DOTS — always visible ── */}
          <MapboxGL.ShapeSource id="sensors-source" shape={pointGeoJSON} onPress={handleSensorPress}>
            <MapboxGL.CircleLayer
              id="sensors-dot"
              sourceID="sensors-source"
              style={{
                circleRadius: 6,
                circleColor: ['match', ['get', 'riskLevel'],
                  'critical', colors.critical,
                  'elevated', colors.elevated,
                  colors.normal,
                ] as any,
                circleOpacity: 1,
                circleStrokeWidth: 2,
                circleStrokeColor: '#0a0c0f',
              }}
            />
          </MapboxGL.ShapeSource>
        </MapboxGL.MapView>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>RISK LEVEL</Text>
          {[
            { label: 'Possible Ignition', color: colors.critical },
            { label: 'Elevated Risk', color: colors.elevated },
            { label: 'Normal', color: colors.normal },
          ].map((item) => (
            <View key={item.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: item.color }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Sensor count — tap to zoom out */}
        <TouchableOpacity style={styles.sensorPill} onPress={resetCamera}>
          <Ionicons name="locate" size={12} color={colors.textSecondary} />
          <Text style={styles.sensorPillText}>{sensors.length} Sensors Active</Text>
        </TouchableOpacity>

        {/* Sensor callout */}
        {selectedSensor && (
          <View style={styles.callout}>
            <View style={styles.calloutHeader}>
              <View style={[styles.calloutDot, { backgroundColor: riskColorMap[selectedSensor.riskLevel] }]} />
              <Text style={styles.calloutName}>{selectedSensor.location.name}</Text>
              <TouchableOpacity onPress={() => setSelectedSensor(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.calloutAddress}>{selectedSensor.location.address}</Text>
            <View style={styles.calloutStats}>
              {[
                { label: 'Temp', value: `${selectedSensor.readings.temperature}°C` },
                { label: 'Humidity', value: `${selectedSensor.readings.humidity}%` },
                { label: 'VOC', value: `${selectedSensor.readings.vocLevel} ppb` },
                { label: 'AQI', value: `${selectedSensor.readings.airQualityIndex}` },
              ].map((stat) => (
                <View key={stat.label} style={styles.calloutStat}>
                  <Text style={styles.calloutStatValue}>{stat.value}</Text>
                  <Text style={styles.calloutStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: font.xxxl, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: font.sm, marginTop: 2 },
  segmented: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  segBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  segBtnActive: { backgroundColor: colors.criticalBg, borderColor: colors.critical },
  segText: { color: colors.textMuted, fontSize: font.xs, fontWeight: '600' },
  segTextActive: { color: colors.critical },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  legend: { position: 'absolute', top: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(17,20,24,0.93)', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  legendTitle: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: font.sm, fontWeight: '500' },
  sensorPill: { position: 'absolute', bottom: spacing.xl, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(17,20,24,0.93)', borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sensorPillText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  callout: { position: 'absolute', bottom: spacing.xl * 3, left: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(17,20,24,0.97)', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  calloutHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  calloutDot: { width: 8, height: 8, borderRadius: 4 },
  calloutName: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700', flex: 1 },
  calloutAddress: { color: colors.textMuted, fontSize: font.xs, marginBottom: spacing.md },
  calloutStats: { flexDirection: 'row', justifyContent: 'space-between' },
  calloutStat: { alignItems: 'center' },
  calloutStatValue: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700' },
  calloutStatLabel: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
});