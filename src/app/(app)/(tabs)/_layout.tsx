import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2846C8',
        tabBarInactiveTintColor: '#5C5951',
      }}
    >
      <Tabs.Screen name="trail" options={{ title: 'Trilha' }} />
      <Tabs.Screen name="review" options={{ title: 'Revisão' }} />
    </Tabs>
  );
}
