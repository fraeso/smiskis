// @ts-nocheck
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MapboxGL from '@rnmapbox/maps';
import { LineChart } from 'react-native-gifted-charts';
import AlertBanner from '../../components/alert-banner';
import NetworkOverview from '../../components/network-overview';
import StatCard from '../../components/stat-card';
import { useSensors } from '../../services/sensor-context';
import { useAlerts } from '../../services/alert-context';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';

const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN!;
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.xl * 2 - spacing.lg * 2;

const riskColor: Record<string, string> = {
  critical: colors.critical,
  high: colors.high,
  moderate: colors.moderate,
  low: colors.low,
};

// Generate 24hr trend data
const generateTrend = (base: number, variance: number, points = 24) =>
  Array.from({ length: points }, (_, i) => ({
    value: parseFloat((base + Math.sin(i * 0.5) * variance * 0.5 + (Math.random() - 0.5) * variance).toFixed(1)),
    label: i % 6 === 0 ? ['1pm', '7pm', '1am', '7am'][i / 6] : '',
    labelTextStyle: { color: colors.labelTertiary, fontSize: 9 },
  }));

type ChartConfig = {
  key: 'temperature' | 'humidity' | 'voc' | 'aqi';
  label: string;
  unit: string;
  color: string;
};

const charts: ChartConfig[] = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: colors.tempColor },
  { key: 'humidity', label: 'Humidity', unit: '%', color: colors.humidityColor },
  { key: 'voc', label: 'VOC Level', unit: 'ppb', color: colors.vocColor },
  { key: 'aqi', label: 'Air Quality', unit: 'AQI', color: colors.aqiColor },
];

