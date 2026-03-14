import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font } from '../constants/theme';

type Stats = { critical: number; elevated: number; normal: number };

function Badge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeCount, { color }]}>{count}</Text>
      <Text style={[styles.badgeLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function NetworkOverview({ stats }: { stats: Stats }) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Ionicons name="radio" size={14} color={colors.accentBlue} />
        <Text style={styles.label}>NETWORK OVERVIEW</Text>
      </View>
      <View style={styles.badges}>
        <Badge count={stats.critical} label="Critical" color={colors.critical} />
        <Badge count={stats.elevated} label="Elevated" color={colors.elevated} />
        <Badge count={stats.normal} label="Normal" color={colors.normal} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentBlue,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  badge: { alignItems: 'center' },
  badgeCount: {
    fontSize: font.xl,
    fontWeight: '800',
  },
  badgeLabel: {
    fontSize: font.xs,
    fontWeight: '500',
    opacity: 0.8,
  },
});