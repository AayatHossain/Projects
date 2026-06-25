import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { DataProvider, useData } from '../../src/data';
import { colors } from '../../src/theme';

function tabIcon(active: keyof typeof Ionicons.glyphMap, inactive: keyof typeof Ionicons.glyphMap) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size ?? 22} color={color} />
  );
}

export default function AppLayout() {
  return (
    <DataProvider>
      <TabsNav />
    </DataProvider>
  );
}

function TabsNav() {
  const { pending } = useData();
  return (
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
          name="notifications"
          options={{
            title: 'Inbox',
            tabBarIcon: tabIcon('notifications', 'notifications-outline'),
            tabBarBadge: pending.length || undefined,
            tabBarBadgeStyle: { backgroundColor: colors.red, fontSize: 10 },
          }}
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
          name="learning"
          options={{ title: 'Learning', tabBarIcon: tabIcon('school', 'school-outline') }}
        />
        <Tabs.Screen
          name="budget"
          options={{ title: 'Budget', tabBarIcon: tabIcon('pie-chart', 'pie-chart-outline') }}
        />
        <Tabs.Screen
          name="assistant"
          options={{ title: 'Assistant', tabBarIcon: tabIcon('sparkles', 'sparkles-outline') }}
        />
        <Tabs.Screen name="account" options={{ href: null }} />
        <Tabs.Screen name="insights" options={{ href: null }} />
        <Tabs.Screen name="quiz" options={{ href: null }} />
        <Tabs.Screen name="shop" options={{ href: null }} />
      </Tabs>
  );
}
