import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../constants/theme';
import { useAlerts } from '../../services/alert-context';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  badge?: number;
};

function TabIcon({ name, label, focused, badge }: TabIconProps): React.ReactElement {
  return (
    <View style={styles.tabItem}>
      <View style={styles.iconWrapper}>
        <Ionicons
          name={name}
          size={24}
          color={focused ? colors.accent : colors.labelTertiary}
        />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[styles.tabLabel, focused ? styles.tabLabelFocused : undefined]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { alerts } = useAlerts();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'map' : 'map-outline'} label="Map" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'radio' : 'radio-outline'} label="Zones" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'notifications' : 'notifications-outline'}
              label="Alerts"
              focused={focused}
              badge={alerts.length}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    height: Platform.OS === 'ios' ? 84 : 70,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
    paddingTop: spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingTop: spacing.xxs,
    minWidth: 60,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.critical,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.94)',
  },
  badgeText: {
    color: '#fff',
    fontSize: typography.size.caption2,
    fontWeight: typography.weight.bold,
    lineHeight: 13,
  },
  tabLabel: {
    color: colors.labelTertiary,
    fontSize: typography.size.caption2,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: colors.accent,
    fontWeight: typography.weight.semibold,
  },
});