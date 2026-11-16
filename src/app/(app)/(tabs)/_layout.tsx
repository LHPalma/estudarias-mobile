import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrail } from '@/api';
import { Icon, type IconName } from '@/components';
import { colors, fonts } from '@/theme';

export default function TabsLayout() {
  // O contador da aba Revisão vem da trilha, que as duas abas já mantêm em dia.
  const dueReviews = useTrail().data?.dueReviews ?? 0;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.progress,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 64 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: 13 },
        tabBarBadgeStyle: { backgroundColor: colors.error, color: colors.onStrong },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="trail"
        options={{
          title: 'Trilha',
          tabBarIcon: ({ focused }) => <TabIcon name="trail" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'Revisão',
          tabBarIcon: ({ focused }) => <TabIcon name="cards" focused={focused} />,
          tabBarBadge: dueReviews > 0 ? dueReviews : undefined,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Conta',
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Icon
      name={name}
      size={24}
      color={focused ? colors.progress : colors.inkSoft}
      strokeWidth={2}
    />
  );
}
