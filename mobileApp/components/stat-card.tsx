import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../constants/theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  unit: string;
  accentColor?: string;
};

export default function StatCard({ icon, label, value, unit, accentColor }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Ionicons name={icon} size={18} color={accentColor ?? colors.labelTertiary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, accentColor ? { color: accentColor } : {}]}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    flex: 1,
    minWidth: '47%',
    ...shadows.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    color: colors.labelSecondary,
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    color: colors.label,
    fontSize: typography.size.title1,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.title1,
  },
  unit: {
    color: colors.labelSecondary,
    fontSize: typography.size.callout,
    fontWeight: typography.weight.medium,
  },
});