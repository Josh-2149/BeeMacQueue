// context/StaffQueueContext.tsx
import React, { createContext, useContext, ReactNode, useRef, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStaffQueue } from '../hooks/useStaffQueue';
import { QueueEntry, Establishment, Queue } from '../types';

type StaffQueueContextType = {
  waitingList: QueueEntry[];
  servingList: QueueEntry[];
  servedList: QueueEntry[];
  queueTemplates: any[];
  queues: Queue[];
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
  serveNext: (queueId?: string) => Promise<boolean>;
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
  
  // ✅ FIXED: Derive staffId directly — no stale isReady state
  const staffId = (!authLoading && profile?.role === 'staff') ? user?.id : undefined;
  
  const queueData = useStaffQueue(staffId);
  const providerKey = staffId || 'guest';
  
  const contextValue: StaffQueueContextType = {
    waitingList: queueData.waitingList || [],
    servingList: queueData.servingList || [],
    servedList: queueData.servedList || [],
    queueTemplates: queueData.queueTemplates || [],
    queues: queueData.queues || [],
    stats: queueData.stats || { totalWaiting: 0, totalServing: 0, totalServed: 0, todayServed: 0 },
    establishment: queueData.establishment || null,
    loading: queueData.loading || false,
    creating: queueData.creating || false,
    processing: queueData.processing || false,
    error: queueData.error || null,
    serveNext: queueData.serveNext || (async () => false),
    markServed: queueData.markServed || (async () => false),
    callCustomer: queueData.callCustomer || (async () => false),
    cancelCustomer: queueData.cancelCustomer || (async () => false),
    refresh: queueData.refresh || (async () => {}),
    createQueue: queueData.createQueue || (async () => ({ success: false, error: 'Not implemented' })),
    updateQueue: queueData.updateQueue || (async () => ({ success: false, error: 'Not implemented' })),
    deleteQueue: queueData.deleteQueue || (async () => ({ success: false, error: 'Not implemented' })),
    getQueues: queueData.getQueues || (async () => ({ success: false, error: 'Not implemented', data: [] })),
    getQueueById: queueData.getQueueById || (async () => ({ success: false, error: 'Not implemented', data: null })),
  };
  
  const instanceId = useRef(++staffQueueProviderCount);
  
  useEffect(() => {
    console.log(`🏪 [StaffQueueProvider #${instanceId.current}] Initialized for staffId: ${staffId || 'none'}, profile: ${profile?.name || 'none'}, role: ${profile?.role || 'none'}`);
  }, [staffId, profile]);

  return (
    <StaffQueueContext.Provider value={contextValue} key={providerKey}>
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