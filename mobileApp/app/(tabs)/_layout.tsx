import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font } from '../../constants/theme';
type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
};

function TabIcon({ name, label, focused }: TabIconProps): React.ReactElement {
  return (
    <View style={styles.tabItem}>
      <Ionicons name={name} size={22} color={focused ? colors.accent : colors.textMuted} />
      <Text numberOfLines={1} style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
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
            <TabIcon name={focused ? 'radio' : 'radio-outline'} label="Sensors" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'notifications' : 'notifications-outline'} label="Alerts" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 70,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabItem: { alignItems: 'center', gap: 3 },
  tabLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '500' },
  tabLabelFocused: { color: colors.accent, fontWeight: '700' },
});