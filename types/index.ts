export type UserRole = 'customer' | 'staff' | 'admin';
export type QueueStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'no_show';
export type BrandType = 'jollibee' | 'mcdo';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  brand?: BrandType;
  branch?: string;
  staff_id?: string;
  phone_number?: string;
  queues_joined: number;
  avatar_url?: string;
  created_at: string;
}

export interface Establishment {
  id: string;
  brand: BrandType;
  name: string;
  branch: string;
  address: string;
  current_queue: number;
  next_serving: number;
  avg_wait_mins: number;
  is_open: boolean;
  created_at: string;
  created_by?: string;
  last_served_at?: string;
  operating_hours?: any;
  capacity?: number;
  qr_code?: string;
  phone_number?: string;
}

export interface QueueEntry {
  id: string;
  user_id: string;
  establishment_id: string;
  ticket_number: number;
  status: QueueStatus;
  created_at: string;
  updated_at?: string;
  position?: number;
  called_at?: string;
  served_by?: string;
  served_at?: string;
  estimated_wait_mins?: number;
  priority?: number;
  notes?: string;
  party_size?: number;
  table_number?: string;
  establishment?: Establishment;
  user?: Profile;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'queue' | 'serve' | 'info';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  priority?: 'high' | 'normal' | 'low';
  expires_at?: string;
  metadata?: any;
}