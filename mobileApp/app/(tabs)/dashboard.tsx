import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import { LineChart } from 'react-native-gifted-charts';
import AlertBanner from '../../components/alert-banner';
import NetworkOverview from '../../components/network-overview';
import StatCard from '../../components/stat-card';
import { activeAlert, networkStats, environmentalStats, sensors, Alert } from '../../constants/dummy-data';
import { colors, spacing, radius, font } from '../../constants/theme';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!;
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.xl * 2 - spacing.lg * 2;

const riskColor: Record<string, string> = {
  critical: colors.critical,
  elevated: colors.elevated,
  normal: colors.normal,
};

const dashSensorGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: sensors.map((sensor) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [sensor.location.lng, sensor.location.lat] },
    properties: { riskLevel: sensor.riskLevel },
  })),
};

// Generate 24hr trend data in gifted-charts format
const generateTrend = (base: number, variance: number, points = 24) =>
  Array.from({ length: points }, (_, i) => ({
    value: parseFloat((base + Math.sin(i * 0.5) * variance * 0.5 + (Math.random() - 0.5) * variance).toFixed(1)),
    label: i % 6 === 0 ? ['1pm', '7pm', '1am', '7am'][i / 6] : '',
    labelTextStyle: { color: colors.textMuted, fontSize: 9 },
  }));

const trendData = {
  temperature: generateTrend(environmentalStats.avgTemp, 6),
  humidity: generateTrend(environmentalStats.avgHumidity, 10),
  voc: generateTrend(220, 80),
  aqi: generateTrend(95, 40),
};

type ChartConfig = {
  key: keyof typeof trendData;
  label: string;
  unit: string;
  color: string;
};

const charts: ChartConfig[] = [
  { key: 'temperature', label: 'TEMPERATURE (°C)', unit: '°C', color: colors.tempColor },
  { key: 'humidity', label: 'HUMIDITY (%)', unit: '%', color: colors.humidityColor },
  { key: 'voc', label: 'VOC LEVEL (PPB)', unit: 'ppb', color: colors.vocColor },
  { key: 'aqi', label: 'AIR QUALITY INDEX', unit: 'AQI', color: colors.aqiColor },
];

function TrendChart({ config }: { config: ChartConfig }) {
  const data = trendData[config.key];
  const latest = data[data.length - 1]?.value ?? 0;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartLabel}>{config.label}</Text>
        <Text style={[styles.chartValue, { color: config.color }]}>
          {latest}<Text style={styles.chartUnit}> {config.unit}</Text>
        </Text>
      </View>

      <LineChart
        data={data}
        width={CHART_WIDTH}
        height={100}
        color={config.color}
        thickness={2}
        areaChart
        startFillColor={config.color}
        endFillColor={config.color}
        startOpacity={0.15}
        endOpacity={0.01}
        backgroundColor="transparent"
        noOfSections={3}
        yAxisColor="transparent"
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
        hideDataPoints
        curved
        rulesColor={colors.border}
        rulesType="dashed"
        yAxisThickness={0}
        xAxisThickness={1}
        pointerConfig={{
          pointerStripHeight: 80,
          pointerStripColor: colors.border,
          pointerStripWidth: 1,
          pointerColor: config.color,
          radius: 4,
          pointerLabelWidth: 80,
          pointerLabelHeight: 38,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: any[]) => (
            <View style={styles.tooltip}>
              <Text style={[styles.tooltipValue, { color: config.color }]}>{items[0]?.value}</Text>
              <Text style={styles.tooltipUnit}>{config.unit}</Text>
            </View>
          ),
        }}
      />

      <View style={styles.chartFooter}>
        <Text style={styles.chartStat}>Min: <Text style={{ color: colors.textSecondary }}>{min.toFixed(1)}</Text></Text>
        <Text style={styles.chartStat}>Max: <Text style={{ color: colors.textSecondary }}>{max.toFixed(1)}</Text></Text>
        <Text style={styles.chartStat}>Avg: <Text style={{ color: config.color }}>{((max + min) / 2).toFixed(1)}</Text></Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const [alert, setAlert] = useState<Alert | null>(activeAlert);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/images/react-logo.png')} style={{ width: 20, height: 20 }} />
            </View>
            <Text style={styles.appName}>AEROSAFE</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />
        <NetworkOverview stats={networkStats} />

        <View style={styles.statsGrid}>
          <StatCard icon="thermometer" label="AVG TEMP" value={environmentalStats.avgTemp} unit="°C" accentColor={colors.tempColor} />
          <StatCard icon="water" label="AVG HUMIDITY" value={environmentalStats.avgHumidity} unit="%" accentColor={colors.humidityColor} />
          <StatCard icon="cloud" label="MAX VOC" value={environmentalStats.maxVOC} unit="ppb" accentColor={colors.vocColor} />
          <StatCard icon="warning" label="MAX RISK" value={environmentalStats.maxRisk} unit="/100" accentColor={colors.critical} />
        </View>

        {/* Map Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RISK MAP</Text>
        </View>

        <TouchableOpacity style={styles.mapPreviewContainer} onPress={() => router.navigate('/(tabs)/map')} activeOpacity={0.9}>
          <MapboxGL.MapView
            style={styles.mapPreview}
            styleURL="mapbox://styles/mapbox/dark-v11"
            logoEnabled={false}
            attributionEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <MapboxGL.Camera zoomLevel={5.5} centerCoordinate={[145.0, -37.5]} animationDuration={0} />
            <MapboxGL.ShapeSource id="dash-sensors" shape={dashSensorGeoJSON}>
              <MapboxGL.CircleLayer
                id="dash-dots"
                sourceID="dash-sensors"
                style={{
                  circleRadius: 5,
                  circleColor: ['match', ['get', 'riskLevel'], 'critical', riskColor.critical, 'elevated', riskColor.elevated, riskColor.normal] as any,
                  circleOpacity: 1,
                  circleStrokeWidth: 1.5,
                  circleStrokeColor: '#0a0c0f',
                }}
              />
            </MapboxGL.ShapeSource>
          </MapboxGL.MapView>
          <View style={styles.mapOverlay}>
            <Ionicons name="expand" size={14} color={colors.textSecondary} />
            <Text style={styles.mapOverlayText}>Tap to expand</Text>
          </View>
        </TouchableOpacity>

        {/* 24hr Trends */}
        <View style={[styles.sectionHeader, { marginTop: spacing.sm }]}>
          <Text style={styles.sectionTitle}>24-HOUR TRENDS</Text>
          <Text style={styles.sectionSubtitle}>Avg across all sensors</Text>
        </View>

        {charts.map((chart) => (
          <TrendChart key={chart.key} config={chart} />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoContainer: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center' },
  appName: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '700', letterSpacing: 0.5 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.normal },
  liveText: { color: colors.normal, fontSize: font.xs, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 0.8 },
  sectionSubtitle: { color: colors.textMuted, fontSize: font.xs },
  mapPreviewContainer: { height: 200, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  mapPreview: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(17,20,24,0.85)', borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  mapOverlayText: { color: colors.textSecondary, fontSize: font.xs },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, overflow: 'hidden' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  chartLabel: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 0.8 },
  chartValue: { fontSize: font.xl, fontWeight: '700' },
  chartUnit: { fontSize: font.sm, fontWeight: '400', color: colors.textSecondary },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.sm },
  chartStat: { color: colors.textMuted, fontSize: font.xs },
  tooltip: { backgroundColor: colors.bgCard, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: 'center' },
  tooltipValue: { fontSize: font.md, fontWeight: '700' },
  tooltipUnit: { color: colors.textMuted, fontSize: font.xs },
});