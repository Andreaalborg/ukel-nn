-- =========================================================
-- NULLSTILL TESTDATA
-- Tømmer all aktivitet (fullføringer, saldoer, perioder)
-- men beholder oppsettet: profiler, oppgaver, premier, strekk
-- =========================================================
-- Kjør i Supabase SQL Editor.

-- 1. Slett all aktivitet
truncate table task_completions cascade;
truncate table bonus_claims cascade;
truncate table payouts cascade;
truncate table period_achievements cascade;
truncate table streak_claims cascade;
truncate table custody_periods cascade;

-- 2. Nullstill saldoer og XP på alle profiler
update profiles set balance_ore = 0, xp = 0;

-- Ferdig! Du har nå en ren slate med samme oppsett som før.


-- =========================================================
-- VALGFRITT: HARD RESET (sletter ALT inkl. oppsett)
-- =========================================================
-- Fjern -- foran linjene under hvis du også vil tømme
-- oppgaver, premier, strekk-bonuser, og profiler.
-- VARSEL: Du må kjøre schema.sql + migration_v2.sql igjen for
-- å sette opp standardprofilene på nytt etter dette.

-- truncate table streak_rewards cascade;
-- truncate table bonuses cascade;
-- truncate table tasks cascade;
-- truncate table badges cascade;
-- truncate table profiles cascade;
