-- =====================================================================
-- DELTA: if migration_v11 failed on "pin NOT NULL" after pin_hash backfill
-- Run this alone in Supabase SQL Editor, then re-run the remainder of v11
-- OR re-run full migration_v11 (idempotent parts are safe).
-- =====================================================================

alter table profiles alter column pin drop not null;

update profiles set pin = null where pin is not null;

-- If the rest of v11 never ran (no profile_sessions table), run the full
-- migration_v11_pin_sessions.sql after this delta.
