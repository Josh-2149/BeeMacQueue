import { Tabs } from 'expo-router';
import { House, Ticket, Bell, User } from 'phosphor-react-native';
import { View, Text } from 'react-native';
import { COLORS, ICON_COLOR, ICON_SIZE } from '../../lib/constants';
import { useNotification } from '../../context/NotificationContext';

console.log('👤 [Customer] Layout mounted');

export default function CustomerLayout() {
  console.log('👤 [Customer] Rendering');

  function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
    return <Icon size={ICON_SIZE} color={focused ? ICON_COLOR.active : ICON_COLOR.inactive} weight={focused ? 'fill' : 'regular'} />;
  }

  // 🆕 Notification icon with badge
  function NotificationTabIcon({ focused }: { focused: boolean }) {
    const { unreadCount } = useNotification();
    return (
      <View>
        <Bell 
          size={ICON_SIZE} 
          color={focused ? ICON_COLOR.active : ICON_COLOR.inactive} 
          weight={focused ? 'fill' : 'regular'} 
        />
        {unreadCount > 0 && (
          <View style={{
            position: 'absolute',
            top: -4,
            right: -8,
            backgroundColor: COLORS.red,
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}>
            <Text style={{
              color: COLORS.white,
              fontSize: 10,
              fontWeight: '800',
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
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
          tabBarIcon: ({ focused }) => <TabIcon icon={House} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-queue"
        options={{
          title: 'My Queue',
          tabBarIcon: ({ focused }) => <TabIcon icon={Ticket} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <NotificationTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} />,
        }}
      />
    </Tabs>
  );
}