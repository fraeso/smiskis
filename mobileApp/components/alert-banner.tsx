import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../constants/theme';

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
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
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
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close-circle" size={22} color={colors.labelTertiary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>{alert.description}</Text>
      <TouchableOpacity style={styles.actionButton}>
        <Ionicons name="call" size={16} color="#FFFFFF" />
        <Text style={styles.actionText}>{alert.callToAction}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.critical,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.critical,
  },
  title: {
    color: colors.label,
    fontSize: typography.size.headline,
    fontWeight: typography.weight.bold,
    flex: 1,
    lineHeight: typography.lineHeight.headline,
  },
  description: {
    color: colors.labelSecondary,
    fontSize: typography.size.subheadline,
    lineHeight: typography.lineHeight.subheadline,
    marginBottom: spacing.md,
    marginLeft: spacing.lg + spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.critical,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginLeft: spacing.lg + spacing.md,
    alignSelf: 'flex-start',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: typography.size.callout,
    fontWeight: typography.weight.semibold,
  },
});