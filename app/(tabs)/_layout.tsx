import { Tabs } from 'expo-router';
import { Bell, House, Ticket, User } from 'phosphor-react-native';
import { View, Text } from 'react-native';
import { COLORS, ICON_COLOR, ICON_SIZE } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

export default function TabsLayout() {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  function TabIcon({ icon: Icon, focused }: { icon: typeof House; focused: boolean }) {
    return <Icon size={ICON_SIZE} color={focused ? ICON_COLOR.active : ICON_COLOR.inactive} weight={focused ? 'fill' : 'regular'} />;
  }

  function NotifIcon({ focused }: { focused: boolean }) {
    return (
      <View>
        <Bell size={ICON_SIZE} color={focused ? ICON_COLOR.active : ICON_COLOR.inactive} weight={focused ? 'fill' : 'regular'} />
        {unreadCount > 0 && (
          <View style={{
            position: 'absolute', top: -4, right: -6,
            backgroundColor: COLORS.red, borderRadius: 8,
            minWidth: 16, height: 16,
            alignItems: 'center', justifyContent: 'center',
            paddingHorizontal: 3,
          }}>
            <Text style={{ color: COLORS.white, fontSize: 9, fontWeight: '800' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    );
  }

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
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          href: '/(tabs)/home',
          tabBarIcon: ({ focused }) => <TabIcon icon={House} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-queue"
        options={{
          title: 'My Queue',
          href: '/(tabs)/my-queue',
          tabBarIcon: ({ focused }) => <TabIcon icon={Ticket} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          href: '/(tabs)/notifications',
          tabBarIcon: ({ focused }) => <NotifIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: '/(tabs)/profile',
          tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} />,
        }}
      />
      {/* Removed admin tab - intentionally omitted from UI */}
    </Tabs>
  );
}
