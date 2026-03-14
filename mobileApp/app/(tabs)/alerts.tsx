import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { allAlerts } from '../../constants/dummy-data';
import { colors, spacing, radius, font } from '../../constants/theme';

type Severity = 'all' | 'critical' | 'high' | 'moderate' | 'low';

const severityColor: Record<string, string> = {
  critical: colors.critical,
  high: colors.high,
  moderate: colors.moderate,
  low: colors.low,
};

const severityBg: Record<string, string> = {
  critical: colors.criticalBg,
  high: colors.highBg,
  moderate: colors.moderateBg,
  low: colors.lowBg,
};

export default function AlertsScreen() {
  const [filter, setFilter] = useState<Severity>('all');

  const filtered = filter === 'all'
    ? allAlerts
    : allAlerts.filter(a => a.severity === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Active and recent fire risk notifications</Text>

        {/* Filter Pills */}
        <View style={styles.filters}>
          {(['all', 'critical', 'high', 'moderate', 'low'] as Severity[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
                filter === f && f !== 'all' && { backgroundColor: severityBg[f], borderColor: severityColor[f] },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
                filter === f && f !== 'all' && { color: severityColor[f] },
              ]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alert Cards */}
        {filtered.map((alert) => {
          const color = severityColor[alert.severity] ?? colors.low;
          const bg = severityBg[alert.severity] ?? colors.lowBg;
          return (
            <View key={alert.id} style={[styles.alertCard, { borderColor: color + '40' }]}>
              <View style={styles.alertHeader}>
                <View style={[styles.severityPill, { backgroundColor: bg }]}>
                  <View style={[styles.severityDot, { backgroundColor: color }]} />
                  <Text style={[styles.severityText, { color }]}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </Text>
                </View>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>

              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDesc}>{alert.description}</Text>

              <View style={styles.locationTags}>
                {alert.locations.map((loc) => (
                  <View key={loc} style={styles.locationTag}>
                    <Ionicons name="location" size={10} color={colors.textMuted} />
                    <Text style={styles.locationTagText}>{loc}</Text>
                  </View>
                ))}
              </View>

              {alert.severity === 'critical' && (
                <TouchableOpacity style={styles.emergencyBtn}>
                  <Ionicons name="call" size={14} color={colors.critical} />
                  <Text style={styles.emergencyBtnText}>Call Triple Zero (000)</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No alerts for this level</Text>
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
  subtitle: { color: colors.textMuted, fontSize: font.sm, marginTop: 4, marginBottom: spacing.xl },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgCard },
  filterPillActive: { borderColor: colors.textSecondary, backgroundColor: colors.bgCardAlt },
  filterText: { color: colors.textMuted, fontSize: font.sm, fontWeight: '500' },
  filterTextActive: { color: colors.textPrimary, fontWeight: '700' },
  alertCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  severityPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: 6 },
  severityDot: { width: 6, height: 6, borderRadius: 3 },
  severityText: { fontSize: font.xs, fontWeight: '700' },
  alertTime: { color: colors.textMuted, fontSize: font.xs },
  alertTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700', marginBottom: spacing.xs },
  alertDesc: { color: colors.textSecondary, fontSize: font.sm, lineHeight: 18, marginBottom: spacing.md },
  locationTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.bgCardAlt, borderRadius: 6, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  locationTagText: { color: colors.textMuted, fontSize: font.xs },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.criticalBg, borderWidth: 1, borderColor: colors.criticalBorder, borderRadius: radius.md, paddingVertical: spacing.sm },
  emergencyBtnText: { color: colors.critical, fontSize: font.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: font.md },
});