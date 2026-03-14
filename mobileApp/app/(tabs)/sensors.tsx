import React, { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSensors, SensorReading } from '../../services/sensor-context';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';

type RiskFilter = 'all' | 'critical' | 'high' | 'moderate' | 'low';

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

const riskPriority: Record<string, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
};

type Zone = {
  name: string;
  sensors: SensorReading[];
  worstRisk: string;
  avgTemp: number;
  avgAqi: number;
};

// Memoized Zone Card Component for better performance
const ZoneCard = memo(({
  zone,
  isExpanded,
  onToggle,
  onSensorPress
}: {
  zone: Zone;
  isExpanded: boolean;
  onToggle: () => void;
  onSensorPress: (sensor: SensorReading) => void;
}) => {
  const color = riskColor[zone.worstRisk];
  const bgColor = riskBg[zone.worstRisk];

  return (
    <View style={styles.zoneCard}>
      <TouchableOpacity
        style={styles.zoneHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.zoneHeaderLeft}>
          <View style={[styles.riskIndicator, { backgroundColor: color }]} />
          <View style={styles.zoneInfo}>
            <Text style={styles.zoneName}>{zone.name}</Text>
            <Text style={styles.zoneCount}>
              {zone.sensors.length} sensor{zone.sensors.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.zoneHeaderRight}>
          <View style={[styles.riskBadge, { backgroundColor: bgColor }]}>
            <Text style={[styles.riskBadgeText, { color }]}>
              {zone.worstRisk.toUpperCase()}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.labelTertiary}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.zoneStats}>
        <View style={styles.zoneStat}>
          <Ionicons name="thermometer" size={14} color={colors.tempColor} />
          <Text style={styles.zoneStatValue}>{zone.avgTemp.toFixed(1)}°C</Text>
          <Text style={styles.zoneStatLabel}>Avg Temp</Text>
        </View>
        <View style={styles.zoneStat}>
          <Ionicons name="analytics" size={14} color={colors.aqiColor} />
          <Text style={styles.zoneStatValue}>{Math.round(zone.avgAqi)}</Text>
          <Text style={styles.zoneStatLabel}>Avg AQI</Text>
        </View>
        <View style={styles.zoneStat}>
          <Ionicons name="alert-circle" size={14} color={color} />
          <Text style={styles.zoneStatValue}>
            {zone.sensors.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high').length}
          </Text>
          <Text style={styles.zoneStatLabel}>At Risk</Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.sensorList}>
          {zone.sensors.map((sensor, index) => (
            <TouchableOpacity
              key={sensor.sensorId}
              style={[
                styles.sensorRow,
                index < zone.sensors.length - 1 && styles.sensorRowBorder,
              ]}
              onPress={() => onSensorPress(sensor)}
              activeOpacity={0.7}
            >
              <View style={styles.sensorRowLeft}>
                <View style={[styles.sensorDot, { backgroundColor: riskColor[sensor.riskLevel] }]} />
                <View style={styles.sensorInfo}>
                  <Text style={styles.sensorId}>{sensor.sensorId}</Text>
                  <Text style={styles.sensorAddress}>{sensor.location.address}</Text>
                </View>
              </View>

              <View style={styles.sensorRowRight}>
                <View style={styles.sensorReadings}>
                  <Text style={styles.sensorReading}>
                    {sensor.readings.temperature}°C
                  </Text>
                  <Text style={styles.sensorReading}>
                    AQI {sensor.readings.airQualityIndex}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

export default function SensorsScreen() {
  const { sensors, loading } = useSensors();
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [filter, setFilter] = useState<RiskFilter>('all');
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  // Memoize zone grouping - only recalculate when sensors change
  const zones = useMemo(() => {
    const grouped = sensors.reduce((acc, sensor) => {
      const zoneName = sensor.location.name;
      if (!acc[zoneName]) {
        acc[zoneName] = [];
      }
      acc[zoneName].push(sensor);
      return acc;
    }, {} as Record<string, SensorReading[]>);

    const zoneArray: Zone[] = Object.entries(grouped).map(([name, zoneSensors]) => {
      const worstRisk = zoneSensors.reduce((worst, s) => {
        return riskPriority[s.riskLevel] > riskPriority[worst] ? s.riskLevel : worst;
      }, 'low');

      const avgTemp = zoneSensors.reduce((sum, s) => sum + s.readings.temperature, 0) / zoneSensors.length;
      const avgAqi = zoneSensors.reduce((sum, s) => sum + s.readings.airQualityIndex, 0) / zoneSensors.length;

      return { name, sensors: zoneSensors, worstRisk, avgTemp, avgAqi };
    });

    return zoneArray.sort((a, b) => {
      const riskDiff = riskPriority[b.worstRisk] - riskPriority[a.worstRisk];
      if (riskDiff !== 0) return riskDiff;
      return b.avgAqi - a.avgAqi;
    });
  }, [sensors]);

  // Memoize filtered zones for display
  const filtered = useMemo(() => {
    return zones.filter((zone) => {
      const matchesZone = selectedZone === 'all' || zone.name === selectedZone;
      const matchesFilter = filter === 'all' || zone.worstRisk === filter || zone.sensors.some(s => s.riskLevel === filter);
      return matchesZone && matchesFilter;
    });
  }, [zones, selectedZone, filter]);

  // Memoize filtered zones for picker search
  const pickerZones = useMemo(() => {
    if (!pickerSearch.trim()) return zones;
    const searchLower = pickerSearch.toLowerCase();
    return zones.filter((zone) => zone.name.toLowerCase().includes(searchLower));
  }, [zones, pickerSearch]);

  const toggleZone = useCallback((zoneName: string) => {
    setExpandedZones((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(zoneName)) {
        newSet.delete(zoneName);
      } else {
        newSet.add(zoneName);
      }
      return newSet;
    });
  }, []);

  const navigateToSensor = useCallback((sensor: SensorReading) => {
    router.navigate({
      pathname: '/(tabs)/map',
      params: {
        sensorId: sensor.sensorId,
        lat: sensor.location.lat.toString(),
        lng: sensor.location.lng.toString(),
      },
    });
  }, []);

  const closePicker = useCallback(() => {
    setShowPicker(false);
    setPickerSearch('');
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Zones</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Loading...' : `${zones.length} locations · ${sensors.length} sensors`}
          </Text>
        </View>

        {/* Location Picker Button */}
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={18} color={colors.accent} />
          <Text style={styles.pickerButtonText}>
            {selectedZone === 'all' ? 'All Locations' : selectedZone}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.labelTertiary} />
        </TouchableOpacity>

        {/* Risk Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filters}
        >
          {(['all', 'critical', 'high', 'moderate', 'low'] as RiskFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
                filter === f && f !== 'all' && { backgroundColor: riskBg[f] },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                  filter === f && f !== 'all' && { color: riskColor[f] },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Zone Cards */}
        {filtered.map((zone) => (
          <ZoneCard
            key={zone.name}
            zone={zone}
            isExpanded={expandedZones.has(zone.name)}
            onToggle={() => toggleZone(zone.name)}
            onSensorPress={navigateToSensor}
          />
        ))}

        {/* Empty State */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={48} color={colors.labelTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No zones found</Text>
            <Text style={styles.emptyText}>
              Try selecting a different location or risk filter
            </Text>
          </View>
        )}
      </ScrollView>

      {/* iOS-Style Location Picker Modal */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={closePicker}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closePicker}
          />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Location</Text>
              <TouchableOpacity onPress={closePicker}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.pickerSearchContainer}>
              <Ionicons name="search" size={18} color={colors.labelTertiary} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search locations..."
                placeholderTextColor={colors.labelTertiary}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <ScrollView style={styles.pickerScroll}>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  selectedZone === 'all' && styles.pickerOptionActive
                ]}
                onPress={() => {
                  setSelectedZone('all');
                  closePicker();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={selectedZone === 'all' ? colors.accent : colors.labelSecondary}
                />
                <Text style={[
                  styles.pickerOptionText,
                  selectedZone === 'all' && styles.pickerOptionTextActive
                ]}>
                  All Locations
                </Text>
                {selectedZone === 'all' && (
                  <Ionicons name="checkmark" size={22} color={colors.accent} />
                )}
              </TouchableOpacity>
              {pickerZones.map((zone) => (
                <TouchableOpacity
                  key={zone.name}
                  style={[
                    styles.pickerOption,
                    selectedZone === zone.name && styles.pickerOptionActive
                  ]}
                  onPress={() => {
                    setSelectedZone(zone.name);
                    closePicker();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pickerOptionDot, { backgroundColor: riskColor[zone.worstRisk] }]} />
                  <View style={styles.pickerOptionInfo}>
                    <Text style={[
                      styles.pickerOptionText,
                      selectedZone === zone.name && styles.pickerOptionTextActive
                    ]}>
                      {zone.name}
                    </Text>
                    <Text style={styles.pickerOptionMeta}>
                      {zone.sensors.length} sensor{zone.sensors.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {selectedZone === zone.name && (
                    <Ionicons name="checkmark" size={22} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
              {pickerZones.length === 0 && pickerSearch.trim() && (
                <View style={styles.pickerEmpty}>
                  <Ionicons name="search-outline" size={32} color={colors.labelTertiary} />
                  <Text style={styles.pickerEmptyText}>No locations found</Text>
                  <Text style={styles.pickerEmptySubtext}>
                    Try a different search term
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.largeTitle,
    fontWeight: typography.weight.bold,
    color: colors.label,
    letterSpacing: -0.8,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: typography.size.subheadline,
    fontWeight: typography.weight.regular,
    color: colors.labelSecondary,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    color: colors.label,
  },
  filtersContainer: {
    maxHeight: 44,
    marginBottom: spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.fillTertiary,
  },
  filterPillActive: {
    backgroundColor: colors.label,
  },
  filterText: {
    fontSize: typography.size.subheadline,
    fontWeight: typography.weight.medium,
    color: colors.labelSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.weight.semibold,
  },
  zoneCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  zoneHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  riskIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: typography.size.headline,
    fontWeight: typography.weight.semibold,
    color: colors.label,
    marginBottom: spacing.xxs,
  },
  zoneCount: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.labelSecondary,
  },
  zoneHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  riskBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  riskBadgeText: {
    fontSize: typography.size.caption1,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
  },
  zoneStats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  zoneStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  zoneStatValue: {
    fontSize: typography.size.callout,
    fontWeight: typography.weight.bold,
    color: colors.label,
  },
  zoneStatLabel: {
    fontSize: typography.size.caption2,
    fontWeight: typography.weight.medium,
    color: colors.labelTertiary,
  },
  sensorList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    paddingTop: spacing.sm,
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sensorRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  sensorRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  sensorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorId: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.semibold,
    color: colors.label,
    marginBottom: 2,
  },
  sensorAddress: {
    fontSize: typography.size.caption1,
    fontWeight: typography.weight.regular,
    color: colors.labelTertiary,
  },
  sensorRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sensorReadings: {
    alignItems: 'flex-end',
    gap: 2,
  },
  sensorReading: {
    fontSize: typography.size.caption1,
    fontWeight: typography.weight.medium,
    color: colors.labelSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.fillTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.size.title3,
    fontWeight: typography.weight.semibold,
    color: colors.label,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.size.subheadline,
    fontWeight: typography.weight.regular,
    color: colors.labelSecondary,
    textAlign: 'center',
  },
  // iOS-Style Picker Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  pickerContainer: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    ...shadows.xl,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  pickerTitle: {
    fontSize: typography.size.headline,
    fontWeight: typography.weight.semibold,
    color: colors.label,
  },
  pickerDone: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    color: colors.accent,
  },
  pickerScroll: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  pickerOptionActive: {
    backgroundColor: colors.fillTertiary,
  },
  pickerOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pickerOptionInfo: {
    flex: 1,
  },
  pickerOptionText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.label,
    marginBottom: 2,
  },
  pickerOptionTextActive: {
    fontWeight: typography.weight.semibold,
    color: colors.accent,
  },
  pickerOptionMeta: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.regular,
    color: colors.labelTertiary,
  },
  pickerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.fillTertiary,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 40,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.regular,
    color: colors.label,
    height: 40,
  },
  pickerEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  pickerEmptyText: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.semibold,
    color: colors.label,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pickerEmptySubtext: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.regular,
    color: colors.labelTertiary,
  },
});
