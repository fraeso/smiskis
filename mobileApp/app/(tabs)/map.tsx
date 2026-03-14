import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Animated } from 'react-native';
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
      heatmapWeight: s.riskLevel === 'low' ? 0 : tempToWeight(s.readings.temperature),
      heatmapRadius: Math.round(20 + (Math.min(s.readings.airQualityIndex, 500) / 500) * 100),
      zoneRadius: aqiToBaseRadius(s.readings.airQualityIndex),
    },
  })),
};

const riskColorMap: Record<string, string> = {
  critical: colors.critical,
  high: colors.high,
  moderate: colors.moderate,
  low: colors.low,
};

type DotColorMode = 'risk' | 'temperature' | 'humidity' | 'voc' | 'aqi';

// Map a reading value to a colour on a gradient
const valueToColor = (value: number, min: number, max: number): string => {
  const t = Math.min(Math.max((value - min) / (max - min), 0), 1);
  if (t < 0.33) return colors.low;
  if (t < 0.66) return colors.moderate;
  if (t < 0.85) return colors.high;
  return colors.critical;
};

const getDotColor = (sensor: typeof sensors[0], mode: DotColorMode): string => {
  switch (mode) {
    case 'temperature': return valueToColor(sensor.readings.temperature, 15, 45);
    case 'humidity': return valueToColor(100 - sensor.readings.humidity, 20, 80); // invert — low humidity = high risk
    case 'voc': return valueToColor(sensor.readings.vocLevel, 50, 700);
    case 'aqi': return valueToColor(sensor.readings.airQualityIndex, 0, 300);
    default: return riskColorMap[sensor.riskLevel] ?? colors.low;
  }
};
type SelectedSensor = typeof sensors[0] | null;

