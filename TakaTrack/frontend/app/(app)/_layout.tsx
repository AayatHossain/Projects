import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { DataProvider } from '../../src/data';
import { colors } from '../../src/theme';

function icon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>
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
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('🏠') }} />
        <Tabs.Screen name="expenses" options={{ title: 'Expenses', tabBarIcon: icon('💸') }} />
        <Tabs.Screen name="goals" options={{ title: 'Goals', tabBarIcon: icon('🎯') }} />
        <Tabs.Screen name="arcade" options={{ title: 'Arcade', tabBarIcon: icon('🎮') }} />
        <Tabs.Screen name="budget" options={{ title: 'Budget', tabBarIcon: icon('📊') }} />
        <Tabs.Screen name="assistant" options={{ title: 'Assistant', tabBarIcon: icon('🤖') }} />
      </Tabs>
    </DataProvider>
  );
}
