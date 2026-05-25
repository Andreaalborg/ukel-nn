-- =====================================================================
-- v5: Stripe-integrasjon
-- =====================================================================
-- Legger til Stripe-relaterte felt på households-tabellen og en
-- subscription_events-tabell for revisjonsspor (audit log).
-- =====================================================================

-- 1) Utvid households med Stripe-felt
alter table households
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text default 'trialing'
    check (subscription_status in (
      'trialing', 'active', 'past_due', 'canceled', 'unpaid',
      'incomplete', 'incomplete_expired', 'paused', 'none'
    )),
  add column if not exists current_period_end timestamptz,
  add column if not exists lifetime boolean not null default false;

-- Sett trial_ends_at for eksisterende husholdninger til 14 dager fra opprettelse
update households
set trial_ends_at = created_at + interval '14 days'
where trial_ends_at is null;

-- Oppdater plan-constraint så vi har eksplisitte verdier
alter table households drop constraint if exists households_plan_check;
alter table households add constraint households_plan_check
  check (plan in ('free', 'trial', 'family', 'family_plus', 'lifetime', 'beta'));

-- Indekser for raske oppslag fra webhook-handler
create index if not exists households_stripe_customer_idx
  on households(stripe_customer_id);
create index if not exists households_stripe_subscription_idx
  on households(stripe_subscription_id);

-- 2) Audit log over Stripe-events
create table if not exists subscription_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  stripe_event_id text unique, -- Stripe event ID for å unngå duplikater
  event_type text not null,
  payload jsonb,
  created_at timestamptz default now()
);

create index if not exists sub_events_household_idx
  on subscription_events(household_id);
create index if not exists sub_events_type_idx
  on subscription_events(event_type);

-- RLS
alter table subscription_events enable row level security;
drop policy if exists "members can read events" on subscription_events;
create policy "members can read events" on subscription_events
  for select using (is_household_member(household_id));
-- Insert kun fra service role (webhook)

-- 3) Helper: er husholdningen Premium akkurat nå?
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
      from households
      where id = hid
    ),
    false
  );
$$;

grant execute on function household_is_premium(uuid) to authenticated;
