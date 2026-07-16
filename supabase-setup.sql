-- ============================================================
-- BeeMacQueue CDO — Supabase Setup Script
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text default 'customer' check (role in ('customer', 'admin')),
  queues_joined integer default 0,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists establishments (
  id uuid primary key default gen_random_uuid(),
  brand text not null check (brand in ('jollibee', 'mcdo')),
  name text not null,
  branch text not null,
  address text not null,
  current_queue integer default 0,
  next_serving integer default 1,
  avg_wait_mins integer default 15,
  is_open boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists queue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  establishment_id uuid not null references establishments (id) on delete cascade,
  ticket_number integer not null,
  status text default 'waiting' check (status in ('waiting', 'serving', 'served', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('queue', 'serve', 'info')),
  is_read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table establishments enable row level security;
alter table queue_entries enable row level security;
alter table notifications enable row level security;

create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Anyone can view establishments" on establishments for select using (true);
create policy "Only admins can update establishments" on establishments for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can view their own queue entries" on queue_entries for select using (auth.uid() = user_id);
create policy "Admins can view all queue entries" on queue_entries for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can insert queue entries" on queue_entries for insert with check (auth.uid() = user_id);
create policy "Users can update their own queue entries" on queue_entries for update using (auth.uid() = user_id);
create policy "Admins can update all queue entries" on queue_entries for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Users can view their own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on notifications for update using (auth.uid() = user_id);
create policy "Anyone can insert notifications" on notifications for insert with check (true);

alter publication supabase_realtime add table queue_entries;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table establishments;

insert into establishments (brand, name, branch, address, avg_wait_mins) values
  ('jollibee', 'Jollibee Divisoria', 'Divisoria', 'Corner CM Recto Ave &, Don Apolinar Velez St, Cagayan de Oro', 15),
  ('jollibee', 'Jollibee Limketkai', 'Limketkai', 'Limketkai Center, Lapasan, Cagayan de Oro', 12),
  ('jollibee', 'Jollibee Carmen', 'Carmen', 'National Highway, Carmen, Cagayan de Oro', 18),
  ('jollibee', 'Jollibee Cogon', 'Cogon', 'Cogon Market, Cagayan de Oro', 10),
  ('jollibee', 'Jollibee Gaisano City', 'Gaisano City', 'Gaisano City Mall, Cagayan de Oro', 14),
  ('mcdo', 'McDonald''s Divisoria', 'Divisoria', 'CM Recto Ave, Cagayan de Oro', 10),
  ('mcdo', 'McDonald''s Limketkai', 'Limketkai', 'Limketkai Center, Lapasan, Cagayan de Oro', 8),
  ('mcdo', 'McDonald''s Gaisano City', 'Gaisano City', 'Gaisano City Mall, Cagayan de Oro', 12),
  ('mcdo', 'McDonald''s SM CDO', 'SM CDO', 'SM City CDO, Cagayan de Oro', 10),
  ('mcdo', 'McDonald''s Centrio', 'Centrio', 'Centrio Mall, Cagayan de Oro', 9)
on conflict do nothing;
