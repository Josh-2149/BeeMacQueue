import React, { createContext, useContext, ReactNode, useRef, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStaffQueue } from '../hooks/useStaffQueue';
import { QueueEntry, Establishment } from '../types';

type StaffQueueContextType = {
  waitingList: QueueEntry[];
  servingList: QueueEntry[];
  servedList: QueueEntry[];
  queueTemplates: any[];
  stats: {
    totalWaiting: number;
    totalServing: number;
    totalServed: number;
    todayServed: number;
  };
  establishment: Establishment | null;
  loading: boolean;
  creating: boolean;
  processing: boolean;
  error: string | null;
  serveNext: () => Promise<boolean>;
  markServed: (entryId: string) => Promise<boolean>;
  callCustomer: (entryId: string) => Promise<boolean>;
  cancelCustomer: (entryId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  createQueue: (data: any) => Promise<any>;
  updateQueue: (queueId: string, updates: any) => Promise<any>;
  deleteQueue: (queueId: string) => Promise<any>;
  getQueues: () => Promise<any>;
  getQueueById: (queueId: string) => Promise<any>;
};

const StaffQueueContext = createContext<StaffQueueContextType | null>(null);

let staffQueueProviderCount = 0;

export function StaffQueueProvider({ children }: { children: ReactNode }) {
  console.log('🏪 [StaffQueueProvider] Creating singleton');
  
  const { user, profile, loading: authLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!authLoading && profile && profile.role === 'staff') {
      console.log('🏪 [StaffQueueProvider] ✅ Staff profile ready');
      setIsReady(true);
    }
  }, [authLoading, profile]);

  const staffId = (isReady && profile?.role === 'staff') ? user?.id : undefined;
  
  const queueData = useStaffQueue(staffId);
  
  const instanceId = useRef(++staffQueueProviderCount);
  
  useEffect(() => {
    console.log(`🏪 [StaffQueueProvider #${instanceId.current}] Initialized for staffId: ${staffId || 'none'}`);
  }, [staffId]);

  return (
    <StaffQueueContext.Provider value={queueData}>
      {children}
    </StaffQueueContext.Provider>
  );
}

export function useStaffQueueContext() {
  const context = useContext(StaffQueueContext);
  if (!context) {
    throw new Error('useStaffQueueContext must be used within a StaffQueueProvider');
  }
  return context;
}