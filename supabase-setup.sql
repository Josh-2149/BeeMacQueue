-- ============================================================
-- BeeMacQueue CDO — Full Supabase Setup Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE
create table if not exists profiles (
  id           uuid references auth.users on delete cascade primary key,
  name         text not null default 'User',
  email        text,
  role         text not null default 'customer' check (role in ('customer', 'admin')),
  queues_joined int not null default 0,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- 2. ESTABLISHMENTS TABLE
create table if not exists establishments (
  id             uuid primary key default gen_random_uuid(),
  brand          text not null check (brand in ('jollibee', 'mcdo')),
  name           text not null,
  branch         text not null,
  address        text not null,
  current_queue  int not null default 0,
  next_serving   int not null default 1,
  avg_wait_mins  int not null default 5,
  is_open        boolean not null default true,
  created_at     timestamptz not null default now()
);

-- 3. QUEUE ENTRIES TABLE
create table if not exists queue_entries (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references profiles(id) on delete cascade not null,
  establishment_id   uuid references establishments(id) on delete cascade not null,
  ticket_number      int not null,
  status             text not null default 'waiting' check (status in ('waiting','serving','served','cancelled')),
  created_at         timestamptz not null default now()
);

-- 4. NOTIFICATIONS TABLE
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  title      text not null,
  message    text not null default '',
  type       text not null default 'info' check (type in ('queue','serve','info')),
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles      enable row level security;
alter table establishments enable row level security;
alter table queue_entries  enable row level security;
alter table notifications  enable row level security;

-- Profiles: users can read/update their own; admins can read all
create policy "profiles_self_read"   on profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);
create policy "profiles_insert"      on profiles for insert with check (auth.uid() = id);
create policy "profiles_admin_read"  on profiles for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Establishments: everyone can read; only admins can write
create policy "est_public_read"  on establishments for select using (true);
create policy "est_admin_insert" on establishments for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "est_admin_update" on establishments for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "est_admin_delete" on establishments for delete using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Queue entries: users see their own; admins see all
create policy "queue_self_read"   on queue_entries for select using (
  auth.uid() = user_id or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);
create policy "queue_self_insert" on queue_entries for insert with check (auth.uid() = user_id);
create policy "queue_self_update" on queue_entries for update using (
  auth.uid() = user_id or
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Notifications: users see only their own
create policy "notifs_self_read"   on notifications for select using (auth.uid() = user_id);
create policy "notifs_self_update" on notifications for update using (auth.uid() = user_id);
create policy "notifs_admin_insert" on notifications for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  or auth.uid() = user_id
);

-- ============================================================
-- REALTIME — Enable on all tables
-- ============================================================

alter publication supabase_realtime add table establishments;
alter publication supabase_realtime add table queue_entries;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table profiles;

-- ============================================================
-- HELPER FUNCTION — increment queues_joined safely
-- ============================================================

create or replace function increment_queues_joined(uid uuid)
returns void language sql security definer as $$
  update profiles set queues_joined = queues_joined + 1 where id = uid;
$$;

-- ============================================================
-- SEED DATA — All CDO Jollibee & McDonald's branches
-- ============================================================

insert into establishments (brand, name, branch, address, avg_wait_mins, is_open) values
  ('jollibee', 'Jollibee', 'Divisoria Branch',     'Divisoria St, Cagayan de Oro City',         5, true),
  ('jollibee', 'Jollibee', 'Limketkai Branch',     'Limketkai Center, Cagayan de Oro City',     4, true),
  ('jollibee', 'Jollibee', 'Carmen Branch',        'Carmen Public Market, CDO',                 6, true),
  ('jollibee', 'Jollibee', 'Cogon Branch',         'Cogon Market Area, CDO',                    5, true),
  ('jollibee', 'Jollibee', 'Gaisano City Branch',  'Gaisano City Mall, CDO',                    5, true),
  ('mcdo',     'McDonald''s', 'Divisoria Branch',  'Velez St, Cagayan de Oro City',             6, true),
  ('mcdo',     'McDonald''s', 'Limketkai Branch',  'Limketkai Mall, CDO',                       4, true),
  ('mcdo',     'McDonald''s', 'Gaisano City Branch','Gaisano City Mall, CDO',                   5, true),
  ('mcdo',     'McDonald''s', 'SM CDO Branch',     'SM City CDO, Cagayan de Oro City',          4, true),
  ('mcdo',     'McDonald''s', 'Centrio Branch',    'Centrio Ayala Mall, CDO',                   5, true)
on conflict do nothing;

-- ============================================================
-- DONE! Check tables in Table Editor
-- ============================================================
