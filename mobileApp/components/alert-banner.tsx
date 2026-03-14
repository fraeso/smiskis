import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font } from '../constants/theme';

type Alert = {
  title: string;
  description: string;
  callToAction: string;
};

export default function AlertBanner({ alert, onDismiss }: { alert: Alert | null; onDismiss: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!alert) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconRow}>
          <Animated.View style={[styles.pulsingDot, { opacity: pulse }]} />
          <Text style={styles.title}>{alert.title}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>{alert.description}</Text>
      <TouchableOpacity style={styles.callRow}>
        <Ionicons name="call" size={14} color={colors.critical} />
        <Text style={styles.callText}>{alert.callToAction}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.criticalBg,
    borderWidth: 1,
    borderColor: colors.criticalBorder,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.sm,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.critical,
    marginTop: 3,
  },
  title: {
    color: colors.critical,
    fontSize: font.md,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  dismiss: {
    color: colors.textMuted,
    fontSize: font.md,
    marginLeft: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: font.sm,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  callText: {
    color: colors.critical,
    fontSize: font.sm,
    fontWeight: '600',
  },
});