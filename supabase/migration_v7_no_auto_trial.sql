-- =====================================================================
-- v7: Fjern auto-trial — nye brukere starter på Free, ikke Premium
-- =====================================================================
-- Tidligere fikk hver ny husholdning subscription_status='trialing' +
-- trial_ends_at=14 dager fram. Det ga gratis Premium til ALLE nye brukere
-- uten at de gikk gjennom Stripe Checkout.
--
-- Ny modell: alle starter på Free. Trial-perioden gis kun via Stripe
-- når brukeren aktivt klikker "Oppgrader" og fullfører Checkout.
-- =====================================================================

-- 1) Endre default for nye husholdninger
alter table households alter column subscription_status set default 'none';

-- 2) Endre plan-default til 'free'
alter table households alter column plan set default 'free';

-- 3) Rydd opp eksisterende brukere som har fått auto-trial uten å betale
update households
set
  subscription_status = 'none',
  trial_ends_at = null,
  plan = case
    when lifetime then 'lifetime'
    when stripe_subscription_id is not null then plan
    else 'free'
  end
where
  stripe_subscription_id is null   -- ikke startet ekte abonnement
  and lifetime = false             -- ikke betalt Lifetime
  and (comp_until is null or comp_until < now());   -- ikke gitt comp-tilgang

-- 4) Oppdater create_household_with_owner() til å sette free + none som default
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
  values (
    coalesce(nullif(trim(p_name), ''), 'Min familie'),
    'free',
    'none'
  )
  returning id into new_household_id;

  insert into household_members (household_id, user_id, role, display_name)
  values (new_household_id, auth.uid(), 'owner', p_display_name);

  return new_household_id;
end $$;

grant execute on function create_household_with_owner(text, text) to authenticated;

-- 5) Oppdatert helper: håndter null subscription_status pent
create or replace function household_is_premium(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        lifetime
        or subscription_status in ('active', 'trialing')
        or (trial_ends_at is not null and trial_ends_at > now())
        or (comp_until is not null and comp_until > now())
      from households
      where id = hid
    ),
    false
  );
$$;
