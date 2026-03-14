import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts } from '../../services/alert-context';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';

type SeverityFilter = 'all' | 'critical' | 'high' | 'moderate' | 'low';

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
  const { alerts, connected, clearAlert } = useAlerts();
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const filtered = filter === 'all'
    ? alerts
    : alerts.filter(a => a.severity === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.subtitle}>Fire risk notifications</Text>
          </View>
          <View style={[styles.wsIndicator, { borderColor: connected ? colors.low : colors.border }]}>
            <View style={[styles.wsDot, { backgroundColor: connected ? colors.low : colors.textMuted }]} />
            <Text style={[styles.wsText, { color: connected ? colors.low : colors.textMuted }]}>
              {connected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filters}>
          {(['all', 'critical', 'high', 'moderate', 'low'] as SeverityFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
                filter === f && f !== 'all' && { backgroundColor: severityBg[f], borderColor: 'transparent' },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
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
        </ScrollView>

        {/* Alert cards */}
        {filtered.map((alert, index) => {
          const color = severityColor[alert.severity] ?? colors.low;
          const bg = severityBg[alert.severity] ?? colors.lowBg;
          return (
            <View key={alert.id} style={styles.alertWrapper}>
              {/* Timeline */}
              <View style={styles.timeline}>
                <View style={[styles.timelineDot, { backgroundColor: color }]} />
                {index < filtered.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Card */}
              <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={[styles.severityBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.severityText, { color }]}>{alert.severity.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                  <TouchableOpacity onPress={() => clearAlert(alert.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={14} color={colors.labelTertiary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.description}</Text>

                {alert.locations.length > 0 && (
                  <View style={styles.locationSection}>
                    <Ionicons name="location" size={14} color={colors.labelTertiary} />
                    <Text style={styles.locationText}>{alert.locations.join(', ')}</Text>
                  </View>
                )}

                {alert.callToAction && alert.severity === 'critical' && (
                  <TouchableOpacity style={styles.emergencyBtn} activeOpacity={0.8}>
                    <Ionicons name="call" size={16} color="#fff" />
                    <Text style={styles.emergencyBtnText}>{alert.callToAction}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.labelTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No {filter !== 'all' ? filter : ''} alerts</Text>
            <Text style={styles.emptyText}>
              {connected
                ? filter === 'all' ? 'All clear! No active alerts.' : `No ${filter} alerts to display.`
                : 'Connecting to alert service...'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xxxl + spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.sm },
  title: { fontSize: typography.size.largeTitle, fontWeight: typography.weight.bold, color: colors.label, letterSpacing: -0.8, marginBottom: 2 },
  subtitle: { fontSize: typography.size.subheadline, color: colors.labelSecondary },
  wsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, marginTop: 6 },
  wsDot: { width: 6, height: 6, borderRadius: 3 },
  wsText: { fontSize: typography.size.caption1, fontWeight: typography.weight.semibold },
  filtersContainer: { maxHeight: 44, marginBottom: spacing.md },
  filters: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.round, backgroundColor: colors.bgCard, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  filterPillActive: { backgroundColor: colors.label, borderColor: 'transparent' },
  filterText: { fontSize: typography.size.subheadline, fontWeight: typography.weight.medium, color: colors.labelSecondary },
  filterTextActive: { color: '#FFFFFF', fontWeight: typography.weight.semibold },
  alertWrapper: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.md },
  timeline: { width: 32, alignItems: 'center', paddingTop: spacing.xs },
  timelineDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.bg },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.separator, marginTop: spacing.xs, marginBottom: -spacing.md },
  alertCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.md, ...shadows.sm },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  severityBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.xs },
  severityText: { fontSize: typography.size.caption1, fontWeight: typography.weight.bold, letterSpacing: 0.5 },
  alertTime: { flex: 1, textAlign: 'right', fontSize: typography.size.footnote, color: colors.labelTertiary, marginRight: spacing.sm },
  alertTitle: { fontSize: typography.size.headline, fontWeight: typography.weight.semibold, color: colors.label, marginBottom: spacing.xs, lineHeight: typography.lineHeight.headline },
  alertDesc: { fontSize: typography.size.subheadline, color: colors.labelSecondary, lineHeight: typography.lineHeight.subheadline, marginBottom: spacing.sm },
  locationSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, backgroundColor: colors.fillTertiary, borderRadius: radius.sm, marginBottom: spacing.sm },
  locationText: { fontSize: typography.size.footnote, fontWeight: typography.weight.medium, color: colors.labelSecondary, flex: 1 },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.critical, borderRadius: radius.md, paddingVertical: spacing.sm, marginTop: spacing.xs },
  emergencyBtnText: { fontSize: typography.size.callout, fontWeight: typography.weight.semibold, color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadows.sm },
  emptyTitle: { fontSize: typography.size.title3, fontWeight: typography.weight.semibold, color: colors.label, marginBottom: spacing.xs },
  emptyText: { fontSize: typography.size.subheadline, color: colors.labelSecondary, textAlign: 'center', lineHeight: typography.lineHeight.subheadline },
});