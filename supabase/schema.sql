-- Ukeslønn database schema for Supabase
-- Run this in Supabase SQL Editor to set up all tables

-- Drop existing tables (only run if you want a fresh start)
-- drop table if exists badges cascade;
-- drop table if exists payouts cascade;
-- drop table if exists bonus_claims cascade;
-- drop table if exists bonuses cascade;
-- drop table if exists task_completions cascade;
-- drop table if exists tasks cascade;
-- drop table if exists profiles cascade;

-- Profiles: barn og foreldre
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null check (role in ('child', 'parent')),
  pin text not null,
  avatar_color text default '#FFD93D',
  avatar_emoji text default '🦁',
  birthdate date,
  xp integer not null default 0,
  balance_ore integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Oppgaver
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reward_ore integer not null default 1000,
  icon text default '⭐',
  color text default '#FFD93D',
  recurrence text not null default 'daily' check (recurrence in ('daily', 'weekly', 'once')),
  assigned_to uuid references profiles(id) on delete set null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Oppgave-fullføringer
create table if not exists task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  child_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reward_ore integer not null,
  completion_date date not null default current_date,
  completed_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id) on delete set null
);

create index if not exists task_completions_child_idx on task_completions(child_id, completion_date);
create index if not exists task_completions_status_idx on task_completions(status);

-- Bonuser/premier
create table if not exists bonuses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reward_ore integer not null,
  icon text default '🏆',
  target_child_id uuid references profiles(id) on delete cascade,
  goal_type text not null default 'tasks_count' check (goal_type in ('tasks_count', 'amount', 'manual')),
  goal_value integer,
  period text not null default 'week' check (period in ('week', 'month', 'custom')),
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Bonus-utbetalinger / oppnåelser
create table if not exists bonus_claims (
  id uuid primary key default gen_random_uuid(),
  bonus_id uuid not null references bonuses(id) on delete cascade,
  child_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  reward_ore integer not null,
  claimed_at timestamptz default now(),
  reviewed_by uuid references profiles(id) on delete set null
);

-- Utbetalinger (nullstilling av saldo)
create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references profiles(id) on delete cascade,
  amount_ore integer not null,
  note text,
  paid_at timestamptz default now(),
  paid_by uuid references profiles(id) on delete set null
);

-- Badges/utmerkelser
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references profiles(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz default now(),
  unique(child_id, badge_type)
);

-- Enable Row Level Security but allow all (family app, auth is client-side via PIN)
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_completions enable row level security;
alter table bonuses enable row level security;
alter table bonus_claims enable row level security;
alter table payouts enable row level security;
alter table badges enable row level security;

-- Allow all operations from anon key (family app — trust the PIN gate on client)
drop policy if exists "allow all" on profiles;
create policy "allow all" on profiles for all using (true) with check (true);
drop policy if exists "allow all" on tasks;
create policy "allow all" on tasks for all using (true) with check (true);
drop policy if exists "allow all" on task_completions;
create policy "allow all" on task_completions for all using (true) with check (true);
drop policy if exists "allow all" on bonuses;
create policy "allow all" on bonuses for all using (true) with check (true);
drop policy if exists "allow all" on bonus_claims;
create policy "allow all" on bonus_claims for all using (true) with check (true);
drop policy if exists "allow all" on payouts;
create policy "allow all" on payouts for all using (true) with check (true);
drop policy if exists "allow all" on badges;
create policy "allow all" on badges for all using (true) with check (true);

-- Seed: Standardprofiler (kun hvis tabellen er tom)
insert into profiles (name, role, pin, avatar_color, avatar_emoji, birthdate, sort_order)
select * from (values
  ('Mamma/Pappa', 'parent', '1234', '#8B5CF6', '👑', null::date, 0),
  ('Josefine', 'child', '1111', '#EC4899', '🦄', '2016-10-24'::date, 1),
  ('Ludvig', 'child', '2222', '#3B82F6', '🦖', '2018-10-22'::date, 2)
) as v(name, role, pin, avatar_color, avatar_emoji, birthdate, sort_order)
where not exists (select 1 from profiles);

-- Seed: Noen startoppgaver (kun hvis tabellen er tom)
insert into tasks (title, description, reward_ore, icon, color, recurrence, sort_order)
select * from (values
  ('Re seng', 'Re sengen din om morgenen', 500, '🛏️', '#FFD93D', 'daily', 1),
  ('Pusse tenner', 'Pusse tenner morgen og kveld', 500, '🪥', '#06B6D4', 'daily', 2),
  ('Rydde rommet', 'Holde rommet pent og ryddig', 1500, '🧹', '#A78BFA', 'daily', 3),
  ('Tømme oppvaskmaskin', 'Hjelpe til på kjøkkenet', 1000, '🍽️', '#10B981', 'daily', 4),
  ('Lekser', 'Gjøre lekser uten å bli sur', 2000, '📚', '#F59E0B', 'daily', 5),
  ('Lese 15 minutter', 'Lese en bok i 15 min', 1000, '📖', '#EC4899', 'daily', 6),
  ('Hjelpe med middag', 'Hjelpe til når middagen lages', 1500, '🍳', '#EF4444', 'daily', 7),
  ('Bære ut søppel', 'Tømme søppelposen', 1000, '🗑️', '#6B7280', 'weekly', 8)
) as v(title, description, reward_ore, icon, color, recurrence, sort_order)
where not exists (select 1 from tasks);
