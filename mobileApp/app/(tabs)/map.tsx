import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import { useSensors, SensorReading } from '../../services/sensor-context';
import { colors, font, spacing, radius } from '../../constants/theme';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!;
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Temperature (20-45°C) to heatmap weight (0.1-1.0)
const tempToWeight = (temp: number) => {
  const clamped = Math.min(Math.max(temp, 20), 45);
  return parseFloat(((clamped - 20) / 25).toFixed(2));
};
const aqiToBaseRadius = (aqi: number) => Math.round(8 + (Math.min(Math.max(aqi, 0), 500) / 500) * 42);

// ─── GeoJSON builders (now functions, called with live data) ──
const KM_LAT = 1 / 110.574;

const organicPolygon = (lat: number, lng: number, km: number, id: string, pts = 32): number[][] => {
  const latKm = KM_LAT;
  const lngKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (i: number) => { const x = Math.sin(seed * 9301 + i * 49297) * 233280; return x - Math.floor(x); };
  const coords = Array.from({ length: pts }, (_, i) => {
    const angle = (i / pts) * 2 * Math.PI;
    const r = km * (0.75 + rng(i) * 0.5);
    return [lng + r * Math.sin(angle) * lngKm, lat + r * Math.cos(angle) * latKm];
  });
  coords.push(coords[0]);
  return coords;
};

const aqiToKm = (aqi: number) => 1 + (Math.min(Math.max(aqi, 0), 500) / 500) * 24;

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

const getDotColor = (sensor: SensorReading, mode: DotColorMode): string => {
  switch (mode) {
    case 'temperature': return valueToColor(sensor.readings.temperature, 15, 45);
    case 'humidity': return valueToColor(100 - sensor.readings.humidity, 20, 80);
    case 'voc': return valueToColor(sensor.readings.vocLevel, 50, 700);
    case 'aqi': return valueToColor(sensor.readings.airQualityIndex, 0, 300);
    default: return riskColorMap[sensor.riskLevel] ?? colors.low;
  }
};

type SelectedSensor = SensorReading | null;