export default function MapScreen() {
  const [selectedSensor, setSelectedSensor] = useState<SelectedSensor>(null);
  const [showHeat, setShowHeat] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [dotColorMode, setDotColorMode] = useState<DotColorMode>('risk');
  const params = useLocalSearchParams<{ sensorId?: string; lat?: string; lng?: string }>();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const calloutAnim = useRef(new Animated.Value(0)).current;

  // Animate callout in/out
  useEffect(() => {
    Animated.spring(calloutAnim, {
      toValue: selectedSensor ? 1 : 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, [selectedSensor]);

  // Rebuild dot GeoJSON when colour mode changes — adds dotColor per feature
  const coloredPointGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: sensors.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.location.lng, s.location.lat] },
      properties: {
        ...pointGeoJSON.features.find(f => f.properties?.sensorId === s.sensorId)?.properties,
        dotColor: getDotColor(s, dotColorMode),
      },
    })),
  };

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
        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.segBtn, showHeat && styles.segBtnActive]}
            onPress={() => setShowHeat(!showHeat)}
          >
            <Ionicons name="flame" size={13} color={showHeat ? colors.accent : colors.textMuted} />
            <Text style={[styles.segText, showHeat && styles.segTextActive]}>Heat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segBtn, showZones && styles.segBtnActive]}
            onPress={() => setShowZones(!showZones)}
          >
            <Ionicons name="radio" size={13} color={showZones ? colors.accent : colors.textMuted} />
            <Text style={[styles.segText, showZones && styles.segTextActive]}>Zones</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dot colour filter */}
      <View style={styles.colorFilterRow}>
        {([
          { mode: 'risk' as DotColorMode, label: 'Risk' },
          { mode: 'temperature' as DotColorMode, label: 'Temp' },
          { mode: 'humidity' as DotColorMode, label: 'Humidity' },
          { mode: 'voc' as DotColorMode, label: 'VOC' },
          { mode: 'aqi' as DotColorMode, label: 'AQI' },
        ]).map((item) => (
          <TouchableOpacity
            key={item.mode}
            style={[styles.colorFilterBtn, dotColorMode === item.mode && styles.colorFilterBtnActive]}
            onPress={() => setDotColorMode(item.mode)}
          >
            <Text style={[styles.colorFilterText, dotColorMode === item.mode && styles.colorFilterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
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
          {showHeat && (
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
          {showZones && (
            <MapboxGL.ShapeSource id="zones-source" shape={zoneGeoJSON}>
              <MapboxGL.FillLayer
                id="zones-fill"
                sourceID="zones-source"
                style={{
                  fillColor: ['match', ['get', 'riskLevel'],
                    'critical', colors.critical,
                    'high', colors.high,
                    'moderate', colors.moderate,
                    colors.low,
                  ] as any,
                  fillOpacity: ['match', ['get', 'riskLevel'],
                    'critical', showHeat ? 0.06 : 0.18,
                    'high', showHeat ? 0.05 : 0.15,
                    'moderate', showHeat ? 0.04 : 0.12,
                    showHeat ? 0.02 : 0.08,
                  ] as any,
                }}
              />
              <MapboxGL.LineLayer
                id="zones-outline"
                sourceID="zones-source"
                style={{
                  lineColor: ['match', ['get', 'riskLevel'],
                    'critical', colors.critical,
                    'high', colors.high,
                    'moderate', colors.moderate,
                    colors.low,
                  ] as any,
                  lineWidth: 1,
                  lineOpacity: ['match', ['get', 'riskLevel'],
                    'critical', showHeat ? 0.3 : 0.55,
                    'high', showHeat ? 0.25 : 0.45,
                    'moderate', showHeat ? 0.2 : 0.4,
                    showHeat ? 0.12 : 0.25,
                  ] as any,
                  lineDasharray: [3, 2] as any,
                }}
              />
            </MapboxGL.ShapeSource>
          )}

          {/* ── SENSOR DOTS — always visible ── */}
          <MapboxGL.ShapeSource id="sensors-source" shape={coloredPointGeoJSON} onPress={handleSensorPress}>
            <MapboxGL.CircleLayer
              id="sensors-selected-ring"
              sourceID="sensors-source"
              filter={selectedSensor ? ['==', ['get', 'sensorId'], selectedSensor.sensorId] : ['==', '1', '0'] as any}
              style={{
                circleRadius: 14,
                circleColor: 'transparent',
                circleStrokeWidth: 2.5,
                circleStrokeColor: '#ffffff',
                circleStrokeOpacity: 0.9,
              }}
            />
            <MapboxGL.CircleLayer
              id="sensors-dot"
              sourceID="sensors-source"
              style={{
                circleRadius: 6,
                circleColor: ['get', 'dotColor'] as any,
                circleOpacity: 1,
                circleStrokeWidth: 2,
                circleStrokeColor: '#0a0c0f',
              }}
            />
          </MapboxGL.ShapeSource>


        </MapboxGL.MapView>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>{dotColorMode === 'risk' ? 'RISK LEVEL' : dotColorMode.toUpperCase()}</Text>
          {(dotColorMode === 'risk' ? [
            { label: 'Critical', color: colors.critical },
            { label: 'High', color: colors.high },
            { label: 'Moderate', color: colors.moderate },
            { label: 'Low', color: colors.low },
          ] : [
            { label: 'Critical', color: colors.critical },
            { label: 'High', color: colors.high },
            { label: 'Moderate', color: colors.moderate },
            { label: 'Low', color: colors.low },
          ]).map((item) => (
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

        {/* Sensor callout — animated slide up */}
        {selectedSensor && (
          <Animated.View style={[styles.callout, {
            opacity: calloutAnim,
            transform: [{
              translateY: calloutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            }],
          }]}>
            <View style={[styles.calloutAccent, { backgroundColor: riskColorMap[selectedSensor.riskLevel] }]} />
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
                { label: 'Temp', value: `${selectedSensor.readings.temperature}°C`, color: colors.tempColor },
                { label: 'Humidity', value: `${selectedSensor.readings.humidity}%`, color: colors.humidityColor },
                { label: 'VOC', value: `${selectedSensor.readings.vocLevel} ppb`, color: colors.vocColor },
                { label: 'AQI', value: `${selectedSensor.readings.airQualityIndex}`, color: riskColorMap[selectedSensor.riskLevel] ?? colors.low },
              ].map((stat) => (
                <View key={stat.label} style={styles.calloutStat}>
                  <Text style={[styles.calloutStatValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.calloutStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
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
  segBtnActive: { backgroundColor: colors.bgCardAlt, borderColor: colors.accent },
  segText: { color: colors.textMuted, fontSize: font.xs, fontWeight: '600' },
  segTextActive: { color: colors.accent },
  colorFilterRow: { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingBottom: spacing.sm, gap: spacing.sm },
  colorFilterBtn: { paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  colorFilterBtnActive: { borderColor: colors.accent, backgroundColor: colors.bgCardAlt },
  colorFilterText: { color: colors.textMuted, fontSize: font.xs, fontWeight: '500' },
  colorFilterTextActive: { color: colors.accent, fontWeight: '700' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  legend: { position: 'absolute', top: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(17,20,24,0.93)', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  legendTitle: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: font.sm, fontWeight: '500' },
  sensorPill: { position: 'absolute', bottom: spacing.xl, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(17,20,24,0.93)', borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sensorPillText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  pin: { width: 24, height: 24, borderRadius: 12, borderWidth: 3 },
  callout: { position: 'absolute', bottom: spacing.xl * 3, left: spacing.lg, right: spacing.lg, backgroundColor: 'rgba(17,20,24,0.97)', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  calloutAccent: { height: 3, width: '100%' },
  calloutHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs, padding: spacing.lg, paddingBottom: 0 },
  calloutDot: { width: 8, height: 8, borderRadius: 4 },
  calloutName: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700', flex: 1 },
  calloutAddress: { color: colors.textMuted, fontSize: font.xs, marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  calloutStats: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, paddingTop: spacing.sm },
  calloutStat: { alignItems: 'center' },
  calloutStatValue: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700' },
  calloutStatLabel: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },
});