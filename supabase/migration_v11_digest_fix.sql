-- Hotfix: pgcrypto digest(text, unknown) → convert_to for stable overload
create or replace function _hash_session_token(p_token text)
returns text
language sql
immutable
as $$
  select encode(digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;
