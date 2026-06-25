import { Tabs } from 'expo-router';

import { DataProvider } from '../../src/data';
import { AppTabBar } from '../../src/TabBar';

export default function AppLayout() {
  return (
    <DataProvider>
      <Tabs screenOptions={{ headerShown: false }} tabBar={() => <AppTabBar />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="notifications" />
        <Tabs.Screen name="expenses" />
        <Tabs.Screen name="goals" />
        <Tabs.Screen name="transactions" />
        <Tabs.Screen name="budget" />
        <Tabs.Screen name="learning" />
        <Tabs.Screen name="assistant" />
        <Tabs.Screen name="account" />
        <Tabs.Screen name="insights" />
        <Tabs.Screen name="quiz" />
      </Tabs>
    </DataProvider>
  );
}
