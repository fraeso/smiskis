import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font } from '../constants/theme';

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
        <Ionicons name={icon} size={14} color={accentColor ?? colors.textMuted} />
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
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flex: 1,
    minWidth: '47%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: font.xs,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    color: colors.textPrimary,
    fontSize: font.xxl,
    fontWeight: '700',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: font.sm,
    fontWeight: '500',
  },
});