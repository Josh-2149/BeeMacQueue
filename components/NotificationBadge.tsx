import React from 'react';
import { View, Text } from 'react-native';
import { Bell } from 'phosphor-react-native';
import { COLORS, ICON_COLOR, ICON_SIZE } from '../lib/constants';
import { useNotification } from '../context/NotificationContext';

interface NotificationBadgeProps {
  focused: boolean;
}

export function NotificationBadge({ focused }: NotificationBadgeProps) {
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
          right: -6,
          backgroundColor: COLORS.red,
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 3,
        }}>
          <Text style={{
            color: COLORS.white,
            fontSize: 9,
            fontWeight: '800',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default NotificationBadge;