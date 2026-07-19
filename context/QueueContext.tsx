import React, { createContext, useContext, ReactNode, useRef, useEffect } from 'react';
import { useQueue } from '../hooks/useQueue';
import { useAuth } from '../hooks/useAuth';
import { QueueEntry } from '../types';

type QueueContextType = {
  activeQueue: QueueEntry | null;
  history: QueueEntry[];
  loading: boolean;
  joining: boolean;
  joinQueue: (establishmentId: string) => Promise<number>;
  leaveQueue: () => Promise<void>;
  refreshActive: () => Promise<void>;
};

const QueueContext = createContext<QueueContextType>({
  activeQueue: null,
  history: [],
  loading: false,
  joining: false,
  joinQueue: async () => 0,
  leaveQueue: async () => {},
  refreshActive: async () => {},
});

let queueProviderCount = 0;

export function QueueProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const queueData = useQueue(userId);
  const instanceId = useRef(++queueProviderCount);
  
  useEffect(() => {
    console.log(`🎫 [QueueProvider #${instanceId.current}] Initialized for userId: ${userId || 'none'}`);
  }, [userId]);

  return (
    <QueueContext.Provider value={queueData}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueueContext() {
  return useContext(QueueContext);
}