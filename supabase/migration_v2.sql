-- Ukeslønn v2: fleksibel hyppighet, perioder, strekk-bonus
-- Kjør dette i Supabase SQL Editor PÅ TOPPEN AV eksisterende database
-- (Ingenting blir slettet, kun lagt til/endret)

-- =========================================
-- 1) Fleksibel hyppighet på oppgaver
-- =========================================
alter table tasks
  add column if not exists days_of_week integer[],
  add column if not exists interval_days integer,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists xp_value integer not null default 10;

alter table tasks drop constraint if exists tasks_recurrence_check;
alter table tasks add constraint tasks_recurrence_check
  check (recurrence in ('daily', 'weekly', 'once', 'days_of_week', 'interval'));

-- =========================================
-- 2) Custody-perioder (når barnet er hos oss)
-- =========================================
create table if not exists custody_periods (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  label text,
  closed boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists custody_periods_child_idx
  on custody_periods(child_id, start_date, end_date);

-- =========================================
-- 3) Periode-resultater (snapshot når en periode avsluttes)
-- =========================================
create table if not exists period_achievements (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references profiles(id) on delete cascade,
  period_id uuid references custody_periods(id) on delete set null,
  period_start date not null,
  period_end date not null,
  max_level integer not null,
  xp_earned integer not null,
  tasks_completed integer not null,
  ore_earned integer not null,
  reached_max boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists period_achievements_child_idx
  on period_achievements(child_id, period_start);

-- =========================================
-- 4) Strekk-bonus (reward for X perioder på rad med max level)
-- =========================================
create table if not exists streak_rewards (
  id uuid primary key default gen_random_uuid(),
  child_id uuid references profiles(id) on delete cascade,
  title text not null default 'Strekk-bonus',
  description text,
  icon text default '🔥',
  required_streak integer not null default 3,
  reward_ore integer not null default 5000,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists streak_claims (
  id uuid primary key default gen_random_uuid(),
  streak_reward_id uuid not null references streak_rewards(id) on delete cascade,
  child_id uuid not null references profiles(id) on delete cascade,
  streak_count integer not null,
  reward_ore integer not null,
  awarded_at timestamptz default now()
);

-- =========================================
-- 5) RLS (åpen tilgang - familieapp)
-- =========================================
alter table custody_periods enable row level security;
alter table period_achievements enable row level security;
alter table streak_rewards enable row level security;
alter table streak_claims enable row level security;

drop policy if exists "allow all" on custody_periods;
create policy "allow all" on custody_periods for all using (true) with check (true);

drop policy if exists "allow all" on period_achievements;
create policy "allow all" on period_achievements for all using (true) with check (true);

drop policy if exists "allow all" on streak_rewards;
create policy "allow all" on streak_rewards for all using (true) with check (true);

drop policy if exists "allow all" on streak_claims;
create policy "allow all" on streak_claims for all using (true) with check (true);

-- =========================================
-- 6) Eksempel: Standard strekk-bonus for alle barn
-- =========================================
insert into streak_rewards (child_id, title, description, icon, required_streak, reward_ore)
select null, '3-på-rad-bonus', 'Nå level 10 i tre perioder på rad', '🔥', 3, 5000
where not exists (select 1 from streak_rewards);
