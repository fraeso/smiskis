import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../constants/theme';
import { Image } from 'react-native';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Icon container with gradient background */}
        <View style={styles.iconContainer}>
          <Image source={require('../assets/images/react-logo.png')} style={{ width: 40, height: 40 }} />
        </View>

        {/* App branding */}
        <View style={styles.brandingContainer}>
          <Text style={styles.appName}>AeroSafe</Text>
          <Text style={styles.tagline}>
            Real-time fire risk monitoring{'\n'}for your safety
          </Text>
        </View>

        {/* Features list */}
        <View style={styles.features}>
          {[
            { icon: 'analytics', text: 'Live environmental monitoring' },
            { icon: 'map', text: 'Interactive risk visualization' },
            { icon: 'notifications', text: 'Instant emergency alerts' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={20} color={colors.accent} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/dashboard')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          Emergency monitoring dashboard
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.xxxl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xl,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  appName: {
    color: colors.label,
    fontSize: typography.size.largeTitle,
    fontWeight: typography.weight.heavy,
    letterSpacing: -1.2,
    marginBottom: spacing.sm,
  },
  tagline: {
    color: colors.labelSecondary,
    fontSize: typography.size.body,
    fontWeight: typography.weight.regular,
    textAlign: 'center',
    lineHeight: typography.lineHeight.body,
  },
  features: {
    width: '100%',
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    // borderRadius: 20,
    // backgroundColor: colors.fillTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: colors.label,
    fontSize: typography.size.callout,
    fontWeight: typography.weight.medium,
    flex: 1,
  },
  ctaContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: typography.size.headline,
    fontWeight: typography.weight.semibold,
  },
  disclaimer: {
    color: colors.labelTertiary,
    fontSize: typography.size.footnote,
    fontWeight: typography.weight.regular,
    textAlign: 'center',
  },
});