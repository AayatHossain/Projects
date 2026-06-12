import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { DataProvider } from '../../src/data';
import { colors } from '../../src/theme';

// Use a filled glyph when the tab is active, the outline variant when it isn't —
// the standard iOS/Material tab-bar pattern. Looks hand-built, not emoji-y.
function tabIcon(active: keyof typeof Ionicons.glyphMap, inactive: keyof typeof Ionicons.glyphMap) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size ?? 22} color={color} />
  );
}

export default function AppLayout() {
  return (
    <DataProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.teal,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: colors.lineStrong,
            borderTopWidth: 1,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700' },
        }}>
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}
        />
        <Tabs.Screen
          name="expenses"
          options={{ title: 'Expenses', tabBarIcon: tabIcon('wallet', 'wallet-outline') }}
        />
        <Tabs.Screen
          name="goals"
          options={{ title: 'Goals', tabBarIcon: tabIcon('flag', 'flag-outline') }}
        />
        <Tabs.Screen
          name="arcade"
          options={{ title: 'Arcade', tabBarIcon: tabIcon('game-controller', 'game-controller-outline') }}
        />
        <Tabs.Screen
          name="budget"
          options={{ title: 'Budget', tabBarIcon: tabIcon('pie-chart', 'pie-chart-outline') }}
        />
        <Tabs.Screen
          name="assistant"
          options={{ title: 'Assistant', tabBarIcon: tabIcon('sparkles', 'sparkles-outline') }}
        />
        {/* Routable via the avatar on Home, but hidden from the tab bar. */}
        <Tabs.Screen name="account" options={{ href: null }} />
      </Tabs>
    </DataProvider>
  );
}
