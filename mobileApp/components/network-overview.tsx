import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font } from '../constants/theme';

type Stats = { critical: number; high: number; moderate: number; low: number };

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
        {/* <Ionicons name="radio" size={14} color={colors.accentBlue} /> */}
        <Text style={styles.label}>OVERVIEW</Text>
      </View>
      <View style={styles.badges}>
        <Badge count={stats.critical} label="Critical" color={colors.critical} />
        <Badge count={stats.high} label="High" color={colors.high} />
        <Badge count={stats.moderate} label="Moderate" color={colors.moderate} />
        <Badge count={stats.low} label="Low" color={colors.low} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { color: colors.textMuted, fontSize: font.xs, fontWeight: '700', letterSpacing: 0.8 },
  badges: { flexDirection: 'row', gap: spacing.md },
  badge: { alignItems: 'center' },
  badgeCount: { fontSize: font.xl, fontWeight: '800' },
  badgeLabel: { fontSize: font.xs, fontWeight: '500', opacity: 0.8 },
});