export type UserRole = 'customer' | 'staff';  // ← Added 'staff'
export type QueueStatus = 'waiting' | 'serving' | 'served' | 'cancelled';
export type BrandType = 'jollibee' | 'mcdo';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  brand?: BrandType;        // ← Added for staff
  branch?: string;          // ← Added for staff
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
}

export interface QueueEntry {
  id: string;
  user_id: string;
  establishment_id: string;
  ticket_number: number;
  status: QueueStatus;
  created_at: string;
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
}