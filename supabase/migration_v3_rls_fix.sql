-- =====================================================================
-- Fiks RLS-recursion på household_members
-- =====================================================================
-- Den gamle policyen kalte is_household_member() som spurte SAMME tabell,
-- noe som forårsaket 500-feil. Her bytter vi til enkle "egen rad"-policyer
-- og legger til en RPC for å liste alle medlemmer i en husholdning.
-- =====================================================================

-- 1) Dropp eksisterende policyer på household_members
drop policy if exists "members can read members" on household_members;
drop policy if exists "owner can manage members" on household_members;

-- 2) Enkel policy: brukeren ser bare sin egen medlemskaps-rad
create policy "self read" on household_members
  for select
  using (user_id = auth.uid());

create policy "self insert" on household_members
  for insert
  with check (user_id = auth.uid());

create policy "self update" on household_members
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "self delete" on household_members
  for delete
  using (user_id = auth.uid());

-- 3) RPC for å liste alle medlemmer i en husholdning man selv er med i
create or replace function get_household_members(p_household_id uuid)
returns table (
  id uuid,
  household_id uuid,
  user_id uuid,
  role text,
  display_name text,
  user_email text,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    hm.id,
    hm.household_id,
    hm.user_id,
    hm.role,
    hm.display_name,
    u.email::text as user_email,
    hm.created_at
  from household_members hm
  left join auth.users u on u.id = hm.user_id
  where hm.household_id = p_household_id
    and exists (
      select 1 from household_members me
      where me.household_id = p_household_id
        and me.user_id = auth.uid()
    );
$$;

grant execute on function get_household_members(uuid) to authenticated;

-- 4) RPC for å fjerne et medlem (kun owners kan dette)
create or replace function remove_household_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  is_owner boolean;
begin
  select household_id into hid from household_members where id = p_member_id;
  if hid is null then
    raise exception 'Medlem ikke funnet';
  end if;

  select exists (
    select 1 from household_members
    where household_id = hid
      and user_id = auth.uid()
      and role = 'owner'
  ) into is_owner;

  if not is_owner then
    raise exception 'Bare eieren kan fjerne medlemmer';
  end if;

  delete from household_members where id = p_member_id;
end $$;

grant execute on function remove_household_member(uuid) to authenticated;
