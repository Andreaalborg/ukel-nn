-- =====================================================================
-- v6: Feature gating + complimentary Premium for testbrukere/venner
-- =====================================================================
-- Legger til:
--  * comp_until — Premium gratis frem til denne datoen (sett via SQL)
--  * comp_note — notat (f.eks. 'Venn av André', 'Tester')
--
-- Oppdaterer household_is_premium() til å sjekke comp_until også.
-- =====================================================================

alter table households
  add column if not exists comp_until timestamptz,
  add column if not exists comp_note text;

-- Oppdater is_premium-funksjonen til å inkludere comp-tilgang
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

-- =====================================================================
-- Slik gir du noen gratis Premium (kjør i SQL Editor)
-- =====================================================================
--
-- For en bestemt husholdning (finn id med: select id, name from households;)
--
--   update households
--   set comp_until = now() + interval '1 year',
--       comp_note = 'Venn fra Facebook-gruppe'
--   where id = 'household-id-her';
--
-- For å gi til alle eksisterende brukere mens vi er i tidlig beta:
--
--   update households
--   set comp_until = '2027-01-01'::timestamptz,
--       comp_note = 'Tidlig beta-tester'
--   where stripe_subscription_id is null
--     and lifetime = false;
--
-- For å trekke tilbake comp:
--
--   update households
--   set comp_until = null,
--       comp_note = null
--   where id = 'household-id';
-- =====================================================================
