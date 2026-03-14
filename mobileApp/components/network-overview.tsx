import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../constants/theme';

type Stats = { critical: number; high: number; moderate: number; low: number };

function Badge({ count, label, color, bgColor }: { count: number; label: string; color: string; bgColor: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.badgeCount, { color }]}>{count}</Text>
      <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function NetworkOverview({ stats }: { stats: Stats }) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Fire Risk Overview</Text>
      <View style={styles.badges}>
        <Badge count={stats.critical} label="Critical" color={colors.critical} bgColor={colors.criticalBg} />
        <Badge count={stats.high} label="High" color={colors.high} bgColor={colors.highBg} />
        <Badge count={stats.moderate} label="Moderate" color={colors.moderate} bgColor={colors.moderateBg} />
        <Badge count={stats.low} label="Safe" color={colors.low} bgColor={colors.lowBg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.title3,
    fontWeight: typography.weight.bold,
    color: colors.label,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  badgeCount: {
    fontSize: typography.size.title2,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title2,
    marginBottom: spacing.xxs,
  },
  badgeLabel: {
    fontSize: typography.size.caption1,
    fontWeight: typography.weight.semibold,
  },
});
