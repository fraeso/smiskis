import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, font } from '../constants/theme';
import { Image } from 'react-native';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>

        <Image 
          source={require('../assets/images/react-logo.png')} 
          style={{ width: 60, height: 60 }} 
        />

        <Text style={styles.appName}>AEROSAFE</Text>
        <Text style={styles.tagline}>Welcome to the AEROSAFE demo app.</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/dashboard')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Enter App</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

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
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: font.xxxl,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: font.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.critical,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: font.lg,
    fontWeight: '700',
  },
});