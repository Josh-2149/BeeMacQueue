import React, { createContext, useContext, ReactNode, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { AppNotification } from '../types';

type NotificationContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => void;
  markAllRead: () => void;
  markOneRead: (id: string) => void;
  deleteOne: (id: string) => Promise<void>;
  clearAllRead: () => Promise<void>;
  addNotification: (data: {
    user_id: string;
    title: string;
    message: string;
    type?: 'queue' | 'serve' | 'info';
    priority?: 'high' | 'normal' | 'low';
    metadata?: any;
  }) => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: true,
  fetchNotifications: () => {},
  markAllRead: () => {},
  markOneRead: () => {},
  deleteOne: async () => {},
  clearAllRead: async () => {},
  addNotification: async () => false,
});

let providerCount = 0;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  
  const notificationData = useNotifications(userId);
  const instanceId = useRef(++providerCount);
  
  useEffect(() => {
    console.log(`🔔 [NotificationProvider #${instanceId.current}] Initialized for userId: ${userId || 'none'}`);
  }, [userId]);

  return (
    <NotificationContext.Provider value={notificationData}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}