export default function MapScreen() {
  const { sensors, loading } = useSensors();
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [showHeat, setShowHeat] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [dotColorMode, setDotColorMode] = useState<DotColorMode>('risk');
  const params = useLocalSearchParams<{ sensorId?: string; lat?: string; lng?: string }>();
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const calloutAnim = useRef(new Animated.Value(0)).current;
  const hasFitBounds = useRef(false);

  // Derive selected sensor from live data — always up to date after polls
  const selectedSensor = selectedSensorId
    ? sensors.find(s => s.sensorId === selectedSensorId) ?? null
    : null;

  // Auto-fit camera to sensor bounds once data loads
  useEffect(() => {
    if (sensors.length === 0 || hasFitBounds.current) return;
    const lats = sensors.map(s => s.location.lat);
    const lngs = sensors.map(s => s.location.lng);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const pad = 0.5;
    cameraRef.current?.fitBounds(
      [maxLng + pad, maxLat + pad],
      [minLng - pad, minLat - pad],
      100,
      800,
    );
    hasFitBounds.current = true;
  }, [sensors]);

  // Build GeoJSON from live sensor data
  const pointGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
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
  }), [sensors]);

  const zoneGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: sensors.map((s) => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [organicPolygon(s.location.lat, s.location.lng, aqiToKm(s.readings.airQualityIndex), s.sensorId)],
      },
      properties: { sensorId: s.sensorId, riskLevel: s.riskLevel, aqi: s.readings.airQualityIndex },
    })),
  }), [sensors]);

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
          setSelectedSensorId(sensor.sensorId);
        }, 500);
      }
    }
  }, [params.sensorId]);

  const resetCamera = () => {
    if (sensors.length === 0) return;
    const lats = sensors.map(s => s.location.lat);
    const lngs = sensors.map(s => s.location.lng);
    cameraRef.current?.fitBounds(
      [Math.max(...lngs) + 0.5, Math.max(...lats) + 0.5],
      [Math.min(...lngs) - 0.5, Math.min(...lats) - 0.5],
      100, 800,
    );
    setSelectedSensorId(null);
  };

  const handleSensorPress = (e: any) => {
    const feature = e.features[0];
    if (feature?.properties) {
      const sensor = sensors.find(s => s.sensorId === feature.properties?.sensorId);
      if (sensor) setSelectedSensorId(sensor.sensorId);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          style={styles.map}
          styleURL="mapbox://styles/mapbox/dark-v11"
          logoEnabled={false}
          attributionEnabled={false}
          onPress={() => setSelectedSensorId(null)}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={4}
            centerCoordinate={[134.0, -25.0]}
            animationMode="flyTo"
            animationDuration={0}
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
              filter={selectedSensorId ? ['==', ['get', 'sensorId'], selectedSensorId] : ['==', '1', '0'] as any}
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

        {/* ── TOP CONTROLS OVERLAY — colour filter pills only ── */}
        <View style={styles.topControls}>
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
                style={[styles.colorFilterBtn, dotColorMode === item.mode ? styles.colorFilterBtnActive : undefined]}
                onPress={() => setDotColorMode(item.mode)}
              >
                <Text style={[styles.colorFilterText, dotColorMode === item.mode ? styles.colorFilterTextActive : undefined]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── BOTTOM LEFT — Risk legend ── */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>{dotColorMode === 'risk' ? 'RISK LEVEL' : dotColorMode.toUpperCase()}</Text>
          {[
            { label: 'Critical', color: colors.critical },
            { label: 'High', color: colors.high },
            { label: 'Moderate', color: colors.moderate },
            { label: 'Low', color: colors.low },
          ].map((item) => (
            <View key={item.label} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: item.color }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── BOTTOM RIGHT — Heat/Zones toggles + Sensor pill ── */}
        <View style={styles.bottomRight}>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segBtn, showHeat ? styles.segBtnActive : undefined]}
              onPress={() => setShowHeat(!showHeat)}
            >
              <Ionicons name="flame" size={13} color={showHeat ? colors.accent : colors.textMuted} />
              <Text style={[styles.segText, showHeat ? styles.segTextActive : undefined]}>Heat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, showZones ? styles.segBtnActive : undefined]}
              onPress={() => setShowZones(!showZones)}
            >
              <Ionicons name="radio" size={13} color={showZones ? colors.accent : colors.textMuted} />
              <Text style={[styles.segText, showZones ? styles.segTextActive : undefined]}>Zones</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.sensorPill} onPress={resetCamera}>
            <Ionicons name="locate" size={12} color={colors.textSecondary} />
            <Text style={styles.sensorPillText}>{sensors.length} Sensors Active</Text>
          </TouchableOpacity>
        </View>

        {/* Loading overlay — first load only */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <Ionicons name="radio-outline" size={24} color={colors.accent} />
              <Text style={styles.loadingText}>Loading sensors...</Text>
            </View>
          </View>
        )}

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
              <TouchableOpacity onPress={() => setSelectedSensorId(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },

  // ── Top: colour filter pills only ──
  topControls: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
  },
  colorFilterRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  colorFilterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,20,24,0.93)',
  },
  colorFilterBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(17,20,24,0.97)' },
  colorFilterText: { color: colors.textMuted, fontSize: font.xs, fontWeight: '500' },
  colorFilterTextActive: { color: colors.accent, fontWeight: '700' },

  // ── Bottom left: legend ──
  legend: {
    position: 'absolute',
    bottom: 30,
    left: spacing.lg,
    backgroundColor: 'rgba(17,20,24,0.93)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  legendTitle: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: font.sm, fontWeight: '500' },

  // ── Bottom right: toggles + sensor pill ──
  bottomRight: {
    position: 'absolute',
    bottom: 30,
    right: spacing.lg,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17,20,24,0.93)',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  segBtnActive: { backgroundColor: colors.bgCardAlt },
  segText: { color: colors.textMuted, fontSize: font.xs, fontWeight: '600' },
  segTextActive: { color: colors.accent },
  sensorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(17,20,24,0.93)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  sensorPillText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },

  // ── Loading & callout ──
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,12,15,0.6)' },
  loadingCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  loadingText: { color: colors.textSecondary, fontSize: font.md, fontWeight: '600' },
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