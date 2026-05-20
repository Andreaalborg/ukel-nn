-- =====================================================================
-- Ukeslønn v3: Multi-tenant + Supabase Auth + co-parent sharing
-- =====================================================================
-- Kjør dette i Supabase SQL Editor PÅ TOPPEN AV eksisterende database.
-- All eksisterende data flyttes til en default-husholdning som du
-- claimer ved å registrere deg med e-post etter migrasjonen.
--
-- VIKTIG: Etter denne migrasjonen må alle Supabase-spørringer skje via
-- en innlogget Supabase Auth-bruker — anon-nøkkelen vil ikke lenger
-- gi tilgang til data (RLS er strammet inn).
-- =====================================================================

-- =====================================================================
-- 1) Households (familier/abonnenter)
-- =====================================================================
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Min familie',
  plan text not null default 'free' check (plan in ('free', 'family', 'family_plus', 'beta')),
  trial_ends_at timestamptz,
  subscription_status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================================================================
-- 2) Household members (koble auth-brukere til husholdninger)
-- =====================================================================
create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'co_parent')),
  display_name text,
  created_at timestamptz default now(),
  unique(household_id, user_id)
);

create index if not exists hm_user_idx on household_members(user_id);
create index if not exists hm_household_idx on household_members(household_id);

-- =====================================================================
-- 3) Invitasjoner (co-parent invites via e-post)
-- =====================================================================
create table if not exists household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  invited_email text not null,
  token text not null unique,
  role text not null default 'co_parent',
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists hi_token_idx on household_invites(token);
create index if not exists hi_email_idx on household_invites(invited_email);

-- =====================================================================
-- 4) Legg til household_id på alle eksisterende tabeller
-- =====================================================================
alter table profiles add column if not exists household_id uuid references households(id) on delete cascade;
alter table tasks add column if not exists household_id uuid references households(id) on delete cascade;
alter table task_completions add column if not exists household_id uuid references households(id) on delete cascade;
alter table bonuses add column if not exists household_id uuid references households(id) on delete cascade;
alter table bonus_claims add column if not exists household_id uuid references households(id) on delete cascade;
alter table payouts add column if not exists household_id uuid references households(id) on delete cascade;
alter table badges add column if not exists household_id uuid references households(id) on delete cascade;
alter table custody_periods add column if not exists household_id uuid references households(id) on delete cascade;
alter table period_achievements add column if not exists household_id uuid references households(id) on delete cascade;
alter table streak_rewards add column if not exists household_id uuid references households(id) on delete cascade;
alter table streak_claims add column if not exists household_id uuid references households(id) on delete cascade;

-- =====================================================================
-- 5) Migrer eksisterende data: lag en default-husholdning og flytt alt
-- =====================================================================
do $$
declare
  default_household_id uuid;
begin
  -- Sjekk om vi allerede har gjort dette
  if not exists (select 1 from households where name = 'Min familie' limit 1) then
    insert into households (name, plan) values ('Min familie', 'beta') returning id into default_household_id;
  else
    select id into default_household_id from households where name = 'Min familie' limit 1;
  end if;

  -- Oppdater alle rader som mangler household_id
  update profiles set household_id = default_household_id where household_id is null;
  update tasks set household_id = default_household_id where household_id is null;
  update task_completions set household_id = default_household_id where household_id is null;
  update bonuses set household_id = default_household_id where household_id is null;
  update bonus_claims set household_id = default_household_id where household_id is null;
  update payouts set household_id = default_household_id where household_id is null;
  update badges set household_id = default_household_id where household_id is null;
  update custody_periods set household_id = default_household_id where household_id is null;
  update period_achievements set household_id = default_household_id where household_id is null;
  update streak_rewards set household_id = default_household_id where household_id is null;
  update streak_claims set household_id = default_household_id where household_id is null;
end $$;

-- =====================================================================
-- 6) Gjør household_id NOT NULL nå når alle rader er fylt
-- =====================================================================
alter table profiles alter column household_id set not null;
alter table tasks alter column household_id set not null;
alter table task_completions alter column household_id set not null;
alter table bonuses alter column household_id set not null;
alter table bonus_claims alter column household_id set not null;
alter table payouts alter column household_id set not null;
alter table badges alter column household_id set not null;
alter table custody_periods alter column household_id set not null;
alter table period_achievements alter column household_id set not null;
alter table streak_rewards alter column household_id set not null;
alter table streak_claims alter column household_id set not null;

