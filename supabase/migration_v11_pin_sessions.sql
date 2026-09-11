-- =====================================================================
-- Ukeslønn v11: Server-side PIN auth + profile sessions
-- =====================================================================
-- Kjør i Supabase SQL Editor. Appen må deployes samtidig (feature/pin-server-auth).
--
-- Endringer:
--  - profiles.pin_hash (bcrypt via pgcrypto); plaintext pin nulles etter backfill
--  - profiles.pin er DEPRECATED — aldri SELECT pin/pin_hash fra klient
--  - Trigger hasher ny PIN ved insert/update av pin-kolonnen
--  - profile_sessions + RPCer: verify / get / clear / assert_parent / create_payout
--  - payouts: klient kan kun SELECT; inserts via create_payout RPC
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) pin_hash + backfill + deprecate plaintext pin
-- ---------------------------------------------------------------------
alter table profiles add column if not exists pin_hash text;

comment on column profiles.pin is
  'DEPRECATED: plaintext PIN. Cleared after v11 backfill. Write-only via trigger → pin_hash. Never SELECT.';
comment on column profiles.pin_hash is
  'bcrypt hash (crypt/gen_salt bf). Never SELECT from clients — use verify_profile_pin RPC.';

-- Backfill hashes from existing plaintext PINs
update profiles
set pin_hash = crypt(pin, gen_salt('bf'))
where pin is not null
  and pin <> ''
  and (pin_hash is null or pin_hash = '');

-- Allow null pin BEFORE clearing plaintext (pin was NOT NULL historically)
alter table profiles alter column pin drop not null;

-- Clear plaintext after backfill (safe once app uses pin_hash / RPC)
update profiles set pin = null where pin is not null;

-- Trigger: when client writes pin (onboarding / profiler), hash then clear plaintext
create or replace function profiles_hash_pin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pin is not null and length(trim(new.pin)) > 0 then
    new.pin_hash := crypt(trim(new.pin), gen_salt('bf'));
    new.pin := null;
  elsif tg_op = 'UPDATE' then
    -- pin omitted / empty on update → keep existing hash, never store plaintext
    new.pin_hash := old.pin_hash;
    new.pin := null;
  else
    -- insert without pin
    new.pin := null;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_hash_pin_trg on profiles;
drop trigger if exists profiles_hash_pin_ins_trg on profiles;
create trigger profiles_hash_pin_trg
  before insert or update on profiles
  for each row execute function profiles_hash_pin();

-- Safe picker view (no pin / pin_hash). Prefer selecting explicit columns in app.
-- security_invoker: enforce underlying profiles RLS for the calling user.
create or replace view profiles_safe
with (security_invoker = true)
as
select
  id,
  household_id,
  name,
  role,
  avatar_color,
  avatar_emoji,
  birthdate,
  xp,
  balance_ore,
  sort_order,
  created_at
from profiles;

grant select on profiles_safe to authenticated;

-- ---------------------------------------------------------------------
-- 2) profile_sessions
-- ---------------------------------------------------------------------
create table if not exists profile_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('child', 'parent')),
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists profile_sessions_token_hash_idx on profile_sessions(token_hash);
create index if not exists profile_sessions_profile_idx on profile_sessions(profile_id);
create index if not exists profile_sessions_expires_idx on profile_sessions(expires_at);

alter table profile_sessions enable row level security;

-- No direct client access — only security definer RPCs
drop policy if exists "no direct access" on profile_sessions;
create policy "no direct access" on profile_sessions
  for all using (false) with check (false);

-- ---------------------------------------------------------------------
-- 3) Helpers
-- ---------------------------------------------------------------------
create or replace function _hash_session_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(digest(p_token, 'sha256'), 'hex');
$$;

create or replace function _lookup_profile_session(p_token text)
returns profile_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  s profile_sessions;
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return null;
  end if;
  select * into s
  from profile_sessions
  where token_hash = _hash_session_token(p_token)
    and expires_at > now()
  limit 1;
  return s;
