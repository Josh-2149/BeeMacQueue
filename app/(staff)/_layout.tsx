import { Tabs } from 'expo-router';
import { Storefront, Ticket, Bell, User } from 'phosphor-react-native';
import { View, Text } from 'react-native';
import { COLORS, ICON_COLOR, ICON_SIZE } from '../../lib/constants';
import { NotificationBadge } from '../../components/NotificationBadge';
import { useAuth } from '../../hooks/useAuth';

console.log('🏪 [Staff] Layout mounted');

export default function StaffLayout() {
  console.log('🏪 [Staff] Rendering');
  const { profile } = useAuth();

  function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
    return <Icon size={ICON_SIZE} color={focused ? ICON_COLOR.active : ICON_COLOR.inactive} weight={focused ? 'fill' : 'regular'} />;
  }

  // ✅ FIXED: Proper tab labels
  const tabs = [
    { name: 'dashboard', title: 'Dashboard', icon: Storefront },
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
          height: 58,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700' },
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