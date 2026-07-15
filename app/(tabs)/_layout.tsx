import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { COLORS } from '../../lib/constants';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';

export default function TabsLayout() {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  function TabIcon({ name, focused }: { name: any; focused: boolean }) {
    return (
      <Ionicons
        name={name}
        size={24}
        color={focused ? COLORS.red : COLORS.gray400}
      />
    );
  }

  function NotifIcon({ focused }: { focused: boolean }) {
    return (
      <View>
        <Ionicons
          name="notifications-outline"
          size={24}
          color={focused ? COLORS.red : COLORS.gray400}
        />
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
          tabBarIcon: ({ focused }) => <TabIcon name="home-outline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-queue"
        options={{
          title: 'My Queue',
          href: '/(tabs)/my-queue',
          tabBarIcon: ({ focused }) => <TabIcon name="receipt-outline" focused={focused} />,
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
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} />,
        }}
      />
      {/* Removed admin tab - intentionally omitted from UI */}
    </Tabs>
  );
}
