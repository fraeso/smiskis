// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { allAlerts } from '../../constants/dummy-data';
import { colors, spacing, radius, typography, shadows } from '../../constants/theme';

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
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Alerts</Text>
          <Text style={styles.subtitle}>Fire risk notifications</Text>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filters}
        >
          {(['all', 'critical', 'high', 'moderate', 'low'] as Severity[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
                filter === f && f !== 'all' && {
                  backgroundColor: severityBg[f],
                  borderColor: 'transparent',
                },
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                  filter === f && f !== 'all' && { color: severityColor[f] },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Alert Cards */}
        {filtered.map((alert, index) => {
          const color = severityColor[alert.severity] ?? colors.low;
          const bg = severityBg[alert.severity] ?? colors.lowBg;
          const isFirst = index === 0;

          return (
            <View key={alert.id} style={styles.alertWrapper}>
              {/* Timeline indicator */}
              <View style={styles.timeline}>
                <View style={[styles.timelineDot, { backgroundColor: color }]} />
                {index < filtered.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Alert content */}
              <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={[styles.severityBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.severityText, { color }]}>
                      {alert.severity.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>

                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.description}</Text>

                {/* Locations */}
                {alert.locations.length > 0 && (
                  <View style={styles.locationSection}>
                    <Ionicons name="location" size={14} color={colors.labelTertiary} />
                    <Text style={styles.locationText}>
                      {alert.locations.join(', ')}
                    </Text>
                  </View>
                )}

                {/* Emergency button for critical alerts */}
                {alert.severity === 'critical' && (
                  <TouchableOpacity style={styles.emergencyBtn} activeOpacity={0.8}>
                    <Ionicons name="call" size={16} color="#FFFFFF" />
                    <Text style={styles.emergencyBtnText}>Call Triple Zero (000)</Text>
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
              {filter === 'all'
                ? 'All clear! No active alerts at this time.'
                : `No ${filter} level alerts to display.`}
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  filtersContainer: {
    maxHeight: 44,
    marginBottom: spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: colors.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  filterPillActive: {
    backgroundColor: colors.label,
    borderColor: 'transparent',
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
  alertWrapper: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  timeline: {
    width: 32,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.separator,
    marginTop: spacing.xs,
    marginBottom: -spacing.md,
  },
  alertCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.xs,
  },
  severityText: {
    fontSize: typography.size.caption1,
    fontWeight: typography.weight.bold,
    letterSpacing: 0.5,
  },
  alertTime: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.labelTertiary,
  },
  alertTitle: {
    fontSize: typography.size.headline,
    fontWeight: typography.weight.semibold,
    color: colors.label,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.headline,
  },
  alertDesc: {
    fontSize: typography.size.subheadline,
    fontWeight: typography.weight.regular,
    color: colors.labelSecondary,
    lineHeight: typography.lineHeight.subheadline,
    marginBottom: spacing.md,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.fillTertiary,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.medium,
    color: colors.labelSecondary,
    flex: 1,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.critical,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  emergencyBtnText: {
    fontSize: typography.size.callout,
    fontWeight: typography.weight.semibold,
    color: '#FFFFFF',
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
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
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
    lineHeight: typography.lineHeight.subheadline,
  },
});
