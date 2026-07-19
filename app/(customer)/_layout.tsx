import { Tabs } from 'expo-router';
import { House, Ticket, User } from 'phosphor-react-native';
import { View, Text } from 'react-native';
import { COLORS, ICON_COLOR, ICON_SIZE } from '../../lib/constants';
import { NotificationBadge } from '../../components/NotificationBadge';

console.log('👤 [Customer] Layout mounted');

export default function CustomerLayout() {
  console.log('👤 [Customer] Rendering');

  function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
    return <Icon size={ICON_SIZE} color={focused ? ICON_COLOR.active : ICON_COLOR.inactive} weight={focused ? 'fill' : 'regular'} />;
  }

  const tabs = [
    { name: 'home', title: 'Home', icon: House },
    { name: 'my-queue', title: 'My Queue', icon: Ticket },
    { name: 'notifications', title: 'Alerts', notif: true },
    { name: 'profile', title: 'Profile', icon: User },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.red,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray200,
          borderTopWidth: 0.5,
          height: 62,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => 
              tab.notif ? (
                <NotificationBadge focused={focused} />
              ) : (
                <TabIcon icon={tab.icon} focused={focused} />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}