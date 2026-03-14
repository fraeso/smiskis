import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { sensors, SensorReading } from '../../constants/dummy-data';
import { colors, spacing, radius, font } from '../../constants/theme';

type RiskFilter = 'all' | 'critical' | 'high' | 'moderate' | 'low';
type SortKey = 'name' | 'aqi' | 'temperature';

const riskColor: Record<string, string> = {
  critical: colors.critical,
  high: colors.high,
  moderate: colors.moderate,
  low: colors.low,
};

const riskBg: Record<string, string> = {
  critical: colors.criticalBg,
  high: colors.highBg,
  moderate: colors.moderateBg,
  low: colors.lowBg,
};

export default function SensorsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RiskFilter>('all');
  const [sort, setSort] = useState<SortKey>('aqi');

  const filtered = sensors
    .filter(s => filter === 'all' || s.riskLevel === filter)
    .filter(s =>
      s.location.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location.address.toLowerCase().includes(search.toLowerCase()) ||
      s.sensorId.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name') return a.location.name.localeCompare(b.location.name);
      if (sort === 'aqi') return b.readings.airQualityIndex - a.readings.airQualityIndex;
      if (sort === 'temperature') return b.readings.temperature - a.readings.temperature;
      return 0;
    });

  const navigateToSensor = (sensor: SensorReading) => {
    router.navigate({
      pathname: '/(tabs)/map',
      params: {
        sensorId: sensor.sensorId,
        lat: sensor.location.lat,
        lng: sensor.location.lng,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sensors</Text>
        <Text style={styles.subtitle}>{sensors.length} monitoring stations across Victoria</Text>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, location or ID..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Risk filter pills */}
        <View style={styles.filters}>
          {(['all', 'critical', 'high', 'moderate', 'low'] as RiskFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
                filter === f && f !== 'all' && { backgroundColor: riskBg[f], borderColor: riskColor[f] },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
                filter === f && f !== 'all' && { color: riskColor[f] },
              ]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by</Text>
          {(['aqi', 'temperature', 'name'] as SortKey[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortBtn, sort === s && styles.sortBtnActive]}
              onPress={() => setSort(s)}
            >
              <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>
                {s === 'aqi' ? 'AQI' : s === 'temperature' ? 'Temp' : 'Name'}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.resultCount}>{filtered.length} results</Text>
        </View>

        {/* Sensor list */}
        {filtered.map((sensor) => (
          <TouchableOpacity
            key={sensor.sensorId}
            style={styles.sensorCard}
            onPress={() => navigateToSensor(sensor)}
            activeOpacity={0.75}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.riskPill, { backgroundColor: riskBg[sensor.riskLevel] }]}>
                <View style={[styles.riskDot, { backgroundColor: riskColor[sensor.riskLevel] }]} />
                <Text style={[styles.riskText, { color: riskColor[sensor.riskLevel] }]}>
                  {sensor.riskLevel.charAt(0).toUpperCase() + sensor.riskLevel.slice(1)}
                </Text>
              </View>
              <Text style={styles.sensorId}>{sensor.sensorId}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>

            <Text style={styles.sensorName}>{sensor.location.name}</Text>
            <Text style={styles.sensorAddress}>{sensor.location.address}</Text>

            <View style={styles.readings}>
              {[
                { icon: 'thermometer' as const, value: `${sensor.readings.temperature}°C`, color: colors.tempColor },
                { icon: 'water' as const, value: `${sensor.readings.humidity}%`, color: colors.humidityColor },
                { icon: 'cloud' as const, value: `${sensor.readings.vocLevel} ppb`, color: colors.vocColor },
                { icon: 'warning' as const, value: `AQI ${sensor.readings.airQualityIndex}`, color: riskColor[sensor.riskLevel] },
              ].map((r) => (
                <View key={r.icon} style={styles.reading}>
                  <Ionicons name={r.icon} size={12} color={r.color} />
                  <Text style={[styles.readingValue, { color: r.color }]}>{r.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.coords}>{sensor.location.lat.toFixed(3)}, {sensor.location.lng.toFixed(3)}</Text>
              <Text style={styles.timestamp}>Updated {new Date(sensor.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No sensors match your search</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
  title: { color: colors.textPrimary, fontSize: font.xxxl, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.textMuted, fontSize: font.sm, marginTop: 4, marginBottom: spacing.lg },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: font.md, paddingVertical: spacing.md },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  filterPillActive: { borderColor: colors.textSecondary, backgroundColor: colors.bgCardAlt },
  filterText: { color: colors.textMuted, fontSize: font.sm, fontWeight: '500' },
  filterTextActive: { color: colors.textPrimary, fontWeight: '700' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  sortLabel: { color: colors.textMuted, fontSize: font.xs },
  sortBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  sortBtnActive: { borderColor: colors.accentBlue, backgroundColor: colors.bgCardAlt },
  sortText: { color: colors.textMuted, fontSize: font.xs, fontWeight: '500' },
  sortTextActive: { color: colors.accentBlue, fontWeight: '700' },
  resultCount: { color: colors.textMuted, fontSize: font.xs, marginLeft: 'auto' },
  sensorCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  riskPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6 },
  riskDot: { width: 6, height: 6, borderRadius: 3 },
  riskText: { fontSize: font.xs, fontWeight: '700' },
  sensorId: { color: colors.textMuted, fontSize: font.xs, flex: 1 },
  sensorName: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700', marginBottom: 2 },
  sensorAddress: { color: colors.textMuted, fontSize: font.xs, marginBottom: spacing.md },
  readings: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bgCardAlt, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm },
  reading: { alignItems: 'center', gap: 4 },
  readingValue: { fontSize: font.xs, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  coords: { color: colors.textMuted, fontSize: font.xs, flex: 1 },
  timestamp: { color: colors.textMuted, fontSize: font.xs },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: font.md },
});