-- =====================================================================
-- 7) Indekser for ytelse
-- =====================================================================
create index if not exists profiles_household_idx on profiles(household_id);
create index if not exists tasks_household_idx on tasks(household_id);
create index if not exists tc_household_idx on task_completions(household_id);
create index if not exists bonuses_household_idx on bonuses(household_id);
create index if not exists bc_household_idx on bonus_claims(household_id);
create index if not exists payouts_household_idx on payouts(household_id);
create index if not exists custody_household_idx on custody_periods(household_id);
create index if not exists pa_household_idx on period_achievements(household_id);
create index if not exists sr_household_idx on streak_rewards(household_id);
create index if not exists sc_household_idx on streak_claims(household_id);

-- =====================================================================
-- 8) Helper-funksjon: er gjeldende bruker medlem av en husholdning?
-- =====================================================================
create or replace function is_household_member(hid uuid) returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- =====================================================================
-- 9) Strammere RLS-policies: bare medlemmer kan se data
-- =====================================================================

-- HOUSEHOLDS
alter table households enable row level security;
drop policy if exists "members can read household" on households;
drop policy if exists "allow all" on households;
create policy "members can read household" on households
  for select using (is_household_member(id));
drop policy if exists "owner can update household" on households;
create policy "owner can update household" on households
  for update using (
    exists (select 1 from household_members where household_id = households.id and user_id = auth.uid() and role = 'owner')
  );
drop policy if exists "anyone authed can create household" on households;
create policy "anyone authed can create household" on households
  for insert with check (auth.uid() is not null);

-- HOUSEHOLD_MEMBERS
alter table household_members enable row level security;
drop policy if exists "members can read members" on household_members;
create policy "members can read members" on household_members
  for select using (is_household_member(household_id));
drop policy if exists "owner can manage members" on household_members;
create policy "owner can manage members" on household_members
  for all using (
    exists (select 1 from household_members m where m.household_id = household_members.household_id and m.user_id = auth.uid() and m.role = 'owner')
  )
  with check (
    -- Tillat også å sette inn seg selv (for first-time owner)
    user_id = auth.uid()
    or exists (select 1 from household_members m where m.household_id = household_members.household_id and m.user_id = auth.uid() and m.role = 'owner')
  );

-- HOUSEHOLD_INVITES
alter table household_invites enable row level security;
drop policy if exists "members can manage invites" on household_invites;
create policy "members can manage invites" on household_invites
  for all using (is_household_member(household_id))
  with check (is_household_member(household_id));
drop policy if exists "anyone can read invite by token" on household_invites;
create policy "anyone can read invite by token" on household_invites
  for select using (true);

-- Generisk policy-makro for alle data-tabeller
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'profiles','tasks','task_completions','bonuses','bonus_claims',
      'payouts','badges','custody_periods','period_achievements',
      'streak_rewards','streak_claims'
    ])
  loop
    execute format('drop policy if exists "allow all" on %I', tbl);
    execute format('drop policy if exists "members access" on %I', tbl);
    execute format(
      'create policy "members access" on %I for all using (is_household_member(household_id)) with check (is_household_member(household_id))',
      tbl
    );
  end loop;
end $$;

-- =====================================================================
-- 10) Trigger: oppdater updated_at på households automatisk
-- =====================================================================
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists households_touch_updated_at on households;
create trigger households_touch_updated_at
  before update on households
  for each row execute function touch_updated_at();

-- =====================================================================
-- 11) Hjelp for å claime den eksisterende default-husholdningen
-- =====================================================================
-- Når du har registrert deg med e-post via appen og fått en auth.users-rad,
-- kjør dette ÉN GANG for å koble brukeren din til den eksisterende dataen:
--
-- insert into household_members (household_id, user_id, role, display_name)
-- select h.id, u.id, 'owner', 'André'
-- from households h, auth.users u
-- where h.name = 'Min familie'
-- and u.email = 'din-epost@eksempel.no'
-- on conflict do nothing;
--
-- (bytt ut din-epost med e-posten du registrerte deg med)

-- =====================================================================
-- Ferdig!
-- =====================================================================