end;
$$;

-- Raises unless token is a valid parent profile session for a household the caller belongs to.
create or replace function assert_parent_session(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s profile_sessions;
begin
  if auth.uid() is null then
    raise exception 'Ikke autentisert';
  end if;

  s := _lookup_profile_session(p_token);
  if s is null then
    raise exception 'Ugyldig eller utløpt profil-sesjon';
  end if;
  if s.role <> 'parent' then
    raise exception 'Krever forelder-profil';
  end if;
  if not is_household_member(s.household_id) then
    raise exception 'Ikke medlem av husholdningen';
  end if;

  return jsonb_build_object(
    'session_id', s.id,
    'profile_id', s.profile_id,
    'role', s.role,
    'household_id', s.household_id,
    'expires_at', s.expires_at
  );
end;
$$;

grant execute on function assert_parent_session(text) to authenticated;

-- ---------------------------------------------------------------------
-- 4) verify_profile_pin
-- ---------------------------------------------------------------------
create or replace function verify_profile_pin(p_profile_id uuid, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p profiles;
  raw_token text;
  sess_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Ikke autentisert';
  end if;

  select * into p from profiles where id = p_profile_id;
  if not found then
    raise exception 'Profil ikke funnet';
  end if;

  if not is_household_member(p.household_id) then
    raise exception 'Ikke medlem av husholdningen';
  end if;

  if p.pin_hash is null or p_pin is null
     or p.pin_hash <> crypt(p_pin, p.pin_hash) then
    raise exception 'Feil PIN-kode';
  end if;

  raw_token := encode(gen_random_bytes(32), 'hex');
  sess_expires := now() + interval '4 hours';

  -- One active session per profile (device switch clears old)
  delete from profile_sessions where profile_id = p.id;

  insert into profile_sessions (household_id, profile_id, role, token_hash, expires_at)
  values (p.household_id, p.id, p.role, _hash_session_token(raw_token), sess_expires);

  return jsonb_build_object(
    'session_token', raw_token,
    'profile_id', p.id,
    'role', p.role,
    'name', p.name,
    'household_id', p.household_id,
    'expires_at', sess_expires
  );
end;
$$;

grant execute on function verify_profile_pin(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5) get_profile_session / clear_profile_session
-- ---------------------------------------------------------------------
create or replace function get_profile_session(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s profile_sessions;
  pname text;
begin
  if auth.uid() is null then
    return null;
  end if;

  s := _lookup_profile_session(p_token);
  if s is null then
    return null;
  end if;
  if not is_household_member(s.household_id) then
    return null;
  end if;

  select name into pname from profiles where id = s.profile_id;

  return jsonb_build_object(
    'session_token', p_token,
    'profile_id', s.profile_id,
    'role', s.role,
    'name', pname,
    'household_id', s.household_id,
    'expires_at', s.expires_at
  );
end;
$$;

grant execute on function get_profile_session(text) to authenticated;

create or replace function clear_profile_session(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_token is null or length(trim(p_token)) = 0 then
    return;
  end if;
  delete from profile_sessions where token_hash = _hash_session_token(p_token);
end;
$$;

grant execute on function clear_profile_session(text) to authenticated;

-- ---------------------------------------------------------------------
-- 6) create_payout — parent session required
-- ---------------------------------------------------------------------
create or replace function create_payout(
  p_token text,
  p_child_id uuid,
  p_amount_ore integer,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_sess jsonb;
  child profiles;
  new_balance integer;
  payout_row payouts;
begin
  parent_sess := assert_parent_session(p_token);

  if p_amount_ore is null or p_amount_ore <= 0 then
    raise exception 'Ugyldig beløp';
  end if;

  select * into child from profiles where id = p_child_id for update;
  if not found then
    raise exception 'Barn ikke funnet';
  end if;
  if child.role <> 'child' then
    raise exception 'Utbetaling kun til barneprofiler';
  end if;
  if child.household_id <> (parent_sess->>'household_id')::uuid then
    raise exception 'Barn tilhører ikke samme husholdning';
  end if;
  if child.balance_ore < p_amount_ore then
    raise exception 'Beløpet er større enn saldo';
  end if;

  new_balance := child.balance_ore - p_amount_ore;

  insert into payouts (household_id, child_id, amount_ore, note, paid_by)
  values (
    child.household_id,
    child.id,
    p_amount_ore,
    nullif(trim(p_note), ''),
    (parent_sess->>'profile_id')::uuid
  )
  returning * into payout_row;

  update profiles set balance_ore = new_balance where id = child.id;

  return jsonb_build_object(
    'payout_id', payout_row.id,
    'child_id', child.id,
    'amount_ore', p_amount_ore,
    'new_balance_ore', new_balance
  );
end;
$$;

grant execute on function create_payout(text, uuid, integer, text) to authenticated;

-- Tighten payouts: members can read; writes only via RPC (security definer)
drop policy if exists "members access" on payouts;
drop policy if exists "members read payouts" on payouts;
create policy "members read payouts" on payouts
  for select using (is_household_member(household_id));

-- ---------------------------------------------------------------------
-- 7) export_my_data: strip pin_hash as well as pin
-- ---------------------------------------------------------------------
create or replace function export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  my_household_id uuid;
begin
  select household_id into my_household_id
  from household_members
  where user_id = auth.uid()
  limit 1;

  if my_household_id is null then
    raise exception 'Ingen husholdning funnet';
  end if;

  return jsonb_build_object(
    'export_timestamp', now(),
    'household', (select to_jsonb(h) from households h where id = my_household_id),
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'role', hm.role,
        'display_name', hm.display_name,
        'created_at', hm.created_at,
        'user_email', u.email
      )), '[]'::jsonb)
      from household_members hm
      left join auth.users u on u.id = hm.user_id
      where hm.household_id = my_household_id
    ),
    'profiles', (
      select coalesce(jsonb_agg(to_jsonb(p) - 'pin' - 'pin_hash'), '[]'::jsonb)
      from profiles p where p.household_id = my_household_id
    ),
    'tasks', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
      from tasks t where t.household_id = my_household_id
    ),
    'task_completions', (
      select coalesce(jsonb_agg(to_jsonb(tc)), '[]'::jsonb)
      from task_completions tc where tc.household_id = my_household_id
    ),
    'bonuses', (
      select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb)
      from bonuses b where b.household_id = my_household_id
    ),
    'bonus_claims', (
      select coalesce(jsonb_agg(to_jsonb(bc)), '[]'::jsonb)
      from bonus_claims bc where bc.household_id = my_household_id
    ),
    'payouts', (
      select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
      from payouts p where p.household_id = my_household_id
    ),
    'custody_periods', (
      select coalesce(jsonb_agg(to_jsonb(cp)), '[]'::jsonb)
      from custody_periods cp where cp.household_id = my_household_id
    ),
    'period_achievements', (
      select coalesce(jsonb_agg(to_jsonb(pa)), '[]'::jsonb)
      from period_achievements pa where pa.household_id = my_household_id
    )
  );
end;
$$;

grant execute on function export_my_data() to authenticated;

-- Cleanup expired sessions (optional maintenance)
create or replace function cleanup_expired_profile_sessions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from profile_sessions where expires_at <= now();
  get diagnostics n = row_count;
  return n;
end;
$$;

-- =====================================================================
-- Klient-regel: SELECT profiles uten pin/pin_hash, f.eks.:
--   id, household_id, name, role, avatar_color, avatar_emoji,
--   birthdate, xp, balance_ore, sort_order, created_at
-- eller: select * from profiles_safe
-- =====================================================================
