-- Hotfix v3: pgcrypto lives in extensions schema on Supabase;
-- clear_profile_session uses search_path=public so bare digest() is invisible.
create or replace function _hash_session_token(p_token text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;
