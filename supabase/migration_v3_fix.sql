-- =====================================================================
-- Fiks for v3: atomisk opprettelse av husholdning + eier i én operasjon
-- =====================================================================
-- Problemet: når en bruker oppretter en household og umiddelbart leser
-- den tilbake, blokkerer SELECT-policyen fordi brukeren ennå ikke er
-- medlem. Vi løser det med en SECURITY DEFINER-funksjon som gjør alt
-- atomisk og kjører med utvidete rettigheter.
-- =====================================================================

-- Funksjon: opprett husholdning og legg til kalleren som owner
create or replace function create_household_with_owner(
  p_name text,
  p_display_name text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into households (name, plan, subscription_status)
  values (coalesce(nullif(trim(p_name), ''), 'Min familie'), 'free', 'none')
  returning id into new_household_id;

  insert into household_members (household_id, user_id, role, display_name)
  values (new_household_id, auth.uid(), 'owner', p_display_name);

  return new_household_id;
end $$;

grant execute on function create_household_with_owner(text, text) to authenticated;

-- Funksjon: aksepter en invitasjon og legg til kalleren som co_parent
create or replace function accept_household_invite(
  p_token text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv household_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from household_invites where token = p_token;

  if not found then
    raise exception 'Invitasjon ikke funnet';
  end if;

  if inv.accepted_at is not null then
    raise exception 'Invitasjon allerede akseptert';
  end if;

  if inv.expires_at < now() then
    raise exception 'Invitasjon utløpt';
  end if;

  insert into household_members (household_id, user_id, role, display_name)
  values (inv.household_id, auth.uid(), 'co_parent', null)
  on conflict (household_id, user_id) do nothing;

  update household_invites
  set accepted_at = now()
  where id = inv.id;

  return inv.household_id;
end $$;

grant execute on function accept_household_invite(text) to authenticated;

-- Funksjon: claim eksisterende default-husholdning ved første pålogging
-- (kun hvis husholdningen ikke allerede har en owner)
create or replace function claim_orphan_household(
  p_household_name text default 'Min familie',
  p_display_name text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  has_members boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into target_id from households
  where name = p_household_name
  order by created_at asc
  limit 1;

  if target_id is null then
    raise exception 'Ingen husholdning funnet med navnet "%"', p_household_name;
  end if;

  select exists (select 1 from household_members where household_id = target_id) into has_members;
  if has_members then
    raise exception 'Husholdningen har allerede medlemmer';
  end if;

  insert into household_members (household_id, user_id, role, display_name)
  values (target_id, auth.uid(), 'owner', p_display_name);

  return target_id;
end $$;

grant execute on function claim_orphan_household(text, text) to authenticated;

-- Funksjon: liste husholdninger uten medlemmer (kan claimes)
create or replace function list_orphan_households()
returns table (
  id uuid,
  name text,
  child_count bigint,
  task_count bigint,
  total_balance_ore bigint,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    h.id,
    h.name,
    (select count(*) from profiles p where p.household_id = h.id and p.role = 'child') as child_count,
    (select count(*) from tasks t where t.household_id = h.id) as task_count,
    coalesce((select sum(balance_ore) from profiles p where p.household_id = h.id and p.role = 'child'), 0) as total_balance_ore,
    h.created_at
  from households h
  where not exists (select 1 from household_members where household_id = h.id)
  order by h.created_at asc;
$$;

grant execute on function list_orphan_households() to authenticated;