function TrendChart({ config, data }: { config: ChartConfig; data: { value: number; label: string; labelTextStyle: any }[] }) {
  const latest = data[data.length - 1]?.value ?? 0;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{config.label}</Text>
        <Text style={[styles.chartValue, { color: config.color }]}>
          {latest}
          <Text style={styles.chartUnit}> {config.unit}</Text>
        </Text>
      </View>

      <LineChart
        data={data}
        width={CHART_WIDTH}
        height={120}
        color={config.color}
        thickness={2.5}
        areaChart
        startFillColor={config.color}
        endFillColor={config.color}
        startOpacity={0.2}
        endOpacity={0.02}
        backgroundColor="transparent"
        noOfSections={3}
        maxValue={Math.ceil((max * 1.15) / 10) * 10}
        yAxisColor="transparent"
        xAxisColor={colors.separator}
        yAxisTextStyle={{ color: colors.labelTertiary, fontSize: 10 }}
        yAxisLabelWidth={32}
        initialSpacing={0}
        endSpacing={0}
        hideDataPoints
        curved
        rulesColor={colors.separator}
        rulesType="solid"
        yAxisThickness={0}
        xAxisThickness={StyleSheet.hairlineWidth}
        pointerConfig={{
          pointerStripHeight: 100,
          pointerStripColor: colors.separator,
          pointerStripWidth: 1.5,
          pointerColor: config.color,
          radius: 5,
          pointerLabelWidth: 80,
          pointerLabelHeight: 42,
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
        <View style={styles.chartStat}>
          <Text style={styles.chartStatLabel}>Min</Text>
          <Text style={styles.chartStatValue}>{min.toFixed(1)}</Text>
        </View>
        <View style={styles.chartStat}>
          <Text style={styles.chartStatLabel}>Avg</Text>
          <Text style={[styles.chartStatValue, { color: config.color }]}>
            {((max + min) / 2).toFixed(1)}
          </Text>
        </View>
        <View style={styles.chartStat}>
          <Text style={styles.chartStatLabel}>Max</Text>
          <Text style={styles.chartStatValue}>{max.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { sensors, networkStats, environmentalStats, loading } = useSensors();
  const { alerts, clearAlert } = useAlerts();

  const bannerAlert = alerts.find(a => a.severity === 'critical' || a.severity === 'high') ?? null;

  const trendData = useMemo(() => ({
    temperature: generateTrend(environmentalStats.avgTemp || 30, 6),
    humidity: generateTrend(environmentalStats.avgHumidity || 40, 10),
    voc: generateTrend(220, 80),
    aqi: generateTrend(95, 40),
  }), [environmentalStats.avgTemp, environmentalStats.avgHumidity]);

  const dashSensorGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: sensors.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.location.lng, s.location.lat] },
      properties: { riskLevel: s.riskLevel },
    })),
  }), [sensors]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* <Text style={styles.headerTitle}>AeroSafe</Text> */}
          {/* <Image source={require('../../assets/images/a-full.png')} style={{ width: 170, height: 170 }} /> */}
          <Image 
            source={require('../../assets/images/a-full.png')} 
            style={{ width: 160, height: 160, margin: -30, marginBottom: -75, marginTop: -60 }} 
            resizeMode="contain"
          />
          {/* <TouchableOpacity style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </TouchableOpacity> */}
        </View>

        {/* Alert Banner */}
        {bannerAlert && <AlertBanner alert={bannerAlert} onDismiss={() => clearAlert(bannerAlert.id)} />}

        {/* Network Overview */}
        <NetworkOverview stats={networkStats} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="thermometer" label="AVG TEMP" value={environmentalStats.avgTemp} unit="°C" accentColor={colors.tempColor} />
          <StatCard icon="water" label="HUMIDITY" value={environmentalStats.avgHumidity} unit="%" accentColor={colors.humidityColor} />
          <StatCard icon="cloud" label="MAX VOC" value={environmentalStats.maxVOC} unit="ppb" accentColor={colors.vocColor} />
          <StatCard icon="warning" label="MAX RISK" value={environmentalStats.maxRisk} unit="/100" accentColor={colors.critical} />
        </View>

        {/* Map Preview */}
        <Text style={styles.sectionTitle}>Risk Map</Text>
        <TouchableOpacity
          style={styles.mapPreviewContainer}
          onPress={() => router.navigate('/(tabs)/map')}
          activeOpacity={0.95}
        >
          <MapboxGL.MapView
            style={styles.mapPreview}
            styleURL="mapbox://styles/mapbox/light-v11"
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
                  circleColor: [
                    'match', ['get', 'riskLevel'],
                    'critical', riskColor.critical,
                    'high', riskColor.high,
                    'moderate', riskColor.moderate,
                    riskColor.low,
                  ] as any,
                  circleOpacity: 1,
                  circleStrokeWidth: 1.5,
                  circleStrokeColor: '#FFFFFF',
                }}
              />
            </MapboxGL.ShapeSource>
          </MapboxGL.MapView>
          <View style={styles.mapOverlay}>
            <Ionicons name="expand" size={16} color="#FFFFFF" />
            <Text style={styles.mapOverlayText}>Tap to expand</Text>
          </View>
        </TouchableOpacity>

        {/* 24hr Trends */}
        <Text style={styles.sectionTitle}>24-Hour Trends</Text>
        <Text style={styles.sectionSubtitle}>Average across all sensors</Text>

        {charts.map((chart) => (
          <TrendChart key={chart.key} config={chart} data={trendData[chart.key]} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl + spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  headerTitle: { fontSize: typography.size.largeTitle, fontWeight: typography.weight.bold, color: colors.label, letterSpacing: -0.8 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.lowBg, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.low },
  liveText: { color: colors.low, fontSize: typography.size.footnote, fontWeight: typography.weight.semibold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.size.title3, fontWeight: typography.weight.bold, color: colors.label, marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  sectionSubtitle: { fontSize: typography.size.footnote, fontWeight: typography.weight.regular, color: colors.labelSecondary, marginBottom: spacing.md, marginTop: -spacing.sm, paddingHorizontal: spacing.xs },
  mapPreviewContainer: { height: 240, borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.lg, backgroundColor: colors.bgCard, ...shadows.md },
  mapPreview: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(0, 0, 0, 0.75)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  mapOverlayText: { color: '#FFFFFF', fontSize: typography.size.footnote, fontWeight: typography.weight.medium },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chartTitle: { fontSize: typography.size.headline, fontWeight: typography.weight.semibold, color: colors.label },
  chartValue: { fontSize: typography.size.title2, fontWeight: typography.weight.bold, lineHeight: typography.lineHeight.title2 },
  chartUnit: { fontSize: typography.size.subheadline, fontWeight: typography.weight.regular, color: colors.labelSecondary },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  chartStat: { alignItems: 'center', gap: spacing.xxs },
  chartStatLabel: { fontSize: typography.size.caption1, fontWeight: typography.weight.medium, color: colors.labelTertiary },
  chartStatValue: { fontSize: typography.size.callout, fontWeight: typography.weight.semibold, color: colors.label },
  tooltip: { backgroundColor: colors.bgCard, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center', ...shadows.md },
  tooltipValue: { fontSize: typography.size.callout, fontWeight: typography.weight.bold },
  tooltipUnit: { fontSize: typography.size.caption2, fontWeight: typography.weight.medium, color: colors.labelSecondary, marginTop: spacing.xxs },
});