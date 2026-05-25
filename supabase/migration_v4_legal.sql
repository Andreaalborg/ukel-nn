-- =====================================================================
-- v4: GDPR-funksjoner for sletting og eksport av data
-- =====================================================================
-- Kjør i Supabase SQL Editor på toppen av eksisterende database.
-- =====================================================================

-- 1) Slett hele husholdningen og all data — kalles av eieren
create or replace function delete_my_household()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_household_id uuid;
  is_owner boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select household_id, role = 'owner' into my_household_id, is_owner
  from household_members
  where user_id = auth.uid()
  limit 1;

  if my_household_id is null then
    raise exception 'Ingen husholdning funnet for denne brukeren';
  end if;

  if not is_owner then
    raise exception 'Bare eieren kan slette husholdningen';
  end if;

  -- Cascade deletes håndterer resten via ON DELETE CASCADE
  delete from households where id = my_household_id;
end $$;

grant execute on function delete_my_household() to authenticated;

-- 2) Eksporter all data for husholdningen som JSON
create or replace function export_my_household()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  my_household_id uuid;
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select household_id into my_household_id
  from household_members
  where user_id = auth.uid()
  limit 1;

  if my_household_id is null then
    raise exception 'Ingen husholdning funnet';
  end if;

  select jsonb_build_object(
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
      select coalesce(jsonb_agg(to_jsonb(p) - 'pin'), '[]'::jsonb)
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
    ),
    'streak_rewards', (
      select coalesce(jsonb_agg(to_jsonb(sr)), '[]'::jsonb)
      from streak_rewards sr where sr.household_id = my_household_id
    ),
    'streak_claims', (
      select coalesce(jsonb_agg(to_jsonb(sc)), '[]'::jsonb)
      from streak_claims sc where sc.household_id = my_household_id
    )
  ) into result;

  return result;
end $$;

grant execute on function export_my_household() to authenticated;
